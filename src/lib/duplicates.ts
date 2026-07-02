import type { Tables } from './database.types'

type Subscription = Tables<'subscriptions'>

export interface DuplicateGroup {
  category: Subscription['category']
  subscriptions: Subscription[]
}

export function findDuplicateGroups(subscriptions: Subscription[]): DuplicateGroup[] {
  const byCategory = new Map<string, Subscription[]>()

  for (const s of subscriptions) {
    if (s.status !== 'active') continue
    const group = byCategory.get(s.category) ?? []
    group.push(s)
    byCategory.set(s.category, group)
  }

  return [...byCategory.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([category, group]) => ({ category: category as Subscription['category'], subscriptions: group }))
}
