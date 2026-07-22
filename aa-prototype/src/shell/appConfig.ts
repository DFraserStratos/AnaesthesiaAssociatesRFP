/**
 * The app registry — single source for the six surfaces behind the app
 * switcher: their routes, switcher labels, and the persona each runs as.
 * Both the router and the AppSwitcher read from here.
 */

export type AppId =
  | 'mobile'
  | 'web'
  | 'admin'
  | 'demo-xero'
  | 'demo-integrations'
  | 'demo-control'
  | 'demo-data'

export interface Persona {
  name: string
  /** Avatar initials (crimson-tint avatar — identity use of the brand). */
  initials: string
  role: string
  /** Anaesthetist registration number (their master ID) — set for clinician personas. */
  anaesthetistId?: string
}

/** Demo personas from the design (Decisions log 2026-07-21). */
export const PERSONAS = {
  souter: { name: 'Dr Melanie Souter', initials: 'MS', role: 'Anaesthetist', anaesthetistId: '34821' },
  kirsty: { name: 'Kirsty W.', initials: 'KW', role: 'Office' },
} as const satisfies Record<string, Persona>

export interface AppConfig {
  id: AppId
  /** Label shown in the app-switcher dropdown. */
  label: string
  /** Route path. */
  path: string
  persona: Persona
  /** Switcher grouping: the three apps vs the demo-only surfaces. */
  group: 'apps' | 'demo'
}

export const APP_CONFIG: Record<AppId, AppConfig> = {
  mobile: {
    id: 'mobile',
    label: 'Anaesthetist Mobile App',
    path: '/mobile',
    persona: PERSONAS.souter,
    group: 'apps',
  },
  web: {
    id: 'web',
    label: 'Anaesthetist Web App',
    path: '/web',
    persona: PERSONAS.souter,
    group: 'apps',
  },
  admin: {
    id: 'admin',
    label: 'Admin Web App',
    path: '/admin',
    persona: PERSONAS.kirsty,
    group: 'apps',
  },
  'demo-xero': {
    id: 'demo-xero',
    label: 'Demo: Billing Monitor & Xero',
    path: '/demo/xero',
    persona: PERSONAS.kirsty,
    group: 'demo',
  },
  'demo-integrations': {
    id: 'demo-integrations',
    label: 'Demo: Integrations',
    path: '/demo/integrations',
    persona: PERSONAS.kirsty,
    group: 'demo',
  },
  'demo-control': {
    id: 'demo-control',
    label: 'Demo: Control Panel',
    path: '/demo/control',
    persona: PERSONAS.kirsty,
    group: 'demo',
  },
  'demo-data': {
    id: 'demo-data',
    label: 'Demo: Data Inspector',
    path: '/demo/data',
    persona: PERSONAS.kirsty,
    group: 'demo',
  },
}

/** Switcher / iteration order (apps first, then demo surfaces). */
export const APP_ORDER: readonly AppId[] = [
  'mobile',
  'web',
  'admin',
  'demo-xero',
  'demo-integrations',
  'demo-control',
  'demo-data',
] as const

/** Which app a route belongs to, or null if the path matches none. */
export function appIdForPath(pathname: string): AppId | null {
  for (const id of APP_ORDER) {
    const { path } = APP_CONFIG[id]
    if (pathname === path || pathname.startsWith(path + '/')) return id
  }
  return null
}
