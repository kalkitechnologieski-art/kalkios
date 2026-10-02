export const ROLE_ROUTES: Record<string, string> = {
  ceo: '/admin',
  admin: '/admin',
  manager: '/admin',
  developer: '/employee',
  support: '/employee',
  hr: '/employee',
  employee: '/employee',
  client: '/client',
}

export function landingRouteForRole(role: string | null | undefined): string {
  return ROLE_ROUTES[role ?? 'client'] ?? '/client'
}
