/**
 * The anaesthetist's page (build plan Phase 54; US-12.1.4): each card edits and saves alone, as one
 * audited `anaesthetist.update` with only its own fields; Cancel writes nothing; refusals show on the
 * card that sent them; the name and registration are read-only; Save waits for the mandatory
 * fields; the bank number is masked at rest and in the audit; the start date on the Status card; the
 * side panel's Lists, linked Contracts and pairings; 50's and 52's cards placed as built.
 */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextListsOf } from '../../../domain/anaesthetistPanel'
import { ANAE } from '../../../domain/seed'
import { SurfaceProvider } from '../../../shared'
import { freshAppState, useAppStore, type Actor } from '../../../store'
import { peopleRoutes } from '../../../test/adminRoutes'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const ROPATA = ANAE.ropata

function Where() {
  const location = useLocation()
  return <output data-testid="where">{`${location.pathname} ${JSON.stringify(location.state)}`}</output>
}

function renderPage(id: string = ROPATA) {
  return render(
    <MemoryRouter initialEntries={[`/admin/people/anaesthetists/${id}`]}>
      <SurfaceProvider variant="web">
        <Routes>
          <Route path="/admin" element={<Outlet context={{ actor: OFFICE, todayISO: useAppStore.getState().clock.todayISO }} />}>
            {peopleRoutes()}
            <Route path="day/:dateISO" element={<Where />} />
            <Route path="contracts/:contractId" element={<Where />} />
          </Route>
        </Routes>
      </SurfaceProvider>
    </MemoryRouter>,
  )
}

const card = (shot: string) => document.querySelector(`[data-shot="${shot}"]`) as HTMLElement
const edit = (shot: string) => fireEvent.click(within(card(shot)).getByRole('button', { name: /^Edit / }))
const save = (shot: string) => fireEvent.click(within(card(shot)).getByRole('button', { name: 'Save' }))
const me = () => useAppStore.getState().masters.anaesthetists[ROPATA]!
const audit = () => useAppStore.getState().audit
const updates = () => audit().filter((e) => e.action === 'anaesthetist.update' && e.entityId === ROPATA)

describe("the anaesthetist's page", () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('leads with the Usual week, then lays out Identity, Contact, Bank and GST, Rate and tier and Status two to a row, then History full width, with no all-fields editor', () => {
    const { container } = renderPage()
    const cards = [...container.querySelectorAll('[data-profile-cards] > section[data-shot]')].map((el) => el.getAttribute('data-shot'))
    expect(cards).toEqual(['anaesthetist-identity', 'anaesthetist-contact', 'anaesthetist-bank', 'rate-tier-card', 'anaesthetist-status'])
    const main = [...container.querySelectorAll('[data-page-body] > div > *')].map((el) => el.getAttribute('data-shot') ?? (el.hasAttribute('data-profile-cards') ? 'cards' : null))
    expect(main).toEqual(['usual-week', 'cards', 'anaesthetist-history'])
    expect(screen.queryByRole('button', { name: /Edit details/ })).toBeNull()
    expect(screen.queryByRole('button', { name: 'History' })).toBeNull()
  })

  it('heads the page with the avatar, the sub line, Make inactive and the fact strip, with the HPI chip gone', () => {
    renderPage(ANAE.souter)
    const a = useAppStore.getState().masters.anaesthetists[ANAE.souter]!
    const hero = document.querySelector('[data-profile-hero]') as HTMLElement
    expect(within(hero).getByRole('heading', { level: 1 })).toHaveTextContent(a.name)
    expect(hero).toHaveTextContent(`Anaesthetist · Registration ${a.registrationNumber}`)
    expect(within(hero).getByRole('button', { name: 'Make inactive' })).toBe(card('anaesthetist-make-inactive'))
    const facts = [...card('profile-facts').querySelectorAll('[data-fact]')].map((el) => el.getAttribute('data-fact'))
    expect(facts).toEqual(['Status', 'HPI CPN', 'Rate per unit', 'Offer order'])
    expect(card('anaesthetist-hpi-chip')).toHaveTextContent(a.hpiId)
    expect(card('anaesthetist-hpi-chip').closest('[data-shot="profile-facts"]')).not.toBeNull()
    expect(card('profile-facts')).toHaveTextContent('$26.50')
    expect(card('profile-facts-phone').getAttribute('href')).toBe(`tel:${a.phone.replace(/\s+/g, '')}`)
    expect(card('profile-facts-email').getAttribute('href')).toBe(`mailto:${a.email}`)
    expect(card('profile-facts-email')).toHaveTextContent('Email')
  })

  it('orders the side panel Pairings, Next Lists, Contracts, History', () => {
    renderPage(ANAE.souter)
    expect([...card('anaesthetist-panel').children].map((el) => el.getAttribute('data-shot'))).toEqual(['panel-pairings', 'panel-lists', 'panel-contracts', 'anaesthetist-record-history'])
  })

  it('shows History last in the side panel, opening the record and its pairings in the History sheet', () => {
    renderPage(ANAE.souter)
    const panel = card('anaesthetist-panel')
    expect(panel.lastElementChild?.getAttribute('data-shot')).toBe('anaesthetist-record-history')
    expect(card('anaesthetist-record-history')).toHaveTextContent('0 changes recorded')
    expect(card('anaesthetist-history-open')).toBeNull()
    edit('anaesthetist-contact')
    fireEvent.change(within(card('anaesthetist-contact')).getByLabelText('Phone'), { target: { value: '021 555 0101' } })
    save('anaesthetist-contact')
    expect(card('anaesthetist-record-history')).toHaveTextContent('1 change recorded')
    fireEvent.click(card('anaesthetist-history-open'))
    expect(within(screen.getByRole('dialog')).getByText(`History · ${useAppStore.getState().masters.anaesthetists[ANAE.souter]!.name}`)).toBeInTheDocument()
  })

  it('Identity: the name and registration are read-only; only the HPI CPN is a field', () => {
    renderPage()
    edit('anaesthetist-identity')
    const identity = card('anaesthetist-identity')
    expect(within(identity).getAllByRole('textbox')).toHaveLength(1)
    expect(within(identity).getByLabelText('HPI CPN (required)')).toBeInTheDocument()
    expect(within(identity).getByText(me().name)).toBeInTheDocument()
    expect(within(identity).getByText(ROPATA)).toBeInTheDocument()
  })

  it('Identity: a blank HPI CPN holds Save back in the rule\'s words; a held one is refused on this card and nothing changes', () => {
    renderPage()
    const before = me()
    edit('anaesthetist-identity')
    const identity = card('anaesthetist-identity')
    fireEvent.change(within(identity).getByLabelText('HPI CPN (required)'), { target: { value: '' } })
    expect(within(identity).getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(identity).toHaveTextContent("An HPI CPN is required. It is the anaesthetist's unique number on the Health Provider Index.")
    fireEvent.change(within(identity).getByLabelText('HPI CPN (required)'), { target: { value: '47reia' } })
    save('anaesthetist-identity')
    expect(within(identity).getByRole('alert')).toHaveTextContent('Ms A. Reid')
    expect(card('anaesthetist-contact').querySelector('[role="alert"]')).toBeNull()
    expect(me()).toEqual(before)
    // A valid one saves, one audited change with only the HPI CPN.
    fireEvent.change(within(identity).getByLabelText('HPI CPN (required)'), { target: { value: '60ropx' } })
    save('anaesthetist-identity')
    expect(me().hpiId).toBe('60ROPX')
    expect(updates()).toHaveLength(1)
    expect(Object.keys(updates()[0]!.after as object)).toEqual(['hpiId'])
  })

  it('Contact: a save is one audited change with only the changed field; Cancel after a change writes nothing', () => {
    renderPage()
    edit('anaesthetist-contact')
    fireEvent.change(within(card('anaesthetist-contact')).getByLabelText('Phone'), { target: { value: '021 555 0199' } })
    fireEvent.click(within(card('anaesthetist-contact')).getByRole('button', { name: 'Cancel' }))
    expect(updates()).toHaveLength(0)
    expect(me().phone).not.toBe('021 555 0199')

    edit('anaesthetist-contact')
    fireEvent.change(within(card('anaesthetist-contact')).getByLabelText('Phone'), { target: { value: '021 555 0199' } })
    save('anaesthetist-contact')
    expect(me().phone).toBe('021 555 0199')
    expect(updates()).toHaveLength(1)
    expect(Object.keys(updates()[0]!.after as object)).toEqual(['phone'])
  })

  it('two cards open at once each save alone', () => {
    renderPage()
    edit('anaesthetist-contact')
    edit('anaesthetist-bank')
    fireEvent.change(within(card('anaesthetist-contact')).getByLabelText('Email'), { target: { value: 'h.ropata@new.example' } })
    fireEvent.change(within(card('anaesthetist-bank')).getByLabelText('GST number (optional)'), { target: { value: '49-091-850' } })
    save('anaesthetist-contact')
    expect(updates()).toHaveLength(1)
    expect(Object.keys(updates()[0]!.after as object)).toEqual(['email'])
    // The bank card stays open with its draft, unsaved.
    expect(card('anaesthetist-bank').getAttribute('data-editing')).not.toBeNull()
    expect(within(card('anaesthetist-bank')).getByLabelText('GST number (optional)')).toHaveValue('49-091-850')
    expect(me().gstNumber).not.toBe('49091850')
  })

  it('Bank and GST: masked at rest, full only while editing; blank and malformed are refused on this card; a change is masked in the audit; blank GST clears it', () => {
    renderPage()
    const full = me().bankAccount.accountNumber
    expect(card('anaesthetist-bank')).not.toHaveTextContent(full)
    edit('anaesthetist-bank')
    const bank = () => card('anaesthetist-bank')
    expect(within(bank()).getByLabelText('Bank account number (required)')).toHaveValue(full)

    fireEvent.change(within(bank()).getByLabelText('Bank account name (required)'), { target: { value: '' } })
    expect(within(bank()).getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(bank()).toHaveTextContent('Bank details are required: an account name and an account number.')
    fireEvent.change(within(bank()).getByLabelText('Bank account name (required)'), { target: { value: 'H Ropata' } })
    fireEvent.change(within(bank()).getByLabelText('Bank account number (required)'), { target: { value: '12-34' } })
    save('anaesthetist-bank')
    expect(within(bank()).getByRole('alert')).toHaveTextContent('That bank account number does not look right.')
    expect(updates()).toHaveLength(0)

    fireEvent.change(within(bank()).getByLabelText('Bank account number (required)'), { target: { value: '12-3456-7654321-00' } })
    fireEvent.change(within(bank()).getByLabelText('GST number (optional)'), { target: { value: '49-091-850' } })
    save('anaesthetist-bank')
    expect(me().bankAccount).toEqual({ accountName: 'H Ropata', accountNumber: '12-3456-7654321-00' })
    expect(me().gstNumber).toBe('49091850')
    expect(updates()).toHaveLength(1)
    expect(Object.keys(updates()[0]!.after as object).sort()).toEqual(['bankAccount', 'gstNumber'])
    expect(JSON.stringify(updates()[0])).not.toContain('7654321')
    expect(card('anaesthetist-bank')).not.toHaveTextContent('12-3456-7654321-00')

    edit('anaesthetist-bank')
    fireEvent.change(within(bank()).getByLabelText('GST number (optional)'), { target: { value: '' } })
    save('anaesthetist-bank')
    expect(me().gstNumber).toBeUndefined()
    expect(Object.keys(updates()[1]!.after as object)).toEqual(['gstNumber'])
  })

  it('the start date sits on the Status card: it saves alone, and a date that removes a session holding a List is refused there', () => {
    renderPage()
    const status = () => card('anaesthetist-status')
    fireEvent.click(within(status()).getByRole('button', { name: 'Change start date' }))
    fireEvent.change(within(status()).getByLabelText('Start date'), { target: { value: '2015-02-02' } })
    fireEvent.click(within(status()).getByRole('button', { name: 'Save' }))
    expect(me().startDateISO).toBe('2015-02-02')
    expect(Object.keys(updates().at(-1)!.after as object)).toEqual(['startDateISO'])

    const lastList = nextListsOf(useAppStore.getState().schedule.lists, ROPATA, useAppStore.getState().clock.todayISO).at(-1)!
    fireEvent.click(within(status()).getByRole('button', { name: 'Change start date' }))
    fireEvent.change(within(status()).getByLabelText('Start date'), { target: { value: '2027-12-31' } })
    fireEvent.click(within(status()).getByRole('button', { name: 'Save' }))
    expect(within(status()).getByRole('alert')).toBeInTheDocument()
    expect(me().startDateISO).toBe('2015-02-02')
    expect(lastList.dateISO < '2027-12-31').toBe(true)
  })

  it("places 50's Rate and tier card and 52's Status and History cards as built", () => {
    renderPage()
    expect(within(card('rate-tier-card')).getByRole('button', { name: 'Edit rate and offer order' })).toBeInTheDocument()
    // The Status card keeps its facts and the start date; its action is the header's.
    expect(within(card('anaesthetist-status')).queryByRole('button', { name: 'Make inactive' })).toBeNull()
    expect(within(card('anaesthetist-status')).getByRole('button', { name: 'Change start date' })).toBeInTheDocument()
    expect(card('anaesthetist-history')).not.toBeNull()
  })
})

describe("the anaesthetist's side panel", () => {
  beforeEach(() => {
    useAppStore.setState(freshAppState())
  })

  it('shows three of their next Lists, See all reaching every one, each opening the List on the Day view', () => {
    renderPage(ANAE.souter)
    const all = nextListsOf(useAppStore.getState().schedule.lists, ANAE.souter, useAppStore.getState().clock.todayISO)
    expect(all.length).toBeGreaterThanOrEqual(8)
    const lists = () => card('panel-lists')
    expect(lists().querySelectorAll('li')).toHaveLength(3)
    fireEvent.click(within(lists()).getByRole('button', { name: `See all ${all.length}` }))
    expect(lists().querySelectorAll('li')).toHaveLength(all.length)
    const first = all[0]!
    fireEvent.click(within(lists().querySelector(`li[data-list-id="${first.id}"]`) as HTMLElement).getByRole('link'))
    expect(screen.getByTestId('where').textContent).toBe(`/admin/day/${first.dateISO} {"openListId":"${first.id}"}`)
  })

  it('lists the Contracts linked to them, a hospital-held one included, Active first then Disabled', () => {
    const s = useAppStore.getState()
    const hospitalParty = Object.values(s.masters.parties).find((p) => p.kind === 'hospital')!
    const held = Object.values(s.masters.contracts).find((c) => c.holderId === hospitalParty.id && c.systemRole === undefined)!
    const own = Object.values(s.masters.contracts).find((c) => c.linkedAnaesthetistId === ANAE.beaumont)!
    useAppStore.setState({
      masters: {
        ...s.masters,
        contracts: {
          ...s.masters.contracts,
          [held.id]: { ...held, linkedAnaesthetistId: ANAE.beaumont },
          [own.id]: { ...own, status: 'disabled' },
        },
      },
    })
    renderPage(ANAE.beaumont)
    const rows = [...card('panel-contracts').querySelectorAll('li')]
    expect(rows.map((li) => li.getAttribute('data-contract-id'))).toEqual([held.id, own.id])
    expect(rows[0]).toHaveTextContent(hospitalParty.name)
    expect(rows[1]).toHaveTextContent('Disabled')
    // Their own Contract's sub line names its pricing, never the page's own anaesthetist again.
    const name = useAppStore.getState().masters.anaesthetists[ANAE.beaumont]!.name
    expect(rows[1]).not.toHaveTextContent(name)
    fireEvent.click(within(rows[0]!).getByRole('link'))
    expect(screen.getByTestId('where').textContent).toContain(`/admin/contracts/${held.id}`)
  })

  it('says so when no Contract is linked, and adds and ends a pairing at the panel width', () => {
    renderPage()
    expect(card('panel-contracts')).toHaveTextContent('No Contract is linked to them.')
    const pairings = () => card('pairing-section')
    expect(pairings().getAttribute('data-pairing-layout')).toBe('panel')
    expect(pairings()).toHaveTextContent('Private to the office. Anaesthetists never see these.')
    const before = pairings().querySelectorAll('li[data-pairing]').length
    fireEvent.click(within(pairings()).getByRole('button', { name: 'Add pairing' }))
    const sheet = document.querySelector('[data-shot="pairing-add-sheet"]') as HTMLElement
    const select = sheet.querySelector('select[data-shot="pairing-counterpart"]') as HTMLSelectElement
    const option = [...select.querySelectorAll('option')].find((o) => o.value !== '' && !o.disabled)!
    fireEvent.change(select, { target: { value: option.value } })
    fireEvent.click(within(sheet).getByRole('button', { name: 'Add pairing' }))
    expect(audit().at(-1)?.action).toBe('pairing.add')
    expect(pairings().querySelectorAll('li[data-pairing]').length).toBe(before + 1)
    fireEvent.click(within(pairings()).getAllByRole('button', { name: /^End / })[0]!)
    fireEvent.click(screen.getByRole('button', { name: 'End pairing' }))
    expect(audit().at(-1)?.action).toBe('pairing.end')
  })
})
