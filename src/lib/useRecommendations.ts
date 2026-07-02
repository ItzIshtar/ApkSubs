import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import type { Tables } from './database.types'

type Recommendation = Tables<'recommendations'>

export function useRecommendations(userId: string) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('recommendations')
      .select('*')
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else {
      setRecommendations(data)
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh, userId])

  async function dismiss(id: string) {
    const { error } = await supabase
      .from('recommendations')
      .update({ is_dismissed: true })
      .eq('id', id)
    if (error) return error.message
    await refresh()
    return null
  }

  return { recommendations, loading, error, dismiss }
}
