import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Shared secret validated against the `x-cron-secret` header. This function is
// invoked only by our own pg_cron job (see supabase/migrations/00004_schedule_insights_cron.sql),
// never by end users, so verify_jwt is disabled and this header is the auth mechanism instead.
// Set via `supabase secrets set CRON_SECRET=...` — never hardcode it here.
const CRON_SECRET = Deno.env.get('CRON_SECRET')!

type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly'

interface Subscription {
  id: string
  user_id: string
  service_name: string
  category: string
  amount: number
  currency: string
  billing_cycle: BillingCycle
  next_billing_date: string
  status: string
}

function monthlyEquivalent(sub: Subscription): number {
  switch (sub.billing_cycle) {
    case 'weekly':
      return sub.amount * 4.33
    case 'monthly':
      return sub.amount
    case 'quarterly':
      return sub.amount / 3
    case 'yearly':
      return sub.amount / 12
  }
}

function daysUntil(dateStr: string, todayStr: string): number {
  const ms = new Date(dateStr).getTime() - new Date(todayStr).getTime()
  return Math.round(ms / 86_400_000)
}

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const today = new Date().toISOString().slice(0, 10)

  const { data: subs, error: subsError } = await supabase
    .from('subscriptions')
    .select('id, user_id, service_name, category, amount, currency, billing_cycle, next_billing_date, status')
    .eq('status', 'active')

  if (subsError) {
    return new Response(JSON.stringify({ error: subsError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const subscriptions = (subs ?? []) as Subscription[]

  const userIds = [...new Set(subscriptions.map((s) => s.user_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, notification_lead_days')
    .in('id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000'])

  const leadDaysByUser = new Map((profiles ?? []).map((p) => [p.id, p.notification_lead_days as number]))

  let notificationsCreated = 0
  let recommendationsCreated = 0

  // --- 1. Duplicados: >1 suscripción activa en la misma categoría ---
  const byUserCategory = new Map<string, Subscription[]>()
  for (const s of subscriptions) {
    const key = `${s.user_id}:${s.category}`
    const group = byUserCategory.get(key) ?? []
    group.push(s)
    byUserCategory.set(key, group)
  }

  for (const [key, group] of byUserCategory) {
    if (group.length < 2) continue
    const [userId, category] = key.split(':')

    // Sin filtro is_dismissed: una vez sugerido, no se repite aunque el
    // usuario lo haya descartado (evita spam diario del cron).
    const { data: existing } = await supabase
      .from('recommendations')
      .select('id')
      .eq('user_id', userId)
      .ilike('suggested_action', `%duplicad%${category}%`)
      .limit(1)

    if (existing && existing.length > 0) continue

    const sorted = [...group].sort((a, b) => monthlyEquivalent(a) - monthlyEquivalent(b))
    const cheapest = sorted[0]
    const totalMonthly = group.reduce((sum, g) => sum + monthlyEquivalent(g), 0)
    const savings = Number((totalMonthly - monthlyEquivalent(cheapest)).toFixed(2))
    const names = group.map((g) => g.service_name).join(', ')

    const { error: recError } = await supabase.from('recommendations').insert({
      user_id: userId,
      subscription_id: group.find((g) => g.id !== cheapest.id)?.id ?? null,
      suggested_action: `Tienes ${group.length} suscripciones activas duplicadas en la categoría "${category}": ${names}. Considera quedarte solo con "${cheapest.service_name}".`,
      estimated_savings: savings,
      currency: group[0].currency,
    })
    if (!recError) recommendationsCreated++

    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: userId,
      subscription_id: group[0].id,
      type: 'duplicate_service',
      message: `Detectamos ${group.length} suscripciones activas de "${category}": ${names}.`,
    })
    if (!notifError) notificationsCreated++
  }

  // --- 2. Próximos cobros dentro de la ventana de aviso del usuario ---
  for (const s of subscriptions) {
    const leadDays = leadDaysByUser.get(s.user_id) ?? 3
    const remaining = daysUntil(s.next_billing_date, today)
    if (remaining < 0 || remaining > leadDays) continue

    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('subscription_id', s.id)
      .eq('type', 'upcoming_payment')
      .eq('scheduled_for', s.next_billing_date)
      .limit(1)

    if (existing && existing.length > 0) continue

    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: s.user_id,
      subscription_id: s.id,
      type: 'upcoming_payment',
      message: `${s.service_name} cobrará ${s.currency} ${s.amount} el ${s.next_billing_date}.`,
      scheduled_for: s.next_billing_date,
    })
    if (!notifError) notificationsCreated++
  }

  // --- 3. Ahorro: sugerir plan anual para suscripciones mensuales ---
  // Heurística simple (sin datos reales de precios de planes anuales):
  // se asume un ahorro estimado del 15% al pasar de mensual a anual.
  const ANNUAL_SWITCH_HEURISTIC = 0.15

  for (const s of subscriptions) {
    if (s.billing_cycle !== 'monthly') continue

    const estimatedYearlySavings = Number((s.amount * 12 * ANNUAL_SWITCH_HEURISTIC).toFixed(2))
    if (estimatedYearlySavings <= 0) continue

    // Igual que arriba: no repetir aunque se haya descartado.
    const { data: existing } = await supabase
      .from('recommendations')
      .select('id')
      .eq('subscription_id', s.id)
      .ilike('suggested_action', '%plan anual%')
      .limit(1)

    if (existing && existing.length > 0) continue

    const { error: recError } = await supabase.from('recommendations').insert({
      user_id: s.user_id,
      subscription_id: s.id,
      suggested_action: `Cambiar "${s.service_name}" a un plan anual podría ahorrarte hasta ${s.currency} ${estimatedYearlySavings}/año (estimado).`,
      estimated_savings: estimatedYearlySavings,
      currency: s.currency,
    })
    if (!recError) recommendationsCreated++
  }

  return new Response(
    JSON.stringify({ ok: true, subscriptionsScanned: subscriptions.length, notificationsCreated, recommendationsCreated }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
