import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import type { Tables, TablesInsert, TablesUpdate } from './database.types'

type Subscription = Tables<'subscriptions'>

export function useSubscriptions(userId: string) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('next_billing_date', { ascending: true })

    if (error) setError(error.message)
    else {
      setSubscriptions(data)
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh, userId])

  async function addSubscription(input: Omit<TablesInsert<'subscriptions'>, 'user_id'>) {
    const { error } = await supabase
      .from('subscriptions')
      .insert({ ...input, user_id: userId })
    if (error) return error.message
    await refresh()
    return null
  }

  async function updateSubscription(id: string, input: TablesUpdate<'subscriptions'>) {
    const { error } = await supabase.from('subscriptions').update(input).eq('id', id)
    if (error) return error.message
    await refresh()
    return null
  }

  async function deleteSubscription(id: string) {
    const { error } = await supabase.from('subscriptions').delete().eq('id', id)
    if (error) return error.message
    await refresh()
    return null
  }

  return { subscriptions, loading, error, addSubscription, updateSubscription, deleteSubscription }
}
