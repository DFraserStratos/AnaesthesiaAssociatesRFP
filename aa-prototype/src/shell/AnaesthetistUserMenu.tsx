import { Check, ChevronDown } from 'lucide-react'
import { useMemo } from 'react'
import { useAppStore } from '../store'
import { Avatar } from '../shared/Avatar'
import { PersonaChip } from '../shared/PersonaChip'
import { initialsOf } from '../shared/format'
import { PopoverPanel, usePopover } from '../shared/ui'
import { accent, neutral, radius } from '../theme/tokens'
import { motion } from '../theme/motion'
import { anaesthetistUserId, SCRIPTED_ANAESTHETIST_IDS, useAnaesthetistPersona } from './anaesthetistUser'

/**
 * The harness bar's "Signed in as" menu, shown on the Mobile and Web apps: the persona chip opens a
 * list of the scripted anaesthetists, and choosing one signs both apps in as them (a demo stand-in for
 * each anaesthetist signing in on their own device), so a story can show a List from its own
 * anaesthetist's phone. Choosing returns the app to its home, since the screen open may be the last
 * anaesthetist's. The demo actions stay scripted to Dr Souter.
 */
export function AnaesthetistUserMenu({ onChosen }: { onChosen: () => void }) {
  const { open, setOpen, toggle, rootRef, panelId, triggerProps } = usePopover()
  const persona = useAnaesthetistPersona()
  const current = useAppStore((s) => anaesthetistUserId(s.shell))
  const setAnaesthetistUser = useAppStore((s) => s.setAnaesthetistUser)
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const cast = useMemo(
    () =>
      SCRIPTED_ANAESTHETIST_IDS.flatMap((id) => {
        const a = anaesthetists[id]
        return a === undefined ? [] : [{ id, name: a.name }]
      }),
    [anaesthetists],
  )

  function choose(id: string) {
    setOpen(false)
    if (id === current) return
    setAnaesthetistUser(id)
    onChosen()
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        {...triggerProps}
        type="button"
        onClick={toggle}
        title="Signed in as"
        data-shot="harness-signed-in-as"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          border: 'none',
          background: 'transparent',
          color: neutral.surface,
          font: 'inherit',
          padding: '2px 4px',
          borderRadius: radius.ctl,
          cursor: 'pointer',
        }}
      >
        <PersonaChip persona={persona} size={28} gap={8} />
        <ChevronDown
          size={15}
          strokeWidth={2.5}
          aria-hidden
          style={{ color: 'rgba(255,255,255,0.7)', transform: open ? 'rotate(180deg)' : 'none', transition: `transform ${motion.uiFade.duration}ms` }}
        />
      </button>

      {open && (
        <PopoverPanel id={panelId} placement="end" width={280} padding={8}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: neutral.mist,
              padding: '6px 10px 4px',
            }}
          >
            Signed in as
          </div>
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {cast.map(({ id, name }) => {
              const isActive = id === current
              return (
                <button
                  key={id}
                  type="button"
                  data-anaesthetist-user={id}
                  aria-pressed={isActive}
                  onClick={() => choose(id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    background: isActive ? accent.tint : 'transparent',
                    color: isActive ? accent.pressed : neutral.ink,
                    borderRadius: radius.ctl,
                    padding: '7px 10px',
                    font: 'inherit',
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = neutral.sunken
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <Avatar initials={initialsOf(name)} size={24} variant="tint" />
                  <span style={{ flex: 1 }}>{name}</span>
                  {isActive && <Check size={16} strokeWidth={2.5} style={{ flex: 'none', color: accent.base }} />}
                </button>
              )
            })}
          </div>
        </PopoverPanel>
      )}
    </div>
  )
}
