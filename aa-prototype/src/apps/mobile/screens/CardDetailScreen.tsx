import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, Copy, ImagePlus, Minus, Plus, XCircle } from 'lucide-react'
import { accent, brand, neutral, radius, semantic } from '../../../theme/tokens'
import type { Procedure } from '../../../domain/types'
import { copyCard, editCard, useAppStore, useToday, type Actor } from '../../../store'
import { StatusChip } from '../../../shared'
import { MobileButton } from '../components'
import { ageYears, formatDob, nhiBadge } from '../format'
import { PAPER_CARD_A } from '../../../assets/samplePaperCards'
import { CancelCardSheet } from '../flows/CancelCardSheet'
import { EditPatientSheet } from '../flows/EditPatientSheet'
import { EditProcedureSheet } from '../flows/EditProcedureSheet'

interface CardDetailScreenProps {
  cardId: string
  actor: Actor
  onBack: () => void
  onCopied: () => void
}

const ROUTE_LABEL: Record<string, string> = {
  hospital: 'Hospital / contract holder',
  billableParty: 'Billable party',
  insurer: 'Insurer (direct claim)',
}

function shiftTime(time: string, deltaMin: number): string {
  const base = time === '' ? 8 * 60 : Number(time.slice(0, 2)) * 60 + Number(time.slice(3))
  const next = Math.max(0, Math.min(23 * 60 + 55, base + deltaMin))
  const h = Math.floor(next / 60)
  const m = next % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function Section({ label, action, children }: { label: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist, textTransform: 'uppercase' }}>{label}</div>
        {action}
      </div>
      {children}
    </div>
  )
}

function EditLink({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ border: 'none', background: 'none', color: accent.base, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
      Edit
    </button>
  )
}

export function CardDetailScreen({ cardId, actor, onBack, onCopied }: CardDetailScreenProps) {
  const card = useAppStore((s) => s.schedule.cards[cardId])
  const listsRecord = useAppStore((s) => s.schedule.lists)
  const proceduresRecord = useAppStore((s) => s.schedule.procedures)
  const patients = useAppStore((s) => s.masters.patients)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const contracts = useAppStore((s) => s.masters.contracts)
  const insurers = useAppStore((s) => s.masters.insurers)
  const billableParties = useAppStore((s) => s.masters.billableParties)
  const todayISO = useToday()

  const list = card !== undefined ? listsRecord[card.listId] : undefined
  const primary: Procedure | undefined = useMemo(() => {
    if (card === undefined) return undefined
    return Object.values(proceduresRecord)
      .filter((p) => p.cardId === cardId)
      .sort((a, b) => a.id.localeCompare(b.id))[0]
  }, [card, cardId, proceduresRecord])

  const [notes, setNotes] = useState(card?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [sheet, setSheet] = useState<'none' | 'cancel' | 'patient' | 'procedure'>('none')

  useEffect(() => {
    setNotes(card?.notes ?? '')
  }, [card?.notes])

  if (card === undefined || list === undefined) return null
  const patient = patients[card.patientId]
  const cancelled = card.cancellation !== undefined
  const canEdit = list.state === 'DRAFT' && !cancelled
  const badge = nhiBadge(patient?.nhi)

  const hospitalName = list.hospitalId !== undefined ? (hospitals[list.hospitalId]?.name ?? 'Hospital') : 'AA rooms'
  const route = primary?.billingRoute
  const contractName = primary?.governingContractId !== undefined ? contracts[primary.governingContractId]?.name : undefined
  const insurerName = primary?.insurerId !== undefined ? insurers[primary.insurerId]?.name : undefined
  const bpName = primary?.billablePartyId !== undefined ? billableParties[primary.billablePartyId]?.name : undefined

  function run(outcome: { ok: boolean; message?: string }) {
    if (!outcome.ok) setError(outcome.message ?? 'That action was refused.')
    else setError(null)
  }

  function stepTime(delta: number) {
    run(editCard(useAppStore, actor, cardId, { scheduledTime: shiftTime(card!.scheduledTime ?? '', delta) }))
  }

  function saveNotes() {
    if (notes === (card!.notes ?? '')) return
    run(editCard(useAppStore, actor, cardId, { notes }))
  }

  function addPhoto() {
    const n = card!.attachments.length + 1
    run(
      editCard(useAppStore, actor, cardId, {
        attachments: [...card!.attachments, { id: `${cardId}-A${n}`, name: `Photo ${n}`, kind: 'photo', dataUrl: PAPER_CARD_A }],
      }),
    )
  }

  function doCopy() {
    const outcome = copyCard(useAppStore, actor, cardId)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onCopied()
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '60px 20px 14px', borderBottom: `1px solid ${neutral.line}`, background: neutral.surface, flex: 'none' }}>
        <button
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minHeight: 44, border: 'none', background: 'none', padding: 0, color: accent.base, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
        >
          <ChevronLeft size={18} strokeWidth={2.4} aria-hidden />
          List
        </button>
        <div style={{ fontSize: 24, lineHeight: '30px', fontWeight: 700, letterSpacing: '-0.01em' }}>{patient?.name ?? 'Unknown patient'}</div>
        <div className="mono" style={{ fontSize: 12, color: neutral.slate, marginTop: 4 }}>
          {badge.text}
          {patient !== undefined && ` · DOB ${formatDob(patient.dobISO)} (${ageYears(patient.dobISO, todayISO)}y)`}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14 }}>{primary?.description || 'Operation to capture'}</span>
          <StatusChip status={list.statusKey} />
          <span style={{ fontSize: 12, color: neutral.mist }}>{hospitalName}</span>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '14px 20px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {cancelled && (
          <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.card, padding: 14, fontSize: 13 }}>
            <strong>Card cancelled.</strong> {card.cancellation?.reason} It stays visible but is excluded from the list's completion count and billing.
          </div>
        )}
        {card.copiedFromCardId !== undefined && (
          <div style={{ background: accent.tint, color: accent.pressed, borderRadius: radius.card, padding: 12, fontSize: 13 }}>
            Additional procedure, copied from an earlier card on this list. It bills for time units only (Phase 04).
          </div>
        )}
        {error !== null && (
          <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.card, padding: 12, fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Patient */}
        <Section label="Patient" action={canEdit ? <EditLink onClick={() => setSheet('patient')} /> : undefined}>
          <Row label="NHI">
            <span className="mono" style={{ fontSize: 14 }}>{badge.text}</span>
            {badge.formatLabel !== null && (
              <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: brand.base, background: brand.tint, borderRadius: 999, padding: '2px 8px' }}>
                {badge.formatLabel}
              </span>
            )}
          </Row>
          {patient !== undefined && (
            <Row label="Date of birth">
              <span>{formatDob(patient.dobISO)} · {ageYears(patient.dobISO, todayISO)} years</span>
            </Row>
          )}
          <Row label="Contact">
            <span>{patient?.phone ?? 'Not recorded'}</span>
          </Row>
        </Section>

        {/* Operation */}
        <Section label="Operation" action={canEdit ? <EditLink onClick={() => setSheet('procedure')} /> : undefined}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{primary?.description || 'To capture'}</div>
          {primary?.rvgBaseCode !== undefined && (
            <div className="mono" style={{ fontSize: 12, color: accent.pressed }}>Code {primary.rvgBaseCode}</div>
          )}
          <Row label="Billing route">
            <span>{route !== undefined ? ROUTE_LABEL[route] : 'Not set'}</span>
          </Row>
          {insurerName !== undefined && <Row label="Insurer"><span>{insurerName}</span></Row>}
          {bpName !== undefined && <Row label="Billable party"><span>{bpName}</span></Row>}
          {contractName !== undefined && <Row label="Contract"><span>{contractName}</span></Row>}
          {primary?.billingReference !== undefined && (
            <Row label="Reference"><span className="mono" style={{ fontSize: 13 }}>{primary.billingReference}</span></Row>
          )}
        </Section>

        {/* Scheduled time */}
        <Section label="Scheduled time">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="mono" style={{ fontSize: 24, fontWeight: 700, flex: 1 }}>{card.scheduledTime ?? 'Not set'}</span>
            {canEdit && (
              <>
                <Stepper icon={<Minus size={18} aria-hidden />} onClick={() => stepTime(-5)} />
                <Stepper icon={<Plus size={18} aria-hidden />} onClick={() => stepTime(5)} />
              </>
            )}
          </div>
        </Section>

        {/* Attachments */}
        <Section label="Attachments" action={canEdit ? <button onClick={addPhoto} style={{ border: 'none', background: 'none', color: accent.base, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}><ImagePlus size={16} aria-hidden /> Add photo</button> : undefined}>
          {card.attachments.length === 0 ? (
            <div style={{ fontSize: 13, color: neutral.mist }}>No attachments.</div>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {card.attachments.map((a) => (
                <div key={a.id} style={{ width: 72, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {a.dataUrl !== undefined ? (
                    <img src={a.dataUrl} alt={a.name} style={{ width: 72, height: 92, objectFit: 'cover', borderRadius: 8, border: `1px solid ${neutral.line}` }} />
                  ) : (
                    <div style={{ width: 72, height: 92, borderRadius: 8, background: neutral.sunken, display: 'flex', alignItems: 'center', justifyContent: 'center', color: neutral.mist, fontSize: 11 }}>{a.kind}</div>
                  )}
                  <span style={{ fontSize: 10, color: neutral.mist, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Notes for the office */}
        <Section label="Notes for the office">
          {canEdit ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              placeholder="Anything the office should know…"
              style={{ width: '100%', boxSizing: 'border-box', minHeight: 72, borderRadius: radius.ctl, border: `1px solid ${neutral.line}`, padding: 12, fontFamily: 'inherit', fontSize: 15, resize: 'none', background: neutral.bg }}
            />
          ) : (
            <div style={{ fontSize: 14, color: card.notes !== undefined ? neutral.ink : neutral.mist }}>{card.notes ?? 'No notes.'}</div>
          )}
        </Section>

        {/* Outcome / BTM — Phase 04 placeholder */}
        <div style={{ background: neutral.sunken, border: `1px dashed ${neutral.lineStrong}`, borderRadius: radius.card, padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: neutral.mist, textTransform: 'uppercase' }}>Outcome &amp; billing (BTM)</div>
          <div style={{ fontSize: 14, color: neutral.slate }}>
            Anaesthetic times, base / time / modifier units, the fee and completion arrive with BTM capture in Phase 04.
          </div>
        </div>

        {/* Actions */}
        {canEdit && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            <MobileButton variant="secondary" block onClick={doCopy}>
              <Copy size={16} aria-hidden /> Copy for an additional procedure
            </MobileButton>
            <button
              onClick={() => setSheet('cancel')}
              style={{ minHeight: 48, borderRadius: radius.ctl, border: `1px solid ${semantic.error.solid}55`, background: neutral.surface, color: semantic.error.onTint, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <XCircle size={16} aria-hidden /> Cancel card
            </button>
          </div>
        )}
      </div>

      <CancelCardSheet open={sheet === 'cancel'} cardId={cardId} actor={actor} onClose={() => setSheet('none')} onCancelled={() => setError(null)} />
      {patient !== undefined && (
        <EditPatientSheet open={sheet === 'patient'} patient={patient} cardId={cardId} actor={actor} onClose={() => setSheet('none')} />
      )}
      {primary !== undefined && (
        <EditProcedureSheet open={sheet === 'procedure'} procedure={primary} actor={actor} onClose={() => setSheet('none')} />
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <span style={{ width: 96, flex: 'none', fontSize: 12, color: neutral.mist }}>{label}</span>
      <span style={{ flex: 1, fontSize: 14, color: neutral.ink }}>{children}</span>
    </div>
  )
}

function Stepper({ icon, onClick }: { icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ width: 44, height: 44, borderRadius: 12, border: `1px solid ${neutral.line}`, background: neutral.surface, color: neutral.slate, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {icon}
    </button>
  )
}
