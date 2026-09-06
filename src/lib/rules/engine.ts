import type { Rule } from '@/types'

export function ruleMatches(rule: Rule, description: string): boolean {
  if (!rule.pattern) return false
  if (rule.matchType === 'contains') {
    return description.toLowerCase().includes(rule.pattern.toLowerCase())
  }
  try {
    const re = new RegExp(rule.pattern, 'i')
    return re.test(description)
  } catch {
    return false
  }
}

/** Rules are evaluated in ascending priority order (lower number = evaluated first); first match wins. */
export function findMatchingCategory(rules: Rule[], description: string): string | null {
  const sorted = [...rules].sort((a, b) => a.priority - b.priority)
  for (const rule of sorted) {
    if (ruleMatches(rule, description)) return rule.categoryId
  }
  return null
}
