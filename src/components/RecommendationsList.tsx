import type { Tables } from '../lib/database.types'

type Recommendation = Tables<'recommendations'>

export function RecommendationsList({
  recommendations,
  onDismiss,
}: {
  recommendations: Recommendation[]
  onDismiss: (id: string) => void
}) {
  if (recommendations.length === 0) return null

  return (
    <div className="insight-banner insight-recommendations">
      <strong>Recomendaciones de ahorro</strong>
      <ul>
        {recommendations.map((r) => (
          <li key={r.id}>
            <span>
              {r.suggested_action}
              {r.estimated_savings ? ` (ahorro estimado ${r.currency} ${r.estimated_savings})` : ''}
            </span>
            <button type="button" className="auth-toggle" onClick={() => onDismiss(r.id)}>
              Descartar
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
