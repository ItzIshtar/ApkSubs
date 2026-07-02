import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import type { Tables, TablesUpdate } from './database.types'

type Profile = Tables<'profiles'>

export function useProfile(userId: string) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (error) setError(error.message)
    else {
      setProfile(data)
      setError(null)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function updateProfile(input: TablesUpdate<'profiles'>) {
    const { error } = await supabase.from('profiles').update(input).eq('id', userId)
    if (error) return error.message
    await refresh()
    return null
  }

  return { profile, loading, error, updateProfile }
}
