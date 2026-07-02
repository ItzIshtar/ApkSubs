import type { Tables } from '../lib/database.types'

type Subscription = Tables<'subscriptions'>

export function SubscriptionList({
  subscriptions,
  onEdit,
  onDelete,
}: {
  subscriptions: Subscription[]
  onEdit: (s: Subscription) => void
  onDelete: (id: string) => void
}) {
  if (subscriptions.length === 0) {
    return <p className="subtitle">Todavía no tienes suscripciones registradas.</p>
  }

  return (
    <ul className="subscription-list">
      {subscriptions.map((s) => (
        <li key={s.id} className="subscription-item">
          <div>
            <strong>{s.service_name}</strong>
            <span className="subtitle">
              {' '}
              — {s.currency} {s.amount} / {s.billing_cycle} — próximo cobro {s.next_billing_date}
            </span>
          </div>
          <div className="subscription-actions">
            <button type="button" className="auth-toggle" onClick={() => onEdit(s)}>
              Editar
            </button>
            <button type="button" className="auth-toggle" onClick={() => onDelete(s.id)}>
              Eliminar
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
