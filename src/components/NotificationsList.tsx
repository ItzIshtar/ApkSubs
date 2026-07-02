import type { Tables } from '../lib/database.types'

type Notification = Tables<'notifications'>

export function NotificationsList({
  notifications,
  onMarkRead,
}: {
  notifications: Notification[]
  onMarkRead: (id: string) => void
}) {
  if (notifications.length === 0) return null

  return (
    <div className="insight-banner insight-notifications">
      <strong>Notificaciones</strong>
      <ul>
        {notifications.map((n) => (
          <li key={n.id}>
            <span>{n.message}</span>
            <button type="button" className="auth-toggle" onClick={() => onMarkRead(n.id)}>
              Marcar leída
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
