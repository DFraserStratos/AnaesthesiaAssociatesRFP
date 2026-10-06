/// <reference lib="dom" />
/**
 * Artifacts, over the fixture catalogue (port 5182): the tab and its two layouts, the canvas
 * viewer (sanitised SVG, selectable text, pan and zoom without moving the page, the minimap), the
 * red box from a card's link, mermaid, Markdown and PDF spots, the Linked tab, and history.
 */
import { execSync } from 'node:child_process'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { writeItem } from '../server/catalogueFs.ts'
import type { CatalogueSnapshot } from '../shared/types.ts'
import { FIXTURE_DIR, fixtureItems, writeFixture } from './fixtureCatalogue.ts'

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
    .toBe('5|AR-01#totals,AR-03')
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
})

test('the Artifacts tab sits between Board and Outstanding items, and lists every artifact by kind', async ({ page }) => {
  await page.goto('/#/artifacts')
  await expect(page.locator('.tabs .tab')).toHaveText([/^Board/, /^Artifacts\s*5/, /^Outstanding items/, /^Outline/])
  await expect(page.locator('.plate')).toHaveCount(5)
  await expect(page.locator('.group-head')).toHaveText([/Diagrams\s*2/, /Screenshots\s*1/, /Notes\s*1/, /Documents\s*1/])
  await expect(page.locator('.plate', { hasText: 'Fixture drawing' }).locator('.artifact-date')).toHaveText('6 Oct 2026')
  await expect(page.locator('.plate', { hasText: 'Fixture document' }).locator('.artifact-date')).toHaveText('2021')
  // Newest first within a kind.
  await expect(page.locator('.group', { hasText: 'Diagrams' }).locator('.plate-title')).toHaveText(['Fixture drawing', 'Fixture flow'])
  await page.getByRole('button', { name: /^Notes/ }).click()
  await expect(page.locator('.plate')).toHaveCount(1)
  await expect(page.locator('.plate-title')).toHaveText('Fixture note')
})

test('the list layout is remembered: a row per artifact, and one click opens its page', async ({ page }) => {
  await page.goto('/#/artifacts')
  await page.getByRole('radio', { name: /List/ }).click()
  await page.reload()
  await expect(page.locator('.artifact-row')).toHaveCount(5)
  await expect(page.locator('.plate')).toHaveCount(0)
  await expect(page.locator('.artifact-row .thumb')).toHaveCount(5)
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
  await page.goto('/#/artifacts/AR-03?region=contract')
  await expect(page.locator('.canvas-host svg text', { hasText: 'Contract' })).toBeVisible()
  expect(await page.locator('.canvas-host').evaluate((h) => h.shadowRoot!.querySelectorAll('foreignObject').length)).toBe(0)
  const box = await boxOf(page, '.region-box')
  const node = (await page.locator('.canvas-host svg text', { hasText: 'Contract' }).boundingBox())!
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
  const svgBefore = readFileSync(join(FIXTURE_DIR, 'artifacts', 'AR-01.svg'), 'utf8')
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
  expect(text).toContain('file: artifacts/AR-01.svg')
  expect(readFileSync(join(FIXTURE_DIR, 'artifacts', 'AR-01.svg'), 'utf8')).toBe(svgBefore)
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

test.describe('history', () => {
  test.afterEach(() => rmSync(join(FIXTURE_DIR, '.git'), { recursive: true, force: true }))

  test("a file's new version compares side by side, swiped, and as source", async ({ page }) => {
    const git = (cmd: string) => execSync(`git -c user.email=fixture@example.com -c user.name=Fixture ${cmd}`, { cwd: FIXTURE_DIR, stdio: 'ignore' })
    rmSync(join(FIXTURE_DIR, '.git'), { recursive: true, force: true })
    git('init -q')
    git('add -A')
    git('commit -qm "Fixture catalogue"')
    const svg = join(FIXTURE_DIR, 'artifacts', 'AR-01.svg')
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
