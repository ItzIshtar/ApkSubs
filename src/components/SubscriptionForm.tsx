import { useState } from 'react'
import type { FormEvent } from 'react'
import { Constants } from '../lib/database.types'
import type { Tables, TablesInsert } from '../lib/database.types'

type Subscription = Tables<'subscriptions'>
type SubscriptionInput = Omit<TablesInsert<'subscriptions'>, 'user_id'>

const CATEGORIES = Constants.public.Enums.subscription_category
const CYCLES = Constants.public.Enums.billing_cycle
const STATUSES = Constants.public.Enums.subscription_status

export function SubscriptionForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Subscription
  onSubmit: (input: SubscriptionInput) => Promise<string | null>
  onCancel: () => void
}) {
  const [serviceName, setServiceName] = useState(initial?.service_name ?? '')
  const [category, setCategory] = useState<Subscription['category']>(initial?.category ?? 'other')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [billingCycle, setBillingCycle] = useState<Subscription['billing_cycle']>(
    initial?.billing_cycle ?? 'monthly'
  )
  const [nextBillingDate, setNextBillingDate] = useState(initial?.next_billing_date ?? '')
  const [status, setStatus] = useState<Subscription['status']>(initial?.status ?? 'active')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const result = await onSubmit({
      service_name: serviceName,
      category,
      amount: Number(amount),
      billing_cycle: billingCycle,
      next_billing_date: nextBillingDate,
      status,
    })

    setSaving(false)
    if (result) setError(result)
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <label>
        Servicio
        <input
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
          placeholder="Netflix, Spotify…"
          required
        />
      </label>

      <label>
        Categoría
        <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label>
        Monto
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </label>

      <label>
        Frecuencia de cobro
        <select
          value={billingCycle}
          onChange={(e) => setBillingCycle(e.target.value as typeof billingCycle)}
        >
          {CYCLES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label>
        Próximo cobro
        <input
          type="date"
          value={nextBillingDate}
          onChange={(e) => setNextBillingDate(e.target.value)}
          required
        />
      </label>

      <label>
        Estado
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="auth-error">{error}</p>}

      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? 'Guardando…' : initial ? 'Guardar cambios' : 'Agregar suscripción'}
      </button>
      <button type="button" className="auth-toggle" onClick={onCancel}>
        Cancelar
      </button>
    </form>
  )
}
