import { useSyncExternalStore } from 'react'

/**
 * Per-row judging aid: Adopt / Adjust / Reject plus a free-text note, kept in
 * localStorage (per viewer) and exportable as Markdown + JSON. Every storage
 * access is wrapped: a private window or blocked storage just means verdicts
 * are not remembered.
 */

export type AppId = 'admin' | 'web' | 'mobile'
export type Verdict = 'adopt' | 'adjust' | 'reject'
export interface RowVerdict {
  verdict?: Verdict
  note?: string
  /** For rows that offer several live options: the one last shown / preferred (its label). */
  option?: string
}
export type VerdictState = Record<AppId, Record<string, RowVerdict>>

const KEY = 'uilp:verdicts:v1'
const EMPTY: VerdictState = { admin: {}, web: {}, mobile: {} }

function load(): VerdictState {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<VerdictState>
    return { admin: parsed.admin ?? {}, web: parsed.web ?? {}, mobile: parsed.mobile ?? {} }
  } catch {
    return EMPTY
  }
}

let state: VerdictState = load()
const listeners = new Set<() => void>()

function save() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage unavailable: keep in memory only */
  }
}

export function setRowVerdict(app: AppId, row: string, patch: RowVerdict) {
  const prev = state[app][row] ?? {}
  const next: RowVerdict = { ...prev, ...patch }
  state = { ...state, [app]: { ...state[app], [row]: next } }
  save()
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useVerdicts(): VerdictState {
  return useSyncExternalStore(subscribe, () => state)
}

export const VERDICT_LABEL: Record<Verdict, string> = { adopt: 'Adopt', adjust: 'Adjust', reject: 'Reject' }

export interface ExportRow {
  app: AppId
  name: string
  group: string
  replaceWith: string
  /** The preview's recommended option, if the row offers several. */
  recommended?: string
  /** shadcn fit, 1 to 5. */
  fit?: number
}

/** Markdown + JSON of every verdict, in catalogue order, for handing back to an agent. */
export function buildExport(rows: ExportRow[], s: VerdictState) {
  const json = rows.map((r) => ({ ...r, verdict: s[r.app][r.name]?.verdict ?? null, recommended: r.recommended ?? null, fit: r.fit ?? null, option: s[r.app][r.name]?.option ?? null, note: s[r.app][r.name]?.note ?? '' }))
  const lines: string[] = ['# UI library preview: verdicts', '']
  for (const app of ['admin', 'web', 'mobile'] as AppId[]) {
    const appRows = json.filter((r) => r.app === app)
    const counts = { adopt: 0, adjust: 0, reject: 0, none: 0 }
    appRows.forEach((r) => (r.verdict ? counts[r.verdict]++ : counts.none++))
    lines.push(`## ${app}`, '', `Adopt ${counts.adopt} · Adjust ${counts.adjust} · Reject ${counts.reject} · Undecided ${counts.none}`, '')
    lines.push('| Row | Group | Proposed | shadcn fit | Recommended option | Preferred option | Verdict | Note |', '|---|---|---|---|---|---|---|---|')
    for (const r of appRows) {
      const esc = (t: string) => t.replace(/\|/g, '\\|').replace(/\n/g, ' ')
      lines.push(`| ${esc(r.name)} | ${r.group} | ${esc(r.replaceWith)} | ${r.fit ?? ''} | ${r.recommended ? esc(r.recommended) : ''} | ${r.option ? esc(r.option) : ''} | ${r.verdict ? VERDICT_LABEL[r.verdict] : ''} | ${esc(r.note)} |`)
    }
    lines.push('')
  }
  return { markdown: lines.join('\n'), json: JSON.stringify(json, null, 2) }
}

export function download(filename: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
