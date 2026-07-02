import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Tables, TablesUpdate } from '../lib/database.types'

type Profile = Tables<'profiles'>

const CURRENCIES = ['MXN', 'USD', 'EUR', 'GBP', 'CAD', 'ARS', 'COP', 'CLP', 'PEN', 'BRL']

export function SettingsForm({
  profile,
  onSubmit,
  onCancel,
}: {
  profile: Profile
  onSubmit: (input: TablesUpdate<'profiles'>) => Promise<string | null>
  onCancel: () => void
}) {
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [currency, setCurrency] = useState(profile.currency_preference)
  const [leadDays, setLeadDays] = useState(String(profile.notification_lead_days))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)

    const result = await onSubmit({
      full_name: fullName || null,
      currency_preference: currency,
      notification_lead_days: Number(leadDays),
    })

    setSaving(false)
    if (result) setError(result)
    else setSaved(true)
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <label>
        Nombre
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Tu nombre"
        />
      </label>

      <label>
        Moneda preferida
        <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label>
        Avisar próximo cobro con (días de anticipación)
        <input
          type="number"
          min="0"
          max="30"
          value={leadDays}
          onChange={(e) => setLeadDays(e.target.value)}
          required
        />
      </label>

      {error && <p className="auth-error">{error}</p>}
      {saved && <p className="auth-message">Preferencias guardadas.</p>}

      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? 'Guardando…' : 'Guardar preferencias'}
      </button>
      <button type="button" className="auth-toggle" onClick={onCancel}>
        Cerrar
      </button>
    </form>
  )
}
