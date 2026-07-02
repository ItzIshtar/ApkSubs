import type { DuplicateGroup } from '../lib/duplicates'

export function DuplicateWarning({ groups }: { groups: DuplicateGroup[] }) {
  if (groups.length === 0) return null

  return (
    <div className="insight-banner insight-warning">
      <strong>Posibles duplicados</strong>
      <ul>
        {groups.map((g) => (
          <li key={g.category}>
            Tienes {g.subscriptions.length} suscripciones activas en{' '}
            <strong>{g.category}</strong>: {g.subscriptions.map((s) => s.service_name).join(', ')}
          </li>
        ))}
      </ul>
    </div>
  )
}
