import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import type { Tables } from './database.types'

type Notification = Tables<'notifications'>

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('is_read', false)
      .order('scheduled_for', { ascending: true })

    if (error) setError(error.message)
    else {
      setNotifications(data)
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh, userId])

  async function markRead(id: string) {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    if (error) return error.message
    await refresh()
    return null
  }

  return { notifications, loading, error, markRead }
}
