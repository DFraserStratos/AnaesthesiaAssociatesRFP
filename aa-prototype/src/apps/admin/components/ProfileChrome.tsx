/**
 * The chrome of the Admin profile pages (catch-up Phase 17): the surgeon
 * profile and the Admin anaesthetist record. `ProfilePage` is the Admin page
 * frame (`AdminPage`, fluid) with the back link to the Master data view, the
 * name as the title, its identifier chip beside it and the page's actions; its
 * cards are the shared `Card` and its facts `DefRow layout="stacked"` since UI
 * unification U6. `PROFILE_GRID` lays the cards across the full width.
 * Phase 26 extends the anaesthetist record on it. Build plan Phase 45 puts
 * a Contract's page on it, with routed `tabs` under the title.
 *
 * The People pages (the anaesthetist's and the surgeon's, 27 Nov 2026;
 * docs/explorations/profile-ideas.html tab 3) give it an `avatar`: the title row
 * then leads with the crimson initials disc, carries the page's status action at
 * its right end, and a fact strip (`facts`, `reach`) runs under it the page's width.
 */

import type { CSSProperties, ReactNode } from 'react'
import { Mail, Phone } from 'lucide-react'
import { accent, elevation, neutral, radius, semantic, type as typeScale } from '../../../theme/tokens'
import { Avatar } from '../../../shared/Avatar'
import { Button, PageHeader } from '../../../shared/ui'
import { AdminPage } from './AdminPage'

/** One cell of a record's fact strip: a small slate label over its value. */
export interface ProfileFact {
  label: string
  value: ReactNode
  /** Ids and numbers (an HPI CPN, a rate). */
  mono?: boolean
  shot?: string
  data?: Readonly<Record<`data-${string}`, string>>
}

/** How to reach the person, at the strip's right end: a `tel:` phone and a `mailto:` email, each when held. */
export interface ProfileReach {
  phone?: string
  email?: string
  /** "Email", or "Email the office" for a surgeon's rooms. */
  emailLabel: string
}

export function ProfilePage({
  shot,
  back,
  name,
  chip,
  sub,
  action,
  tabs,
  avatar,
  facts,
  reach,
  children,
}: {
  shot: string
  /** Where the record is listed, named for it: "Anaesthetists", "Surgeons", "Contracts". */
  back: { label: string; to: string }
  name: string
  chip?: ReactNode
  sub?: ReactNode
  action?: ReactNode
  /** The record's own `LineTabs` (a Contract's Overview, Bookings, Event fees and History), under the title. */
  tabs?: ReactNode
  /**
   * The person's name for the initials disc (the People pages): the title row then leads with the
   * avatar, `action` sits at that row's right end, and `facts` and `reach` run under it as a strip.
   */
  avatar?: string
  facts?: readonly ProfileFact[]
  reach?: ProfileReach
  children: ReactNode
}) {
  if (avatar !== undefined) {
    return (
      <AdminPage
        mode="fluid"
        shot={shot}
        back={back}
        titleRow={
          <div data-profile-hero style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar name={avatar} size={54} variant="solid" />
            <PageHeader
              size="admin"
              title={name}
              {...(chip !== undefined ? { aside: chip, asideGap: 12 } : {})}
              {...(sub !== undefined ? { sub } : {})}
              {...(action !== undefined ? { actions: action } : {})}
              style={{ flex: 1, minWidth: 0, alignItems: 'center' }}
            />
          </div>
        }
        {...(tabs !== undefined ? { tabs } : {})}
      >
        {(facts !== undefined || reach !== undefined) && <ProfileFactStrip facts={facts ?? []} {...(reach !== undefined ? { reach } : {})} />}
        {children}
      </AdminPage>
    )
  }
  return (
    <AdminPage
      mode="fluid"
      shot={shot}
      back={back}
      title={name}
      {...(chip !== undefined ? { aside: chip } : {})}
      {...(sub !== undefined ? { sub } : {})}
      {...(action !== undefined ? { actions: action } : {})}
      {...(tabs !== undefined ? { tabs } : {})}
    >
      {children}
    </AdminPage>
  )
}

/**
 * The record's cards side by side across the full width (docs/admin-layout-audit.md): columns of at
 * least 320px, the cards stretching to fill the row. A wide card spans two (`PROFILE_WIDE_CARD`).
 */
export const PROFILE_GRID: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, alignItems: 'start' }

/** A card that takes two of the grid's columns (the anaesthetist's Profile). */
export const PROFILE_WIDE_CARD: CSSProperties = { minWidth: 0, gridColumn: 'span 2' }

/** The People pages' detail cards two to a row, each as tall as its own content (profile-ideas.html `.cols2`). */
export const PROFILE_COLS2: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, alignItems: 'start' }

/** One column of `PROFILE_COLS2` holding cards stacked (the surgeon's Specialties over Contacts). */
export const PROFILE_COLUMN: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }

/** A label and value list inside a profile card, flowing into as many columns as the card holds. */
export const PROFILE_FACTS: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }

/**
 * The title row on its own (the component catalogue's preview; the pages take it from `ProfilePage`):
 * the shared `PageHeader` (admin, 24/30; UI unification U6) with the identifier
 * chip beside the name (outside the heading, 12px from it, as before), the sub-line and the
 * page's action.
 */
export function ProfileHeader({ name, chip, sub, action }: { name: string; chip?: ReactNode; sub?: ReactNode; action?: ReactNode }) {
  return (
    <PageHeader
      size="admin"
      title={name}
      {...(chip !== undefined ? { aside: chip, asideGap: 12 } : {})}
      {...(sub !== undefined ? { sub } : {})}
      {...(action !== undefined ? { actions: action } : {})}
      style={{ paddingBottom: 4 }}
    />
  )
}

/**
 * A record's facts in one white strip under its title row (profile-ideas.html tab 3, `.facts`): each
 * cell a small slate label over its value, divided by a left hairline; the contact links at the
 * right end with no divider (`.reach`), teal with their lucide icons.
 */
export function ProfileFactStrip({ facts, reach, shot = 'profile-facts' }: { facts: readonly ProfileFact[]; reach?: ProfileReach; shot?: string }) {
  const hasReach = reach !== undefined && (reach.phone !== undefined || reach.email !== undefined)
  return (
    <div
      data-shot={shot}
      style={{ display: 'flex', alignItems: 'stretch', flexWrap: 'wrap', background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, boxShadow: elevation.e1, flex: 'none' }}
    >
      <dl style={{ display: 'flex', margin: 0, minWidth: 0 }}>
        {facts.map((f, i) => (
          <div
            key={f.label}
            {...f.data}
            data-shot={f.shot}
            data-fact={f.label}
            style={{ padding: '10px 20px', borderLeft: i === 0 ? 'none' : `1px solid ${neutral.line}`, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}
          >
            <dt style={{ fontSize: typeScale.captionSm.size, fontWeight: 600, color: neutral.slate }}>{f.label}</dt>
            <dd className={f.mono === true ? 'mono' : undefined} style={{ margin: 0, fontSize: f.mono === true ? typeScale.labelLg.size : typeScale.data.size, fontWeight: f.mono === true ? 500 : 600, color: neutral.ink, whiteSpace: 'nowrap' }}>
              {f.value}
            </dd>
          </div>
        ))}
      </dl>
      {hasReach && (
        <div data-shot={`${shot}-reach`} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 18, padding: '0 20px' }}>
          {reach.phone !== undefined && (
            <a href={`tel:${reach.phone.replace(/\s+/g, '')}`} data-shot={`${shot}-phone`} style={REACH_LINK}>
              <Phone size={15} aria-hidden style={{ flex: 'none' }} />
              <span className="mono" style={{ fontWeight: 500, color: neutral.ink }}>{reach.phone}</span>
            </a>
          )}
          {reach.email !== undefined && (
            <a href={`mailto:${reach.email}`} data-shot={`${shot}-email`} title={reach.email} style={REACH_LINK}>
              <Mail size={15} aria-hidden style={{ flex: 'none' }} />
              {reach.emailLabel}
            </a>
          )}
        </div>
      )}
    </div>
  )
}

const REACH_LINK: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: typeScale.label.size, fontWeight: 600, color: accent.base, textDecoration: 'none', whiteSpace: 'nowrap' }

/** The tone of a person's status dot: in practice, a last day ahead, or out of practice. */
export type StatusDotTone = 'ok' | 'warn' | 'off'

const DOT: Record<StatusDotTone, string> = { ok: semantic.success.solid, warn: semantic.warning.solid, off: neutral.mist }

/** The strip's Status value on one line: a coloured dot, the word, and a smaller slate note ("since 9 Jun 2014"). */
export function StatusFactValue({ tone, word, note }: { tone: StatusDotTone; word: string; note?: string }) {
  return (
    <span data-status-word={word} style={{ whiteSpace: 'nowrap' }}>
      <span aria-hidden style={{ display: 'inline-block', width: 8, height: 8, borderRadius: radius.pill, background: DOT[tone], marginRight: 7, verticalAlign: 1 }} />
      {word}
      {note !== undefined && (
        <>
          {' '}
          <span data-status-note style={{ fontWeight: 500, fontSize: typeScale.small.size, color: neutral.slate, marginLeft: 2 }}>
            {note}
          </span>
        </>
      )}
    </span>
  )
}

/** An identifier as a mono chip: "HPI CPN 47REIA". */
export function IdChip({ label, value, empty, shot }: { label: string; value: string | undefined; empty?: string; shot?: string }) {
  // No value held (catch-up Phase 17b: a surgeon with no HPI CPN yet): `empty` in mist, not mono.
  const held = value !== undefined && value !== ''
  return (
    <span data-shot={shot} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, padding: '3px 10px', borderRadius: radius.pill, background: neutral.sunken, border: `1px solid ${neutral.line}` }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: neutral.mist }}>{label}</span>
      {held ? (
        <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: neutral.ink }}>{value}</span>
      ) : (
        <span style={{ fontSize: 13, fontWeight: 500, color: neutral.mist }}>{empty ?? 'None'}</span>
      )}
    </span>
  )
}

/** A profile card's style on the shared `Card`: it may shrink inside the page's card grid. */
export const PROFILE_CARD: CSSProperties = { minWidth: 0 }

/** The page's actions: the record's History, then Edit details (none on a page edited card by card). */
export function HeaderActions({ onHistory, onEdit }: { onHistory: () => void; onEdit?: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
      <Button variant="secondary" onClick={onHistory}>History</Button>
      {onEdit !== undefined && <Button variant="secondary" onClick={onEdit}>Edit details</Button>}
    </div>
  )
}
