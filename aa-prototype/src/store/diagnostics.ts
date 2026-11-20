/**
 * The diagnostic log (catch-up Phase 43; US-15.0.6, logs and telemetry): the
 * one place the app writes to the console. Every message and every string in
 * its context is redacted of NHIs before it is kept or printed, so a health
 * identifier can never leak through a log, an error message or a refusal.
 * Diagnostic data names internal record ids, never patient identity.
 *
 * A bounded ring buffer (the last 200 entries), in memory only: never
 * persisted, never in `AppState`. The NHI leak scan reads it.
 */

import { redactNhis } from '../domain/privacy/nhiDetect'

export type DiagnosticLevel = 'info' | 'warn' | 'error' | 'refusal'

export interface DiagnosticEntry {
  level: DiagnosticLevel
  message: string
  context?: Record<string, unknown>
  /** A sequence number, not a time: the log carries no clock. */
  seq: number
}

export const DIAGNOSTICS_KEPT = 200

const buffer: DiagnosticEntry[] = []
let seq = 0
/**
 * Refusal messages already kept. Some guards return a refusal on every render
 * (a List's edit rights), so each distinct refusal is kept once: what the scan
 * needs is the text people see, and the log must not lose real errors to them.
 */
const seenRefusals = new Set<string>()

function redactValue(value: unknown): unknown {
  if (typeof value === 'string') return redactNhis(value)
  if (value instanceof Error) return redactNhis(`${value.name}: ${value.message}`)
  if (Array.isArray(value)) return value.map(redactValue)
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = redactValue(v)
    return out
  }
  return value
}

/** Record (redacted) and forward to the console. */
export function reportDiagnostic(level: DiagnosticLevel, message: string, context?: Record<string, unknown>): DiagnosticEntry {
  if (level === 'refusal') {
    const key = `${redactNhis(message)}|${JSON.stringify(redactValue(context ?? {}))}`
    if (seenRefusals.has(key)) return { level, message: redactNhis(message), seq }
    seenRefusals.add(key)
  }
  seq += 1
  const entry: DiagnosticEntry = { level, message: redactNhis(message), seq, ...(context !== undefined ? { context: redactValue(context) as Record<string, unknown> } : {}) }
  buffer.push(entry)
  if (buffer.length > DIAGNOSTICS_KEPT) buffer.splice(0, buffer.length - DIAGNOSTICS_KEPT)
  if (level === 'refusal') return entry
  const sink = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info
  if (entry.context !== undefined) sink(entry.message, entry.context)
  else sink(entry.message)
  return entry
}

/** The kept entries, oldest first. */
export function recentDiagnostics(): readonly DiagnosticEntry[] {
  return buffer.slice()
}

/** Empty the log (tests). */
export function clearDiagnostics(): void {
  buffer.length = 0
  seenRefusals.clear()
}

let wired = false

/** Record uncaught errors and rejections (message and source only, redacted). Called once by each entry point. */
export function wireDiagnostics(): void {
  if (wired || typeof window === 'undefined') return
  wired = true
  window.addEventListener('error', (e) => {
    reportDiagnostic('error', e.message || 'Uncaught error', { source: e.filename ?? '' })
  })
  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason instanceof Error ? e.reason.message : String(e.reason)
    reportDiagnostic('error', `Unhandled rejection: ${reason}`)
  })
}
