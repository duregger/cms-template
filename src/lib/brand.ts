export const CMS_NAME = 'BEGIN the work CMS'
export const CMS_SHORT_NAME = 'BEGIN the work'
export const ADMIN_DOMAINS = ['beginthework.com'] as const

export function parseAllowList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

export function allowedEditorDomains(extraFromEnv?: string): string[] {
  return [...new Set([...ADMIN_DOMAINS, ...parseAllowList(extraFromEnv)])]
}

export function escapeRulesDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/\./g, '\\.')
}
