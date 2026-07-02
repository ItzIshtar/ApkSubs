import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import type { Tables } from './database.types'

type SpendRow = Tables<'monthly_spend_summary'>

export function useMonthlySpend(userId: string) {
  const [rows, setRows] = useState<SpendRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('monthly_spend_summary')
      .select('*')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setRows(data)
        setLoading(false)
      })
  }, [userId])

  return { rows, loading, error }
}
