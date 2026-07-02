import type { Tables } from '../lib/database.types'

type SpendRow = Tables<'monthly_spend_summary'>

export function MonthlySpendSummary({ rows }: { rows: SpendRow[] }) {
  if (rows.length === 0) return null

  return (
    <div className="insight-banner insight-spend">
      <strong>Gasto mensual estimado</strong>
      <ul>
        {rows.map((r) => (
          <li key={r.currency}>
            {r.currency} {r.estimated_monthly_spend?.toFixed(2)} / mes
          </li>
        ))}
      </ul>
    </div>
  )
}
