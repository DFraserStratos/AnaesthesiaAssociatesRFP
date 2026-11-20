/// <reference lib="dom" />
/**
 * Artifacts, over the fixture catalogue: the tab and its two layouts, the canvas
 * viewer (sanitised SVG, selectable text, pan and zoom without moving the page, the minimap), the
 * red box from a card's link, mermaid, Markdown and PDF spots, the Linked tab, history, and a
 * stepped diagram (its step bar, the arrow keys, its Steps tab, find and refreshes at a step).
 */
import { execSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { writeItem } from '../server/catalogueFs.ts'
import { serialiseArtifact } from '../shared/files.ts'
import type { Artifact, CatalogueSnapshot } from '../shared/types.ts'
import { FIXTURE_DIR, fixtureArtifacts, fixtureItems, png, tinyPdf, writeFixture } from './fixtureCatalogue.ts'

test.describe.configure({ mode: 'serial' })

const viewBox = (page: Page) => page.locator('.canvas-host svg').first().getAttribute('viewBox')
const boxOf = async (page: Page, sel: string) => (await page.locator(sel).first().boundingBox())!

test.beforeEach(async ({ page, request, context }) => {
  writeFixture()
  const base = (id: string) => fixtureItems().find((i) => i.id === id)!
  writeItem({ ...base('US-01.1.1'), artifacts: ['AR-01#totals', 'AR-03'] }, FIXTURE_DIR)
  writeItem({ ...base('US-01.1.2'), description: 'Read [the totals](AR-01#totals) first.' }, FIXTURE_DIR)
  await expect
    .poll(async () => {
      const snap = (await (await request.get('/api/catalogue')).json()) as CatalogueSnapshot
      return `${Object.keys(snap.artifacts ?? {}).length}|${snap.items['US-01.1.1']?.data.artifacts.join(',')}`
    })
    .toBe('7|AR-01#totals,AR-03')
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
})

test('the Artifacts tab sits between Board and Outstanding items, and lists every artifact by kind', async ({ page }) => {
  await page.goto('/#/artifacts')
  await expect(page.locator('.tabs .tab')).toHaveText([/^Board/, /^Artifacts\s*7/, /^Outstanding items/, /^Outline/, /^Diff review/])
  await expect(page.locator('.plate')).toHaveCount(7)
  await expect(page.locator('.group-head')).toHaveText([/Diagrams\s*4/, /Screenshots\s*1/, /Notes\s*1/, /Documents\s*1/])
  await expect(page.locator('.plate', { hasText: 'Fixture drawing' }).locator('.artifact-date')).toHaveText('6 Oct 2026')
  await expect(page.locator('.plate', { hasText: 'Fixture document' }).locator('.artifact-date')).toHaveText('2021')
  // Newest first within a kind.
  await expect(page.locator('.group', { hasText: 'Diagrams' }).locator('.plate-title')).toHaveText(['Fixture drawing', 'Fixture flow', 'Fixture steps', 'Fixture strip'])
  // A stepped diagram counts its steps beside its highlights.
  await expect(page.locator('.plate', { hasText: 'Fixture steps' }).locator('.badge[title="3 steps"]')).toHaveText('3')
  await page.getByRole('button', { name: /^Notes/ }).click()
  await expect(page.locator('.plate')).toHaveCount(1)
  await expect(page.locator('.plate-title')).toHaveText('Fixture note')
})

test('the list layout is remembered: a row per artifact, and one click opens its page', async ({ page }) => {
  await page.goto('/#/artifacts')
  await page.getByRole('radio', { name: /List/ }).click()
  await page.reload()
  await expect(page.locator('.artifact-row')).toHaveCount(7)
  await expect(page.locator('.plate')).toHaveCount(0)
  await expect(page.locator('.artifact-row .thumb')).toHaveCount(7)
  await expect(page.locator('.artifact-row', { hasText: 'Fixture flow' }).locator('.artifact-row-date')).toHaveText('October 2026')
  await page.locator('.artifact-row', { hasText: 'Fixture drawing' }).click()
  await expect(page).toHaveURL(/#\/artifacts\/AR-01$/)
  await expect(page.locator('.artifact-panel h2')).toHaveText('Fixture drawing')
})

test('an SVG is shown with its script, handlers and embedded HTML taken out', async ({ page }) => {
  await page.goto('/#/artifacts/AR-01')
  await expect(page.locator('.canvas-host svg text', { hasText: 'Totals panel' })).toBeVisible()
  expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined()
  const inside = await page.locator('.canvas-host').evaluate((host) => ({
    scripts: host.shadowRoot!.querySelectorAll('script').length,
    foreign: host.shadowRoot!.querySelectorAll('foreignObject').length,
    onload: host.shadowRoot!.querySelector('svg')!.getAttribute('onload'),
  }))
  expect(inside).toEqual({ scripts: 0, foreign: 0, onload: null })
})

test("a card's artifact link opens the drawing fitted to the spot, inside the red box", async ({ page }) => {
  await page.goto('/#/outline?item=US-01.1.1')
  const row = page.locator('.artifacts-section .link-row', { hasText: 'Fixture drawing' })
  await expect(row).toContainText('Totals')
  await row.click()
  await expect(page).toHaveURL(/#\/artifacts\/AR-01\?region=totals$/)
  const box = await boxOf(page, '.region-box')
  for (const t of ['Totals panel', 'Copy this sentence please']) {
    const b = (await page.locator('.canvas-host svg text', { hasText: t }).boundingBox())!
    expect(b.x).toBeGreaterThanOrEqual(box.x)
    expect(b.y).toBeGreaterThanOrEqual(box.y)
    expect(b.x + b.width).toBeLessThanOrEqual(box.x + box.width)
    expect(b.y + b.height).toBeLessThanOrEqual(box.y + box.height)
  }
  // The other panel is outside it.
  const other = (await page.locator('.canvas-host svg text', { hasText: 'Other panel' }).boundingBox())!
  expect(other.x).toBeGreaterThan(box.x + box.width)
})

test("a drawing's text selects and copies, and a plain drag never pans", async ({ page }) => {
  await page.goto('/#/artifacts/AR-01?region=totals')
  const text = page.locator('.canvas-host svg text', { hasText: 'Copy this sentence please' })
  await expect(text).toBeVisible()
  await page.waitForTimeout(600)
  const before = await viewBox(page)
  const b = (await text.boundingBox())!
  await page.mouse.move(b.x + 1, b.y + b.height / 2)
  await page.mouse.down()
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 5 })
  await page.mouse.move(b.x + b.width - 1, b.y + b.height / 2, { steps: 5 })
  await page.mouse.up()
  expect(await viewBox(page)).toBe(before)
  await page.keyboard.press('ControlOrMeta+c')
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('Copy this sentence')
})

test('Space and a drag pans; a pinch zooms the drawing, never the page; the keys zoom and fit', async ({ page }) => {
  await page.goto('/#/artifacts/AR-01')
  await expect(page.locator('.canvas-host svg text', { hasText: 'Totals panel' })).toBeVisible()
  const frame = await boxOf(page, '.canvas-frame')
  const cx = frame.x + frame.width / 2
  const cy = frame.y + frame.height / 2
  await page.mouse.move(cx, cy)
  await page.locator('.canvas-frame').focus()
  const start = await viewBox(page)
  await page.keyboard.down('Space')
  await page.mouse.down()
  await page.mouse.move(cx + 120, cy + 40, { steps: 6 })
  await page.mouse.up()
  await page.keyboard.up('Space')
  const panned = await viewBox(page)
  expect(panned).not.toBe(start)

  await page.keyboard.down('Control')
  await page.mouse.wheel(0, -120)
  await page.keyboard.up('Control')
  await expect.poll(async () => Number((await viewBox(page))!.split(' ')[2])).toBeLessThan(Number(panned!.split(' ')[2]))
  expect(await page.evaluate(() => window.visualViewport?.scale ?? 1)).toBe(1)

  await page.keyboard.press('0')
  await expect.poll(() => viewBox(page)).toBe(start)
})

test('pressing the minimap moves the view there', async ({ page }) => {
  await page.goto('/#/artifacts/AR-01?region=totals')
  await expect(page.locator('.region-box')).toBeVisible()
  await page.getByRole('button', { name: 'Minimap' }).click()
  const map = page.locator('.canvas-dock .minimap-map')
  await expect(map).toBeVisible()
  const before = await viewBox(page)
  const m = (await map.boundingBox())!
  await page.mouse.click(m.x + m.width * 0.85, m.y + m.height * 0.5)
  await expect.poll(() => viewBox(page)).not.toBe(before)
})

test('a picture pans with a plain drag, and its region is a box in pixels', async ({ page }) => {
  await page.goto('/#/artifacts/AR-02?region=corner')
  await expect(page.locator('.region-box')).toBeVisible()
  const frame = await boxOf(page, '.canvas-frame')
  const before = await viewBox(page)
  await page.mouse.move(frame.x + 300, frame.y + 300)
  await page.mouse.down()
  await page.mouse.move(frame.x + 380, frame.y + 340, { steps: 5 })
  await page.mouse.up()
  expect(await viewBox(page)).not.toBe(before)
})

test('a mermaid diagram draws as real text, and a node is a spot', async ({ page }) => {
  await page.goto('/#/artifacts/AR-03?region=pricing')
  await expect(page.locator('.canvas-host svg text', { hasText: 'Pricing' })).toBeVisible()
  expect(await page.locator('.canvas-host').evaluate((h) => h.shadowRoot!.querySelectorAll('foreignObject').length)).toBe(0)
  const box = await boxOf(page, '.region-box')
  const node = (await page.locator('.canvas-host svg text', { hasText: 'Pricing' }).boundingBox())!
  expect(node.x).toBeGreaterThan(box.x)
  expect(node.x + node.width).toBeLessThan(box.x + box.width)
})

test('a Markdown document boxes a quote, a section, or a run of lines', async ({ page }) => {
  await page.goto('/#/artifacts/AR-04?region=fox')
  await expect(page.locator('.doc-sheet h1')).toHaveText('Fixture note')
  const fox = (await page.locator('.doc-sheet p', { hasText: 'quick brown fox' }).boundingBox())!
  const box = await boxOf(page, '.doc-sheet .region-box')
  expect(fox.y).toBeGreaterThan(box.y)
  expect(fox.y + fox.height).toBeLessThan(box.y + box.height)

  await page.goto('/#/artifacts/AR-04?region=first-section')
  const head = (await page.locator('.doc-sheet h2', { hasText: 'First section' }).boundingBox())!
  const section = await boxOf(page, '.doc-sheet .region-box')
  expect(head.y).toBeGreaterThan(section.y)
  const second = (await page.locator('.doc-sheet h2', { hasText: 'Second section' }).boundingBox())!
  expect(second.y).toBeGreaterThan(section.y + section.height - 1)

  await page.goto('/#/artifacts/AR-04?region=L7-8')
  await expect(page.locator('.doc-sheet .region-box')).toBeVisible()
  await expect(page.locator('.viewer-flag')).toHaveCount(0)
})

test('a PDF opens at the spot on its page, and its text is there to select', async ({ page }) => {
  await page.goto('/#/artifacts/AR-05?region=time-table')
  await expect(page.locator('.pdf-page[data-page="2"] .region-box')).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.pdf-page[data-page="2"] .textLayer')).toContainText('Time units table')
  await page.goto('/#/artifacts/AR-05?region=p1')
  await expect(page.locator('.pdf-page[data-page="1"] .region-box')).toBeVisible({ timeout: 15_000 })
})

test('a PDF has page thumbnails down the right, and fits a page across or whole, about the page in focus', async ({ page }) => {
  await page.goto('/#/artifacts/AR-05')
  const thumbs = page.locator('.pdf-rail .pdf-thumb')
  await expect(thumbs).toHaveCount(2, { timeout: 15_000 })
  await expect(thumbs.nth(0)).toHaveAttribute('aria-current', 'page')
  await expect(thumbs.nth(0).locator('img')).toBeVisible()
  const pageWidth = async () => (await boxOf(page, '.pdf-page[data-page="2"]')).width
  const fitWidth = page.getByRole('button', { name: 'Fit the page width' })
  const fitPage = page.getByRole('button', { name: 'Fit the whole page' })
  await expect(fitWidth).toHaveAttribute('aria-pressed', 'true')
  const across = await pageWidth()

  // A thumbnail goes to its page; fitting it whole shows all of it, centred in the view.
  await thumbs.nth(1).click()
  await expect(page.locator('.page-count')).toHaveText('2 / 2')
  await expect(thumbs.nth(1)).toHaveAttribute('aria-current', 'page')
  await fitPage.click()
  await expect(fitPage).toHaveAttribute('aria-pressed', 'true')
  await expect(fitWidth).toHaveAttribute('aria-pressed', 'false')
  const frame = await boxOf(page, '.pdf-frame')
  const whole = await boxOf(page, '.pdf-page[data-page="2"]')
  expect(whole.width).toBeLessThan(across)
  expect(whole.y).toBeGreaterThanOrEqual(frame.y)
  expect(whole.y + whole.height).toBeLessThanOrEqual(frame.y + frame.height)
  expect(Math.abs(whole.y - frame.y - (frame.y + frame.height - whole.y - whole.height))).toBeLessThan(4)

  // A pinch zooms about the pointer, leaving both fits; fitting the width again takes the focused page across.
  const at = { x: whole.x + whole.width * 0.3, y: whole.y + whole.height * 0.4 }
  await page.mouse.move(at.x, at.y)
  await page.keyboard.down('Control')
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, -15)
  await page.keyboard.up('Control')
  await expect(fitPage).toHaveAttribute('aria-pressed', 'false')
  const zoomed = await boxOf(page, '.pdf-page[data-page="2"]')
  expect(zoomed.width).toBeGreaterThan(whole.width * 1.5)
  expect(Math.abs((at.x - zoomed.x) / zoomed.width - 0.3)).toBeLessThan(0.02)
  expect(Math.abs((at.y - zoomed.y) / zoomed.height - 0.4)).toBeLessThan(0.02)
  await fitWidth.click()
  await expect(fitWidth).toHaveAttribute('aria-pressed', 'true')
  expect(Math.abs((await pageWidth()) - across)).toBeLessThan(2)
  await expect(page.locator('.page-count')).toHaveText('2 / 2')

  // The rail hides, and the pages take its room.
  await page.getByRole('button', { name: 'Page thumbnails' }).click()
  await expect(page.locator('.pdf-rail')).toHaveCount(0)
  await expect.poll(pageWidth).toBeGreaterThan(across + 60)
  await page.getByRole('button', { name: 'Page thumbnails' }).click()
  await expect(thumbs).toHaveCount(2)
})

test('the arrow keys go page by page, each page top to the top of the view, and never scroll the board itself', async ({ page }) => {
  await page.goto('/#/artifacts/AR-05')
  await expect(page.locator('.pdf-rail .pdf-thumb')).toHaveCount(2, { timeout: 15_000 })
  await page.locator('.artifact-panel-body').click({ position: { x: 20, y: 400 } })
  const gap = async () => (await boxOf(page, '.pdf-page[data-page="2"]')).y - (await boxOf(page, '.pdf-frame')).y
  await page.keyboard.press('ArrowDown')
  await expect(page.locator('.page-count')).toHaveText('2 / 2')
  await expect.poll(gap).toBeCloseTo(24, 0)
  await page.keyboard.press('ArrowUp')
  await expect(page.locator('.page-count')).toHaveText('1 / 2')
  expect(await page.evaluate(() => document.scrollingElement!.scrollTop)).toBe(0)
})

test('a spot the artifact does not have says so', async ({ page }) => {
  await page.goto('/#/artifacts/AR-01?region=nowhere')
  await expect(page.locator('.viewer-flag')).toContainText('no spot called "nowhere"')
})

test('the Linked tab lists the cards that point here, with the spot each links to', async ({ page }) => {
  await page.goto('/#/artifacts/AR-01')
  await page.getByRole('tab', { name: /Linked/ }).click()
  const listed = page.locator('.linked-row', { hasText: 'Story 1.1.1' })
  await expect(listed).toContainText('Totals')
  await expect(page.locator('.related-sub', { hasText: 'Mentioned in' })).toBeVisible()
  await expect(page.locator('.linked-row', { hasText: 'Story 1.1.2' })).toBeVisible()
  await listed.locator('.spot-chip').click()
  await expect(page).toHaveURL(/region=totals/)
})

test('a highlight row fits the view to it; its copy button copies a link that pastes as one', async ({ page }) => {
  await page.goto('/#/artifacts/AR-01')
  await page.locator('.spot-row', { hasText: 'Panel A' }).locator('.spot-go').click()
  await expect(page).toHaveURL(/region=panel-a/)
  await expect(page.locator('.region-box')).toBeVisible()
  await page.locator('.spot-row', { hasText: 'Panel A' }).hover()
  await page.locator('.spot-row', { hasText: 'Panel A' }).locator('.spot-copy').click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/#\/artifacts\/AR-01\?region=panel-a$/)
})

test("Edit details renames and re-dates an artifact, and leaves its file and highlights alone", async ({ page }) => {
  const sidecar = join(FIXTURE_DIR, 'artifacts', 'AR-01.md')
  const svgBefore = readFileSync(join(FIXTURE_DIR, 'artifacts', 'files', 'AR-01.svg'), 'utf8')
  await page.goto('/#/artifacts/AR-01')
  await page.getByRole('button', { name: 'Edit details' }).click()
  await expect(page.getByRole('tab')).toHaveCount(0)
  await page.getByLabel('Name').fill('Renamed drawing')
  const date = page.getByLabel(/^Date/)
  await date.fill('6 Oct')
  await expect(page.locator('.field-note.bad')).toHaveText('Write it as YYYY-MM-DD, YYYY-MM or YYYY')
  await date.fill('2026-09')
  await expect(page.locator('.field', { has: date }).locator('> span').first()).toHaveText('Date · September 2026')

  // Leaving with unsaved edits asks first; keeping them stays in the form.
  await page.locator('.artifact-panel-head .crumb').click()
  await page.getByRole('button', { name: 'Keep editing' }).click()
  await page.keyboard.press('ControlOrMeta+s')

  await expect(page.locator('.artifact-panel-head h2')).toHaveText('Renamed drawing')
  await expect(page.getByRole('tab', { name: 'Highlights' })).toBeVisible()
  const text = readFileSync(sidecar, 'utf8')
  expect(text).toContain('title: Renamed drawing')
  expect(text).toContain('date: 2026-09')
  expect(text).toContain('id: totals')
  expect(text).toContain('file: artifacts/files/AR-01.svg')
  expect(readFileSync(join(FIXTURE_DIR, 'artifacts', 'files', 'AR-01.svg'), 'utf8')).toBe(svgBefore)
  await page.locator('.artifact-panel-head .crumb').click()
  await expect(page.getByText('Renamed drawing')).toBeVisible()
})

test('find in a drawing counts the matches, tints them, and steps the view through them', async ({ page }) => {
  await page.goto('/#/artifacts/AR-01')
  await expect(page.locator('.canvas-host svg text', { hasText: 'Totals panel' })).toBeVisible()
  await page.locator('.canvas-frame').click({ position: { x: 5, y: 5 } })
  await page.keyboard.press('ControlOrMeta+f')
  const box = page.getByPlaceholder('Find in this diagram')
  await expect(box).toBeFocused()
  await box.fill('PANEL')
  await expect(page.locator('.find-bar .search-count')).toHaveText('1 of 2')
  await expect(page.locator('.find-hit')).toHaveCount(2)
  const first = await viewBox(page)
  await box.press('ArrowDown')
  await expect(page.locator('.find-bar .search-count')).toHaveText('2 of 2')
  await box.press('ArrowDown')
  await expect(page.locator('.find-bar .search-count')).toHaveText('1 of 2')
  await box.press('ArrowUp')
  await expect(page.locator('.find-bar .search-count')).toHaveText('2 of 2')
  await expect.poll(() => viewBox(page)).not.toBe(first)
  const current = (await page.locator('.find-hit.is-current').boundingBox())!
  const other = (await page.locator('.canvas-host svg text', { hasText: 'Other panel' }).boundingBox())!
  expect(current.x).toBeGreaterThan(other.x - 4)
  await box.fill('nothing like this')
  await expect(page.locator('.find-bar .search-count')).toHaveText('No matches')
  await box.press('Escape')
  await expect(page.locator('.find-hit')).toHaveCount(0)
  await expect(box).toHaveValue('')
  await expect(box).not.toBeFocused()
})

test('find works in mermaid, Markdown and PDF artifacts too, and an image has none', async ({ page }) => {
  await page.goto('/#/artifacts/AR-03')
  await page.getByPlaceholder('Find in this diagram').fill('invoice')
  await expect(page.locator('.find-bar .search-count')).toHaveText('1 of 1')

  await page.goto('/#/artifacts/AR-04')
  await page.getByPlaceholder('Find in this note').fill('alpha line')
  await expect(page.locator('.find-bar .search-count')).toHaveText('1 of 2')
  await expect(page.locator('.doc-sheet .find-hit')).toHaveCount(2)

  await page.goto('/#/artifacts/AR-05')
  await page.getByPlaceholder('Find in this document').fill('units table')
  await expect(page.locator('.find-bar .search-count')).toHaveText('1 of 1', { timeout: 15_000 })
  await expect(page.locator('.pdf-page[data-page="2"] .find-hit.is-current')).toBeVisible({ timeout: 15_000 })

  await page.goto('/#/artifacts/AR-02')
  await expect(page.locator('.canvas-frame')).toBeVisible()
  await expect(page.locator('.find-bar')).toHaveCount(0)
})

test('full screen, at the end of the view bar, hides the masthead and the panel, keeps the panel tab, and comes back', async ({ page }) => {
  await page.goto('/#/artifacts/AR-01')
  await expect(page.locator('.canvas-host svg text', { hasText: 'Totals panel' })).toBeVisible()
  // No new-card plus on an artifact's page: the view bar has the corner.
  await expect(page.getByRole('button', { name: 'New card' })).toHaveCount(0)
  await page.getByRole('tab', { name: /Details/ }).click()
  const frameW = (await boxOf(page, '.canvas-frame')).width
  await page.locator('.canvas-dock .view-bar').getByRole('button', { name: 'Full screen' }).click()
  await expect(page.locator('.masthead')).toBeHidden()
  await expect(page.locator('.artifact-dock')).toBeHidden()
  await expect.poll(async () => (await boxOf(page, '.canvas-frame')).width).toBeGreaterThan(frameW)
  // The find box still works in full screen.
  await page.getByPlaceholder('Find in this diagram').fill('PANEL')
  await expect(page.locator('.find-bar .search-count')).toHaveText('1 of 2')
  await page.getByRole('button', { name: 'Leave full screen' }).click()
  await expect(page.locator('.masthead')).toBeVisible()
  await expect(page.locator('.artifact-dock')).toBeVisible()
  await expect(page.getByRole('tab', { name: /Details/ })).toHaveAttribute('aria-selected', 'true')

  // An image has it in its view bar too, and a Markdown note, with no view bar of its own, gets one for it.
  await page.goto('/#/artifacts/AR-02')
  await expect(page.locator('.canvas-dock .view-bar').getByRole('button', { name: 'Full screen' })).toBeVisible()
  await page.goto('/#/artifacts/AR-04')
  await expect(page.locator('.doc-dock .view-bar').getByRole('button', { name: 'Full screen' })).toBeVisible()
  await page.goto('/#/artifacts/AR-05')
  await expect(page.locator('.doc-dock .view-bar').getByRole('button', { name: 'Full screen' })).toBeVisible({ timeout: 15_000 })
  // Back on the board, the plus is there again.
  await page.goto('/#/board')
  await expect(page.getByRole('button', { name: 'New card' })).toBeVisible()
})

test.describe('a stepped diagram', () => {
  /** The step classes on an element of the drawing shown (inside the viewer's shadow root). */
  const marks = (page: Page, sel: string) =>
    page.locator('.canvas-host').evaluate((h, sel) => {
      const el = h.shadowRoot!.querySelector(sel)
      // A move's marks (flying, from) come and go with a flight; the moves tests check them.
      return el ? [...el.classList].filter((c) => c.startsWith('rb-step-') && c !== 'rb-step-flying' && c !== 'rb-step-from').sort().join(' ') : null
    }, sel)
  const bar = (page: Page) => page.locator('.step-bar')
  /** The step read in the panel: the active row of the Steps tab, opened to its caption and balances. */
  const detail = (page: Page) => page.locator('.step-group-list .spot-row.is-active .step-detail')
  const open = async (page: Page, spot = '') => {
    await page.goto(`/#/artifacts/AR-06${spot ? `?region=${spot}` : ''}`)
    await expect(page.locator('.canvas-host svg text', { hasText: 'Trust account' })).toBeVisible()
  }

  test('the step bar steps through it: the URL, the reveal, the highlight, the step read in the panel, and back to the whole drawing', async ({ page }) => {
    await open(page)
    await expect(marks(page, '#payout-entries')).resolves.toBe('')
    const start = bar(page).getByRole('button', { name: 'Step through · 3 steps' })
    await expect(start).toBeVisible()
    const view = await viewBox(page)

    await start.click()
    await expect(page).toHaveURL(/#\/artifacts\/AR-06\?region=invoice$/)
    await expect(bar(page).locator('.step-count')).toHaveText('1 of 3')
    await expect(bar(page).locator('.step-bar-name')).toHaveText('Invoice raised')
    await expect(bar(page).locator('.step-bar-name')).toHaveAttribute('title', 'Ordinary invoice · Invoice raised')
    await expect(bar(page).getByRole('button', { name: 'Previous step' })).toBeDisabled()
    // The bar holds no caption or balances: the step is read in the panel, its row opened in place.
    await expect(bar(page).locator('.prose, table')).toHaveCount(0)
    await expect(page.locator('.step-detail')).toHaveCount(1)
    await expect(page.locator('.step-group-list', { has: page.locator('.spot-row.is-active .step-detail') }).locator('.section-head')).toHaveText(/Ordinary invoice/)
    await expect(marks(page, '#invoice-entries')).resolves.toBe('rb-step-lit')
    await expect(marks(page, '#trust')).resolves.toBe('rb-step-path')
    await expect(marks(page, '#payment-entries')).resolves.toBe('rb-step-off')
    await expect(marks(page, '#payout-entries')).resolves.toBe('rb-step-off')
    await expect(marks(page, 'svg')).resolves.toBe('rb-step-fade rb-step-focus')
    // The caption is prose: a record ID in it is a link to the record.
    await expect(detail(page).locator('.prose a', { hasText: 'Story 1.1.1' })).toBeVisible()
    await expect(detail(page).locator('.step-balances tr')).toHaveCount(2)
    await expect(detail(page).locator('.step-balances tr.is-changed')).toHaveCount(0)

    await bar(page).getByRole('button', { name: 'Next step' }).click()
    await expect(page).toHaveURL(/region=payment$/)
    await expect(bar(page).locator('.step-count')).toHaveText('2 of 3')
    await expect(bar(page).locator('[aria-live]')).toHaveText('Step 2 of 3: Patient pays. The money lands in the trust account.')
    await expect(marks(page, '#payment-entries')).resolves.toBe('rb-step-lit')
    await expect(marks(page, '#invoice-entries')).resolves.toBe('')
    await expect(marks(page, '#payout-entries')).resolves.toBe('rb-step-off')
    await expect(detail(page).locator('.step-balances tr.is-changed th')).toHaveText([/^Trust/, /^Debtors/])
    await expect(page.locator('.step-detail')).toHaveCount(1)

    await bar(page).getByRole('button', { name: 'Next step' }).click()
    await expect(page).toHaveURL(/region=payout$/)
    await expect(page.locator('.step-group-list', { has: page.locator('.spot-row.is-active .step-detail') }).locator('.section-head')).toHaveText(/Payout/)
    await expect(bar(page).getByRole('button', { name: 'Next step' })).toBeDisabled()
    await expect(detail(page).locator('.step-balances tr.is-changed th')).toHaveText([/^Trust/])
    // Stepping leaves the view where it was, and shows no red box.
    expect(await viewBox(page)).toBe(view)
    await expect(page.locator('.region-box')).toHaveCount(0)

    await bar(page).getByRole('button', { name: 'Whole drawing' }).click()
    await expect(page).toHaveURL(/#\/artifacts\/AR-06$/)
    await expect(start).toBeVisible()
    await expect(page.locator('.step-detail')).toHaveCount(0)
    expect(await page.locator('.canvas-host').evaluate((h) => h.shadowRoot!.querySelectorAll('[class*="rb-step-"]:not(svg)').length)).toBe(0)
    await expect(marks(page, 'svg')).resolves.toBe('rb-step-fade')
  })

  test('the bar sits level with the view bar and stops short of the dock; the open minimap draws over it', async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 800 })
    await open(page, 'payment')
    const b = await boxOf(page, '.step-bar')
    const v = await boxOf(page, '.canvas-dock .view-bar')
    expect(Math.abs(b.y + b.height - (v.y + v.height))).toBeLessThan(1.5)
    expect(Math.abs(b.height - v.height)).toBeLessThan(1.5)
    expect(b.x + b.width).toBeLessThanOrEqual(v.x - 15)
    // A long name is cut short, never pushing the bar wider.
    await expect(bar(page).locator('.step-bar-name')).toHaveCSS('text-overflow', 'ellipsis')
    // The hover minimap is passing: it opens over the bar's right end, on top, and takes the presses there.
    await page.getByRole('button', { name: 'Minimap' }).click()
    await expect(page.locator('.canvas-dock .minimap')).toBeVisible()
    await page.waitForTimeout(250)
    const m = await boxOf(page, '.canvas-dock .minimap')
    expect(m.x).toBeLessThan(b.x + b.width)
    const at = { x: (m.x + b.x + b.width) / 2, y: Math.max(b.y, m.y) + 8 }
    expect(await page.evaluate(({ x, y }) => !!document.elementFromPoint(x, y)?.closest('.minimap'), at)).toBe(true)
  })

  test('stepping from the bar leaves the panel on the tab the reader chose', async ({ page }) => {
    await open(page, 'invoice')
    await page.getByRole('tab', { name: /Details/ }).click()
    await bar(page).getByRole('button', { name: 'Next step' }).click()
    await expect(page).toHaveURL(/region=payment$/)
    await expect(page.getByRole('tab', { name: /Details/ })).toHaveAttribute('aria-selected', 'true')
    await page.locator('.canvas-frame').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page).toHaveURL(/region=payout$/)
    await expect(page.getByRole('tab', { name: /Details/ })).toHaveAttribute('aria-selected', 'true')
    await page.getByRole('tab', { name: /Steps/ }).click()
    await expect(detail(page)).toContainText('The doctor is paid from trust.')
  })

  test('dimmed parts fade between steps, and not at all under reduced motion', async ({ page }) => {
    const fade = () => page.locator('.canvas-host').evaluate((h) => getComputedStyle(h.shadowRoot!.querySelector('#ledger')!).transitionDuration)
    await open(page, 'invoice')
    await expect.poll(() => marks(page, 'svg')).toBe('rb-step-fade rb-step-focus')
    expect(await fade()).toMatch(/^0\.25s/)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    expect(await fade()).toMatch(/^0s/)
  })

  test('the arrow keys step, from the drawing or the bar', async ({ page }) => {
    await open(page)
    await page.locator('.canvas-frame').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page).toHaveURL(/region=invoice$/)
    await page.keyboard.press('ArrowRight')
    await expect(page).toHaveURL(/region=payment$/)
    await page.keyboard.press('ArrowLeft')
    await expect(page).toHaveURL(/region=invoice$/)
    // Not with a modifier held.
    await page.keyboard.press('Shift+ArrowRight')
    await expect(page).toHaveURL(/region=invoice$/)
    // From the bar: the last step disables Next, and the keys still step.
    await bar(page).getByRole('button', { name: 'Next step' }).click()
    await bar(page).getByRole('button', { name: 'Next step' }).click()
    await expect(page).toHaveURL(/region=payout$/)
    await page.keyboard.press('ArrowLeft')
    await expect(page).toHaveURL(/region=payment$/)
    // Not while typing in the find box.
    await page.getByPlaceholder('Find in this diagram').fill('entry')
    await page.getByPlaceholder('Find in this diagram').press('ArrowRight')
    await expect(page).toHaveURL(/region=payment$/)
  })

  test("find leaves out what a step has not revealed yet", async ({ page }) => {
    await open(page, 'invoice')
    const box = page.getByPlaceholder('Find in this diagram')
    await box.fill('payout')
    await expect(page.locator('.find-bar .search-count')).toHaveText('No matches')
    await box.fill('entry')
    await expect(page.locator('.find-bar .search-count')).toHaveText('1 of 1')
    await bar(page).getByRole('button', { name: 'Next step' }).click()
    await expect(page.locator('.find-bar .search-count')).toHaveText('1 of 2')
    await bar(page).getByRole('button', { name: 'Whole drawing' }).click()
    await expect(page.locator('.find-bar .search-count')).toHaveText('1 of 3')
  })

  test('the step holds through a catalogue refresh', async ({ page }) => {
    await open(page, 'payment')
    await expect(marks(page, '#payment-entries')).resolves.toBe('rb-step-lit')
    // Tag the drawing shown, so the copy a refresh mounts in its place can be told apart.
    await page.locator('.canvas-host').evaluate((h) => h.shadowRoot!.querySelector('svg')!.setAttribute('data-probe', 'old'))
    const base = fixtureItems().find((i) => i.id === 'US-01.1.3')!
    writeItem({ ...base, title: 'Story renamed on disk' }, FIXTURE_DIR)
    await expect.poll(() => page.locator('.canvas-host').evaluate((h) => h.shadowRoot!.querySelector('svg')?.getAttribute('data-probe') ?? 'new'), { timeout: 10_000 }).toBe('new')
    await expect(marks(page, '#payment-entries')).resolves.toBe('rb-step-lit')
    await expect(marks(page, '#payout-entries')).resolves.toBe('rb-step-off')
    await expect(bar(page).locator('.step-count')).toHaveText('2 of 3')
  })

  test('a link to a step opens on it: no red box, no flag, the whole drawing in view', async ({ page }) => {
    await open(page)
    await page.waitForTimeout(300)
    const whole = await viewBox(page)
    await open(page, 'payout')
    await expect(bar(page).locator('.step-count')).toHaveText('3 of 3')
    await expect(bar(page).locator('.step-bar-name')).toHaveText('Doctor paid')
    await expect(marks(page, '#payout-entries')).resolves.toBe('rb-step-lit')
    await expect(marks(page, '#invoice-entries')).resolves.toBe('')
    await expect(page.locator('.region-box')).toHaveCount(0)
    await expect(page.locator('.viewer-flag')).toHaveCount(0)
    await expect.poll(() => viewBox(page)).toBe(whole)
  })

  /** What is flying: the copies in the drawing, the flight animations on them, and the marks on the real elements. */
  const inFlight = (page: Page) =>
    page.locator('.canvas-host').evaluate((h) => {
      const root = h.shadowRoot!
      const flights = root.getAnimations().filter((a) => !(a instanceof CSSTransition))
      return {
        copies: root.querySelectorAll('.rb-step-flight').length,
        playing: flights.filter((a) => a.playState === 'running').length,
        marked: root.querySelectorAll('.rb-step-flying, .rb-step-from').length,
      }
    })
  const grounded = { copies: 0, playing: 0, marked: 0 }
  const stepForward = async (page: Page) => bar(page).getByRole('button', { name: 'Next step' }).click()

  test('stepping forward flies what moves, from where it sets off to where it lands, and leaves nothing behind', async ({ page }) => {
    await open(page, 'invoice')
    await expect.poll(() => inFlight(page)).toEqual(grounded)
    await stepForward(page)
    await expect(page).toHaveURL(/region=payment$/)
    // In the air: a copy flies above everything while the real entry waits hidden, the start at full strength.
    expect(await inFlight(page)).toEqual({ copies: 1, playing: 1, marked: 2 })
    const at = await page.locator('.canvas-host').evaluate((h) => {
      const root = h.shadowRoot!
      const [anim] = root.getAnimations().filter((a) => !(a instanceof CSSTransition))
      anim!.pause()
      const box = (el: Element) => { const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } }
      const copy = root.querySelector('.rb-step-flight')!
      anim!.currentTime = 0
      const start = box(copy)
      anim!.currentTime = 700
      const end = box(copy)
      anim!.play()
      return { start, end, from: box(root.querySelector('#invoice-entries')!), to: box(root.querySelector('#payment-entries')!), last: root.querySelector('svg')!.lastElementChild === copy, flying: root.querySelector('#payment-entries')!.classList.contains('rb-step-flying') }
    })
    // It sets off from the start's centre and lands on its own place, drawn last of all.
    expect(Math.abs(at.start.x - at.from.x) + Math.abs(at.start.y - at.from.y)).toBeLessThan(2)
    expect(Math.abs(at.end.x - at.to.x) + Math.abs(at.end.y - at.to.y)).toBeLessThan(2)
    expect(at.last).toBe(true)
    expect(at.flying).toBe(true)
    // Landed: nothing left on the drawing but the static step.
    await expect.poll(() => inFlight(page), { timeout: 3000 }).toEqual(grounded)
    expect(await page.locator('.canvas-host').evaluate((h) => { const el = h.shadowRoot!.querySelector('#payment-entries')!; return `${el.getAttribute('style') ?? ''}|${el.getAttribute('transform') ?? ''}` })).toBe('|')
    await expect(marks(page, '#payment-entries')).resolves.toBe('rb-step-lit')
  })

  test('stepping back, a jump from the panel, a link to a step and reduced motion fly nothing; Replay flies again', async ({ page }) => {
    await open(page, 'payout')
    expect(await inFlight(page)).toEqual(grounded)
    await bar(page).getByRole('button', { name: 'Previous step' }).click()
    await expect(page).toHaveURL(/region=payment$/)
    expect(await inFlight(page)).toEqual(grounded)
    // A jump to the very next step from the panel is still a jump.
    await page.locator('.spot-row', { hasText: 'Doctor paid' }).locator('.spot-go').click()
    await expect(page).toHaveURL(/region=payout$/)
    expect(await inFlight(page)).toEqual(grounded)
    // Replay is there for a step with moves, and flies them again from the step before.
    const replay = bar(page).getByRole('button', { name: 'Replay this step' })
    await expect(replay).toHaveAttribute('title', 'Replay this step')
    await replay.click()
    expect(await inFlight(page)).toEqual({ copies: 1, playing: 1, marked: 2 })
    await expect.poll(() => inFlight(page), { timeout: 3000 }).toEqual(grounded)
    // The first step has no moves, so no Replay.
    await page.locator('.spot-row', { hasText: 'Invoice raised' }).locator('.spot-go').click()
    await expect(bar(page).getByRole('button', { name: 'Replay this step' })).toHaveCount(0)
    // Reduced motion: stepping forward simply arrives.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await stepForward(page)
    await expect(page).toHaveURL(/region=payment$/)
    expect(await inFlight(page)).toEqual(grounded)
  })

  test('a new step mid-flight, or a catalogue refresh mid-flight, leaves the right static state', async ({ page }) => {
    await open(page, 'invoice')
    await stepForward(page)
    await page.locator('.canvas-host').evaluate((h) => h.shadowRoot!.getAnimations().forEach((a) => a.pause()))
    // Stepping on cancels the first flight and flies its own.
    await stepForward(page)
    await expect(page).toHaveURL(/region=payout$/)
    expect(await inFlight(page)).toEqual({ copies: 1, playing: 1, marked: 2 })
    await page.locator('.canvas-host').evaluate((h) => h.shadowRoot!.getAnimations().forEach((a) => a.pause()))
    await page.locator('.canvas-host').evaluate((h) => h.shadowRoot!.querySelector('svg')!.setAttribute('data-probe', 'old'))
    const base = fixtureItems().find((i) => i.id === 'US-01.1.3')!
    writeItem({ ...base, title: 'Renamed mid-flight' }, FIXTURE_DIR)
    await expect.poll(() => page.locator('.canvas-host').evaluate((h) => h.shadowRoot!.querySelector('svg')?.getAttribute('data-probe') ?? 'new'), { timeout: 10_000 }).toBe('new')
    expect(await inFlight(page)).toEqual(grounded)
    await expect(marks(page, '#payout-entries')).resolves.toBe('rb-step-lit')
    await expect(marks(page, '#payment-entries')).resolves.toBe('')
  })

  test.describe('a view that follows the steps (step_view: follow)', () => {
    /** How much of a card of the strip is on screen (0 to 1), and its drawn width over its width in the drawing (the zoom). */
    const seen = (page: Page, sel: string) =>
      page.locator('.canvas-frame').evaluate((f, sel) => {
        const host = f.querySelector('.canvas-host')!
        const el = host.shadowRoot!.querySelector(sel) as SVGGraphicsElement
        const r = el.getBoundingClientRect()
        const o = f.getBoundingClientRect()
        const w = Math.max(0, Math.min(r.right, o.right) - Math.max(r.left, o.left))
        const h = Math.max(0, Math.min(r.bottom, o.bottom) - Math.max(r.top, o.top))
        return { share: Math.round(((w * h) / (r.width * r.height)) * 100) / 100, zoom: Math.round((r.width / el.getBBox().width) * 100) / 100 }
      }, sel)
    const openStrip = async (page: Page, spot = '') => {
      await page.goto(`/#/artifacts/AR-07${spot ? `?region=${spot}` : ''}`)
      await expect(page.locator('.canvas-host svg text', { hasText: 'Order placed' })).toBeAttached()
    }

    test('frames each step as it comes, never past the drawing\'s own size, and Whole drawing fits it all again', async ({ page }) => {
      await openStrip(page)
      await page.waitForTimeout(300)
      const whole = await viewBox(page)
      // Fitted whole, the strip is far smaller than its own size.
      expect((await seen(page, '#card-1')).zoom).toBeLessThan(0.5)
      await bar(page).getByRole('button', { name: 'Step through · 3 steps' }).click()
      await expect.poll(() => seen(page, '#card-1')).toEqual({ share: 1, zoom: 1 })
      await stepForward(page)
      await expect.poll(() => seen(page, '#card-2')).toEqual({ share: 1, zoom: 1 })
      expect((await seen(page, '#card-1')).share).toBe(0)
      await page.locator('.canvas-frame').press('ArrowRight')
      await expect.poll(() => seen(page, '#card-3')).toEqual({ share: 1, zoom: 1 })
      await bar(page).getByRole('button', { name: 'Whole drawing' }).click()
      await expect.poll(() => viewBox(page)).toBe(whole)
    })

    test('a step already in view leaves the view where it is, and a link to a step opens framed', async ({ page }) => {
      await openStrip(page, 'shipped')
      // Framed at once: no ease to watch.
      expect(await seen(page, '#card-3')).toEqual({ share: 1, zoom: 1 })
      // Zoomed out by hand so the middle card is in view too: going back to it keeps the view.
      for (let i = 0; i < 7; i++) {
        await page.locator('.canvas-frame').press('-')
        await page.waitForTimeout(480)
      }
      expect((await seen(page, '#card-2')).share).toBe(1)
      const out = await viewBox(page)
      await bar(page).getByRole('button', { name: 'Previous step' }).click()
      await expect(page).toHaveURL(/region=paid$/)
      await page.waitForTimeout(800)
      expect(await viewBox(page)).toBe(out)
    })
  })

  test('the Steps tab comes first, lists the steps under their groups, and goes to one', async ({ page, request }) => {
    const base = fixtureItems().find((i) => i.id === 'US-01.1.3')!
    writeItem({ ...base, artifacts: ['AR-06#payout'] }, FIXTURE_DIR)
    await expect.poll(async () => ((await (await request.get('/api/catalogue')).json()) as CatalogueSnapshot).items['US-01.1.3']?.data.artifacts.join(',')).toBe('AR-06#payout')
    await open(page)
    await expect(page.locator('.panel-tabs .tab').first()).toHaveText(/^Steps\s*3/)
    await expect(page.getByRole('tab', { name: /Steps/ })).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.step-group-list .section-head')).toHaveText([/Ordinary invoice\s*2/, /Payout\s*1/])
    await expect(page.locator('.step-group-list .spot-row .step-num')).toHaveText(['1', '2', '3'])
    const row = page.locator('.spot-row', { hasText: 'Patient pays' })
    await row.locator('.spot-go').click()
    await expect(page).toHaveURL(/region=payment$/)
    await expect(row).toHaveClass(/is-active/)
    await expect(bar(page).locator('.step-count')).toHaveText('2 of 3')
    await row.hover()
    await row.locator('.spot-copy').click()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/#\/artifacts\/AR-06\?region=payment$/)
    // A card linking to a step: its chip on the Linked tab names the step and goes to it.
    await page.getByRole('tab', { name: /Linked/ }).click()
    const chip = page.locator('.linked-row', { hasText: 'Story 1.1.3' }).locator('.spot-chip')
    await expect(chip).toHaveText(/Doctor paid/)
    await chip.click()
    await expect(page).toHaveURL(/region=payout$/)
    await expect(bar(page).locator('.step-count')).toHaveText('3 of 3')
    // Highlights still lists the regions.
    await page.getByRole('tab', { name: /Highlights/ }).click()
    await expect(page.locator('.spot-row', { hasText: 'Our ledger' })).toBeVisible()
  })
})

test.describe('history', () => {
  test.afterEach(() => rmSync(join(FIXTURE_DIR, '.git'), { recursive: true, force: true }))

  test("a file's new version compares side by side, swiped, and as source", async ({ page }) => {
    const git = (cmd: string) => execSync(`git -c user.email=fixture@example.com -c user.name=Fixture ${cmd}`, { cwd: FIXTURE_DIR, stdio: 'ignore' })
    rmSync(join(FIXTURE_DIR, '.git'), { recursive: true, force: true })
    git('init -q')
    git('add -A')
    git('commit -qm "Fixture catalogue"')
    const svg = join(FIXTURE_DIR, 'artifacts', 'files', 'AR-01.svg')
    writeFileSync(svg, readFileSync(svg, 'utf8').replace('Other panel', 'Changed panel'))
    git('commit -qam "Rename the other panel"')

    await page.goto('/#/artifacts/AR-01')
    await page.getByRole('tab', { name: /History/ }).click()
    const toggle = page.locator('.hist-toggle', { hasText: 'File updated' })
    await expect(toggle).toBeVisible({ timeout: 10_000 })
    await toggle.click()
    await expect(page.locator('.compare-pair img')).toHaveCount(2)
    await page.getByRole('radio', { name: 'Swipe' }).click()
    await expect(page.locator('.swipe-stage img')).toHaveCount(2)
    await page.getByRole('radio', { name: 'Source' }).click()
    await expect(page.locator('.hist-diff .add')).toContainText('Changed panel')
    await expect(page.locator('.hist-diff .del')).toContainText('Other panel')
  })
})

/* ------------------------------------------------------------------ B10 */

test.describe('B10 · artifact viewers', () => {
  /** Rewrite an artifact's sidecar from the fixture's, changed. */
  const rewrite = (id: string, change: (a: Artifact) => Artifact) => writeFileSync(join(FIXTURE_DIR, 'artifacts', `${id}.md`), serialiseArtifact(change(fixtureArtifacts().find((a) => a.id === id)!)))
  const withRegion = (id: string, region: Artifact['regions'][number]) => rewrite(id, (a) => ({ ...a, regions: [...a.regions.filter((r) => r.id !== region.id), region] }))
  const spot = (id: string, name: string, around: string[], page: number | null = null): Artifact['regions'][number] => ({ id, name, around, box: null, page, pad: null, note: '' })
  const flag = (page: Page) => page.locator('.viewer-flag')
  const boxTop = async (page: Page) => (await page.locator('.region-box').first().boundingBox())?.y ?? null
  const git = (cmd: string) => execSync(`git -c user.email=fixture@example.com -c user.name=Fixture ${cmd}`, { cwd: FIXTURE_DIR, stdio: 'ignore' })

  test.afterEach(() => {
    rmSync(join(FIXTURE_DIR, '.git'), { recursive: true, force: true })
    rmSync(join(FIXTURE_DIR, 'assets'), { recursive: true, force: true })
  })

  test('R-98: asking for a spot that cannot be found, in a drawing, a document or a PDF already open, says so', async ({ page }) => {
    withRegion('AR-01', spot('lost', 'Lost', ['text=Nowhere at all']))
    withRegion('AR-04', spot('lost', 'Lost', ['quote=Not in this note anywhere.']))
    withRegion('AR-05', spot('lost', 'Lost', ['quote=Not on this page at all'], 1))
    for (const [id, found] of [['AR-01', 'totals'], ['AR-04', 'fox'], ['AR-05', 'time-table']] as const) {
      await page.goto(`/#/artifacts/${id}?region=${found}`)
      await expect(page.locator('.spot-row', { hasText: 'Lost' })).toBeVisible()
      await expect(page.locator('.region-box')).toBeVisible()
      await expect(flag(page)).toHaveCount(0)
      // The same viewer, now asked from the panel for the spot it cannot find (FINDINGS' case), then by the URL.
      await page.locator('.spot-row', { hasText: 'Lost' }).locator('.spot-go').click()
      await expect(page).toHaveURL(/region=lost$/)
      await expect(flag(page)).toHaveText(/The highlight could not be found/)
      await page.goto(`/#/artifacts/${id}?region=${found}`)
      await expect(page.locator('.region-box')).toBeVisible()
      await expect(flag(page)).toHaveCount(0)
      await page.goto(`/#/artifacts/${id}?region=lost`)
      await expect(flag(page)).toHaveText(/The highlight could not be found/)
    }
  })

  test('R-100: a region changed on disk is boxed where it now points, in Markdown and in a PDF', async ({ page }) => {
    for (const [id, regionId, moved, original, onPage] of [
      ['AR-04', 'fox', 'Alpha line one.', 'The quick brown fox jumps over the lazy dog.', null],
      ['AR-05', 'time-table', 'Second page heading', 'Time units table', 2],
    ] as const) {
      const name = id === 'AR-04' ? 'The fox' : 'Time table'
      await page.goto(`/#/artifacts/${id}?region=${regionId}`)
      await expect(page.locator('.region-box')).toBeVisible()
      await page.waitForTimeout(700) // the scroll to it settles
      const was = (await boxTop(page))!
      withRegion(id, spot(regionId, name, [`quote=${moved}`], onPage))
      await expect.poll(() => boxTop(page)).toBeLessThan(was - 10)
      await expect(page.locator('.region-box')).toHaveCount(1)
      await expect(flag(page)).toHaveCount(0)
      // Broken on disk: no box left over, and the flag.
      withRegion(id, spot(regionId, name, ['quote=Words that are nowhere'], onPage))
      await expect(flag(page)).toHaveText(/The highlight could not be found/)
      await expect(page.locator('.region-box')).toHaveCount(0)
      // Fixed on disk: boxed again, no flag.
      withRegion(id, spot(regionId, name, [`quote=${original}`], onPage))
      await expect(page.locator('.region-box')).toBeVisible()
      await expect(flag(page)).toHaveCount(0)
    }
  })

  /** Every distinct viewBox the drawing takes over `ms` while `act` runs. */
  const viewBoxesDuring = async (page: Page, act: () => Promise<unknown>, ms = 800) => {
    await page.evaluate((ms) => {
      const w = window as unknown as { __boxes: string[] }
      w.__boxes = []
      const end = performance.now() + ms
      const tick = () => {
        const vb = document.querySelector('.canvas-host')?.shadowRoot?.querySelector('svg')?.getAttribute('viewBox')
        if (vb && w.__boxes.at(-1) !== vb) w.__boxes.push(vb)
        if (performance.now() < end) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, ms)
    await act()
    await page.waitForTimeout(ms + 100)
    return page.evaluate(() => (window as unknown as { __boxes: string[] }).__boxes)
  }

  test('R-99: another region in an open drawing eases onto it; a first open, and reduced motion, place at once', async ({ page }) => {
    await page.goto('/#/artifacts/AR-01?region=totals')
    await expect(page.locator('.region-box')).toBeVisible()
    await page.waitForTimeout(600)
    const eased = await viewBoxesDuring(page, () => page.locator('.spot-row', { hasText: 'Panel A' }).locator('.spot-go').click())
    expect(eased.length).toBeGreaterThan(4)
    // The same region asked for again eases back to it too.
    await page.locator('.canvas-frame').press('-')
    await page.waitForTimeout(600)
    const again = await viewBoxesDuring(page, () => page.locator('.spot-row', { hasText: 'Panel A' }).locator('.spot-go').click())
    expect(again.length).toBeGreaterThan(4)
    // A fresh open is placed at once (the whole drawing while the box is measured, then the box).
    await page.goto('/#/artifacts')
    const fresh = await viewBoxesDuring(page, () => page.goto('/#/artifacts/AR-01?region=panel-a'))
    expect(fresh.length).toBeLessThanOrEqual(2)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const jumped = await viewBoxesDuring(page, () => page.locator('.spot-row', { hasText: 'Totals' }).locator('.spot-go').click())
    expect(jumped.length).toBeLessThanOrEqual(2) // where it was, then where it jumped to
  })

  test('R-13, R-163: workers, PDF documents and object URLs stay bounded however many views open', async ({ page }) => {
    // Count the object URLs the page makes and revokes.
    await page.addInitScript(() => {
      const live = new Set<string>()
      const make = URL.createObjectURL.bind(URL)
      const drop = URL.revokeObjectURL.bind(URL)
      URL.createObjectURL = (b: Blob | MediaSource) => {
        const u = make(b)
        live.add(u)
        return u
      }
      URL.revokeObjectURL = (u: string) => {
        live.delete(u)
        drop(u)
      }
      ;(window as unknown as { __liveUrls: () => number }).__liveUrls = () => live.size
    })
    await page.reload()
    await expect(page.locator('.tabs .tab').first()).toBeVisible()
    const urls = () => page.evaluate(() => (window as unknown as { __liveUrls: () => number }).__liveUrls())
    const workers = () => page.workers().length
    const docs = () => page.evaluate(() => (window as unknown as { __BOARD_PDF__?: () => { open: number; held: number } }).__BOARD_PDF__?.() ?? null)
    const round = async () => {
      await page.goto('/#/artifacts')
      // Thumbnails draw only near the view: bring the documents down the table into it.
      await page.locator('.group', { hasText: 'Documents' }).scrollIntoViewIfNeeded()
      await expect(page.locator('.thumb-pdf img.thumb-page')).toBeVisible()
      await expect(page.locator('.thumb-mermaid img')).toBeVisible()
      await page.goto('/#/artifacts/AR-05')
      await expect(page.locator('.pdf-page .textLayer').first()).toBeVisible()
      await page.goto('/#/artifacts/AR-03')
      await expect(page.locator('.canvas-host')).toBeVisible()
      await page.goto('/#/')
      await expect(page.locator('.react-flow')).toBeVisible()
    }
    const counts: { workers: number; urls: number }[] = []
    for (let i = 1; i <= 10; i++) {
      await round()
      if (i === 5 || i === 10) {
        await page.waitForTimeout(300)
        counts.push({ workers: workers(), urls: await urls() })
      }
    }
    console.log('B10 leak counts after 5 and 10 rounds', JSON.stringify(counts), JSON.stringify(await docs()))
    // One shared pdf.js worker at most; no object URL left once no drawing is on screen.
    expect(counts[1]!.workers).toBeLessThanOrEqual(1)
    expect(counts[1]!.workers).toBe(counts[0]!.workers)
    expect(counts[1]!.urls).toBe(0)
    expect((await docs())?.open ?? Infinity).toBeLessThanOrEqual(3)

    // A mermaid source edited six times while it is shown: one URL for the one drawing.
    await page.goto('/#/artifacts/AR-03')
    for (let n = 1; n <= 6; n++) {
      rewrite('AR-03', (a) => ({ ...a, source: `flowchart LR\n  A[Order] --> B[Pricing ${n}]\n  B --> C[Invoice]` }))
      await expect(page.locator('.canvas-host svg', { hasText: `Pricing ${n}` })).toBeVisible()
    }
    await page.locator('.view-bar').getByRole('button', { name: /Minimap/ }).click()
    await expect(page.locator('.minimap-map image')).toHaveCount(1)
    expect(await urls()).toBeLessThanOrEqual(1)
    // The minimap still shows its picture: its URL is live.
    const href = await page.locator('.minimap-map image').getAttribute('href')
    expect(await page.evaluate((u) => fetch(u!).then((r) => r.ok), href)).toBe(true)

    // A PDF history compare stepped through its pages opens nothing more.
    git('init -q')
    git('add -A')
    git('commit -qm "Fixture catalogue"')
    writeFileSync(join(FIXTURE_DIR, 'artifacts', 'files', 'AR-05.pdf'), tinyPdf([['Fixture page one, changed', 'Totals live here'], ['Second page heading', 'Time units table']]))
    git('commit -qam "Change the PDF"')
    await page.goto('/#/artifacts/AR-05')
    await page.getByRole('tab', { name: /History/ }).click()
    await page.locator('.hist-toggle', { hasText: 'File updated' }).click({ timeout: 10_000 })
    await expect(page.locator('.compare-pair img')).toHaveCount(2)
    for (const n of [2, 1, 2, 1, 2]) {
      await page.locator('.compare-page input').fill(String(n))
      await expect(page.locator('.compare-pair img')).toHaveCount(2)
    }
    await page.goto('/#/')
    await page.waitForTimeout(300)
    console.log('B10 leak counts after the compare', workers(), JSON.stringify(await docs()), await urls())
    expect(workers()).toBeLessThanOrEqual(1)
    expect((await docs())?.open ?? Infinity).toBeLessThanOrEqual(3)
    expect(await urls()).toBe(0)
  })

  const withShots = async (request: APIRequestContext) => {
    mkdirSync(join(FIXTURE_DIR, 'assets', 'US-01.1.1'), { recursive: true })
    writeFileSync(join(FIXTURE_DIR, 'assets', 'US-01.1.1', 'a.png'), png(240, 160))
    writeFileSync(join(FIXTURE_DIR, 'assets', 'US-01.1.1', 'b.png'), png(200, 100))
    const base = fixtureItems().find((i) => i.id === 'US-01.1.1')!
    writeItem({ ...base, images: [{ src: 'assets/US-01.1.1/a.png', viewport: 'desktop', app: 'web', caption: 'First' }, { src: 'assets/US-01.1.1/b.png', viewport: 'desktop', app: 'web', caption: 'Second' }] }, FIXTURE_DIR)
    await expect.poll(async () => ((await (await request.get('/api/catalogue')).json()) as CatalogueSnapshot).items['US-01.1.1']?.data.images.length).toBe(2)
  }
  const natural = (page: Page, sel: string) => page.locator(sel).first().evaluate((img: HTMLImageElement) => (img.complete ? img.naturalWidth : 0))

  test('R-104: a screenshot re-captured on disk shows in the open gallery and lightbox without a reload', async ({ page, request }) => {
    await withShots(request)
    await page.goto('/#/outline?item=US-01.1.1')
    await expect.poll(() => natural(page, '.gallery img')).toBe(240)
    const second = await page.locator('.gallery img').nth(1).getAttribute('src')
    await page.locator('.shot').first().click()
    await expect.poll(() => natural(page, '.lightbox img')).toBe(240)
    await page.evaluate(() => ((window as unknown as { __sameTab: boolean }).__sameTab = true))
    writeFileSync(join(FIXTURE_DIR, 'assets', 'US-01.1.1', 'a.png'), png(320, 100))
    await expect.poll(() => natural(page, '.lightbox img')).toBe(320)
    await expect.poll(() => natural(page, '.gallery img')).toBe(320)
    expect(await page.evaluate(() => (window as unknown as { __sameTab?: boolean }).__sameTab)).toBe(true)
    // The unchanged screenshot kept its URL.
    expect(await page.locator('.gallery img').nth(1).getAttribute('src')).toBe(second)
    // The versioned URL is the guarded asset route's: it serves the screenshot, and nothing else.
    expect(second).toMatch(/\?v=[0-9a-f]+$/)
    expect((await request.get(second!)).status()).toBe(200)
    expect((await request.get('/requirements/stories/US-01.1.1.md?v=x')).status()).toBe(404)
  })

  test('R-105: the lightbox covers the New card button and the divider beside a docked card, and a modal sheet', async ({ page, request }) => {
    await withShots(request)
    await page.goto('/#/board?item=US-01.1.1')
    await expect(page.locator('.dock .gallery img').first()).toBeVisible()
    const fab = (await page.locator('.new-card .fab').boundingBox())!
    const divider = (await page.locator('.dock-resizer').boundingBox())!
    await page.locator('.dock .shot').first().click()
    await expect(page.locator('.lightbox')).toBeVisible()
    const topAt = (x: number, y: number) => page.evaluate(([x, y]) => !!document.elementFromPoint(x!, y!)?.closest('.lightbox'), [x, y])
    expect(await topAt(fab.x + fab.width / 2, fab.y + fab.height / 2)).toBe(true)
    expect(await topAt(divider.x + divider.width / 2, divider.y + divider.height / 2)).toBe(true)
    // A click on the New card button's place closes the lightbox, and starts no card.
    await page.mouse.click(fab.x + fab.width / 2, fab.y + fab.height / 2)
    await expect(page.locator('.lightbox')).toHaveCount(0)
    await expect(page.locator('.new-card .fab')).toHaveAttribute('aria-expanded', 'false')
    await expect(page.locator('.dock')).toBeVisible()
    // From a modal sheet: over the sheet, and Esc closes the lightbox, not the sheet.
    await page.goto('/#/outline?item=US-01.1.1')
    await page.locator('.scrim .shot').first().click()
    const sheet = (await page.locator('.scrim .sheet').boundingBox())!
    expect(await topAt(sheet.x + 20, sheet.y + 20)).toBe(true)
    await page.keyboard.press('Escape')
    await expect(page.locator('.lightbox')).toHaveCount(0)
    await expect(page.locator('.scrim .sheet')).toBeVisible()
  })

  test('R-106: saved filters for kinds and areas nothing has are shown, and can be cleared', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('requirements-board:artifacts', JSON.stringify({ layout: 'grid', kinds: ['transcript'], statuses: [], components: ['Gone area'] })))
    await page.goto('/#/artifacts')
    await page.reload()
    await expect(page.locator('.plate')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Transcripts/ })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByLabel('Area')).toHaveValue('Gone area')
    await expect(page.locator('.empty')).toContainText('Nothing matches the filters.')
    await page.getByRole('button', { name: 'Clear filters' }).click()
    await expect(page.locator('.plate')).toHaveCount(7)
    // A damaged saved value loads the defaults, with no crash.
    await page.evaluate(() => localStorage.setItem('requirements-board:artifacts', JSON.stringify({ kinds: 5, components: 'Core' })))
    await page.reload()
    await expect(page.locator('.plate')).toHaveCount(7)
  })
})
