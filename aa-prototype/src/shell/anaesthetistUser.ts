import { useMemo } from 'react'
import { ANAE } from '../domain/seed/cast'
import { initialsOf } from '../shared/format'
import { useAppStore } from '../store'
import type { Persona } from './appConfig'

/** The anaesthetists "Signed in as" offers: the scripted cast, Dr Souter first. */
export const SCRIPTED_ANAESTHETIST_IDS: readonly string[] = Object.values(ANAE)

/** The registration number the framed Mobile and Web apps are signed in as (Dr Souter unless switched). */
export function anaesthetistUserId(shell: { anaesthetistUser?: string }): string {
  return shell.anaesthetistUser ?? ANAE.souter
}

/**
 * The anaesthetist persona the Mobile and Web apps run as: Dr Souter, or whoever the harness bar's
 * "Signed in as" chose. The name and initials come from the anaesthetist record, so the phone, the web
 * nav and the harness chip all name the same person.
 */
export function useAnaesthetistPersona(): Persona {
  const id = useAppStore((s) => anaesthetistUserId(s.shell))
  const name = useAppStore((s) => s.masters.anaesthetists[id]?.name ?? 'Dr Melanie Souter')
  return useMemo(() => ({ name, initials: initialsOf(name), role: 'Anaesthetist', anaesthetistId: id }), [name, id])
}
