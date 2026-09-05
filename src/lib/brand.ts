export const CMS_NAME = 'CMS'
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

export function isBeginAdmin(email?: string | null): boolean {
  const domain = email?.split('@')[1]?.toLowerCase() ?? ''
  return (ADMIN_DOMAINS as readonly string[]).includes(domain)
}
