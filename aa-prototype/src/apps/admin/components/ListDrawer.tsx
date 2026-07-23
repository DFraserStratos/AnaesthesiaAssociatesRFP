import { useState } from 'react'
import { X } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { accent, neutral, radius, semantic } from '../../../theme/tokens'
import { useAppStore, type Actor } from '../../../store'
import { StatusChip } from '../../../shared'
import { sessionTimeRange } from '../../../shared/format'
import { attentionReasons, isBooked, surnameFirst } from '../util'
import { EditListSheet } from '../flows/EditListSheet'
import { ReassignListFlow } from '../flows/ReassignListFlow'
import { PhoneAdviceBooking } from '../flows/PhoneAdviceBooking'
import { MoveCardFlow } from '../flows/MoveCardFlow'

interface ListDrawerProps {
  listId: string
  actor: Actor
  onClose: () => void
  onOpenCard: (cardId: string) => void
}

type Sheet = 'none' | 'edit' | 'reassign' | 'phone' | { move: string }

export function ListDrawer({ listId, actor, onClose, onOpenCard }: ListDrawerProps) {
  const list = useAppStore((s) => s.schedule.lists[listId])
  const cardsRecord = useAppStore((s) => s.schedule.cards)
  const masters = useAppStore((s) => s.masters)
  const [sheet, setSheet] = useState<Sheet>('none')

  if (list === undefined) return null
  const cards = Object.values(cardsRecord)
    .filter((c) => c.listId === listId)
    .sort((a, b) => a.id.localeCompare(b.id))
  const activeCards = cards.filter((c) => c.cancellation === undefined)
  const anae = masters.anaesthetists[list.anaesthetistId]
  const hospital = list.hospitalId !== undefined ? masters.hospitals[list.hospitalId]?.name : 'Unassigned'
  const surgeon = list.surgeonId !== undefined ? masters.surgeons[list.surgeonId]?.name : 'Not assigned'
  const reasons = attentionReasons(list)
  const isFreeEmpty = list.statusKey === 'free' && activeCards.length === 0

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(23,35,32,0.32)', zIndex: 40 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 440, maxWidth: '100%', background: neutral.surface, zIndex: 41, boxShadow: '-8px 0 24px rgba(23,35,32,0.16)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${neutral.line}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{anae !== undefined ? surnameFirst(anae.name) : list.anaesthetistId}</div>
            <div style={{ fontSize: 13, color: neutral.slate, marginTop: 2 }}>{format(parseISO(list.dateISO), 'EEE d MMM')} · {list.session} · {list.state}</div>
            <div style={{ marginTop: 8 }}><StatusChip status={list.statusKey} /></div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ border: 'none', background: 'none', color: neutral.slate, cursor: 'pointer', padding: 4 }}>
            <X size={20} aria-hidden />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {reasons.length > 0 && (
            <div style={{ background: semantic.warning.tint, color: semantic.warning.onTint, borderRadius: radius.card, padding: 12, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <strong>Needs attention</strong>
              {reasons.map((r, i) => <span key={i}>{r}</span>)}
            </div>
          )}

          <Section label="Session">
            <Row label="Times">{sessionTimeRange(list)}</Row>
            <Row label="Hospital">{hospital}</Row>
            <Row label="Surgeon">{surgeon}</Row>
            {list.notes !== undefined && list.notes.trim() !== '' && <Row label="Note">{list.notes}</Row>}
          </Section>

          <Section label={`Cards (${activeCards.length})`}>
            {cards.length === 0 && <div style={{ fontSize: 13, color: neutral.mist }}>No cards on this list yet.</div>}
            {cards.map((card) => {
              const patient = masters.patients[card.patientId]
              const cancelled = card.cancellation !== undefined
              return (
                <div key={card.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderBottom: `1px solid ${neutral.line}`, opacity: cancelled ? 0.5 : 1 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: neutral.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{patient?.name ?? 'Unknown'}</div>
                    <div style={{ fontSize: 11, color: neutral.slate }}>{cancelled ? 'Cancelled' : card.completed ? 'Completed' : 'In progress'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
                    <DrawerLink onClick={() => onOpenCard(card.id)}>Open</DrawerLink>
                    {!cancelled && list.state !== 'AUTHORISED' && <DrawerLink onClick={() => setSheet({ move: card.id })}>Move</DrawerLink>}
                  </div>
                </div>
              )
            })}
          </Section>
        </div>

        {/* Actions */}
        <div style={{ padding: 20, borderTop: `1px solid ${neutral.line}`, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <ActionBtn onClick={() => setSheet('edit')}>Edit list</ActionBtn>
          {(isBooked(list.statusKey) || activeCards.length > 0) && <ActionBtn onClick={() => setSheet('reassign')}>Reassign list</ActionBtn>}
          {isFreeEmpty && <ActionBtn primary onClick={() => setSheet('phone')}>Book (phone advice)</ActionBtn>}
        </div>
      </div>

      <EditListSheet open={sheet === 'edit'} list={list} actor={actor} onClose={() => setSheet('none')} />
      <ReassignListFlow open={sheet === 'reassign'} list={list} actor={actor} onClose={() => setSheet('none')} onReassigned={() => { setSheet('none'); onClose() }} />
      <PhoneAdviceBooking open={sheet === 'phone'} list={list} actor={actor} onClose={() => setSheet('none')} onBooked={() => setSheet('none')} />
      {typeof sheet === 'object' && (
        <MoveCardFlow open cardId={sheet.move} actor={actor} onClose={() => setSheet('none')} onMoved={() => setSheet('none')} />
      )}
    </>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist, textTransform: 'uppercase' }}>{label}</div>
      {children}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <span style={{ width: 72, flex: 'none', fontSize: 12, color: neutral.mist }}>{label}</span>
      <span style={{ flex: 1, fontSize: 14, color: neutral.ink }}>{children}</span>
    </div>
  )
}

function DrawerLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{ border: `1px solid ${neutral.line}`, background: neutral.surface, color: accent.base, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', borderRadius: 8, padding: '4px 10px' }}>
      {children}
    </button>
  )
}

function ActionBtn({ onClick, children, primary }: { onClick: () => void; children: React.ReactNode; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ flex: primary === true ? '1 1 100%' : undefined, minHeight: 40, padding: '0 14px', borderRadius: radius.ctl, border: primary === true ? 'none' : `1px solid ${neutral.line}`, background: primary === true ? accent.base : neutral.surface, color: primary === true ? '#FFFFFF' : neutral.slate, fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
    >
      {children}
    </button>
  )
}
