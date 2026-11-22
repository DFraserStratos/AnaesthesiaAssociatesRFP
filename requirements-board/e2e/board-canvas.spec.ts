/// <reference lib="dom" />
/**
 * B11 in the browser, over the fixture catalogue: the keys on controls inside the canvas
 * (FINDINGS R-115), where a walk or an opened search hit lands and at what zoom (R-116, R-117), the walk
 * order (R-118), and the open card drawn in a collapsed lane or under a retired feature (R-113, R-114).
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { writeItem } from '../server/catalogueFs.ts'
import { parseItem } from '../shared/files.ts'
import type { CatalogueSnapshot } from '../shared/types.ts'
import { FIXTURE_DIR, FIXTURE_LANES, fixtureItems, writeFixture } from './fixtureCatalogue.ts'

test.describe.configure({ mode: 'serial' })

async function boot(page: Page, request: import('@playwright/test').APIRequestContext, viewport: { x: number; y: number; zoom: number }) {
  writeFixture()
  const want = fixtureItems().length
  await expect
    .poll(async () => {
      const snap = (await (await request.get('/api/catalogue')).json()) as CatalogueSnapshot
      const items = Object.values(snap.items).map((r) => r.data)
      if (snap.layout.firstLane || JSON.stringify(snap.layout.lanes) !== JSON.stringify(FIXTURE_LANES)) return false
      return items.length === want && items.every((i) => i.status === '1' && i.order === fixtureItems().find((f) => f.id === i.id)?.order && i.parent === fixtureItems().find((f) => f.id === i.id)?.parent)
    })
    .toBe(true)
  await page.goto('/')
  await page.evaluate((vp) => {
    localStorage.clear()
    localStorage.setItem('requirements-board:viewport:mapped', JSON.stringify(vp))
    localStorage.setItem('requirements-board:view', JSON.stringify({ boardMode: 'mapped' }))
  }, viewport)
  await page.goto('/#/board')
  await expect(page.locator('.board.mapped')).toBeVisible()
  await page.locator('.react-flow__node[data-id="FT-01.1"]').waitFor()
}

const node = (page: Page, id: string) => page.locator(`.react-flow__node[data-id="${id}"]`)
const openId = (page: Page) => page.evaluate(() => new URLSearchParams(location.hash.split('?')[1] ?? '').get('item'))
/** The board's viewport, from React Flow's transform. */
const view = (page: Page) =>
  page.locator('.react-flow__viewport').evaluate((el) => {
    const m = /translate\(([-\d.]+)px, ([-\d.]+)px\) scale\(([\d.]+)\)/.exec((el as HTMLElement).style.transform)!
    return { x: Number(m[1]), y: Number(m[2]), zoom: Number(m[3]) }
  })
/** The viewport once it has stopped moving (two reads 250 ms apart agree). */
async function settled(page: Page) {
  let last = await view(page)
  for (let n = 0; n < 20; n++) {
    await page.waitForTimeout(250)
    const now = await view(page)
    if (JSON.stringify(now) === JSON.stringify(last)) return now
    last = now
  }
  return last
}
const clickCard = async (page: Page, id: string) => node(page, id).click({ position: { x: 20, y: 12 } })

test('R-115: Enter and the arrows on a control inside the canvas do its job, not the walk', async ({ page, request }) => {
  await boot(page, request, { x: 40, y: 80, zoom: 0.6 })
  await clickCard(page, 'FT-01.2')
  await expect.poll(() => openId(page)).toBe('FT-01.2')
  // Enter on Add lane opens its text box, and focus stays in it.
  await page.getByRole('button', { name: 'Add lane' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('textbox', { name: 'New lane name' })).toBeFocused()
  await page.keyboard.press('Escape')
  // Enter on a lane toggle collapses the lane.
  await page.getByRole('button', { name: 'Collapse MVP' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Expand MVP' })).toBeVisible()
  // The arrows on a lane toggle and on the view bar leave the open card alone.
  await page.getByRole('button', { name: 'Expand MVP' }).focus()
  for (const key of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) await page.keyboard.press(key)
  expect(await openId(page)).toBe('FT-01.2')
  await expect(page.locator('.sheet.docked')).not.toBeFocused()
  // Enter with focus on the page still moves into the panel.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await page.keyboard.press('Enter')
  await expect(page.locator('.sheet.docked')).toBeFocused()
})

for (const reduced of [false, true]) {
  test(`R-116: a search hit opened and an arrow-key step from zoom 0.3 land at 0.9; a click keeps the zoom${reduced ? ' (reduced motion)' : ''}`, async ({ page, request }) => {
    if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' })
    await boot(page, request, { x: 40, y: 80, zoom: 0.3 })
    expect((await settled(page)).zoom).toBeCloseTo(0.3, 2)
    // A card on the left, which the panel opening covers.
    await page.keyboard.press('/')
    await page.keyboard.type('Story 1.1.3')
    await page.keyboard.press('Enter')
    await expect.poll(() => openId(page)).toBe('US-01.1.3')
    expect((await settled(page)).zoom).toBeCloseTo(0.9, 2)
    // Back out to 0.3, then a step.
    await page.evaluate(() => {
      localStorage.setItem('requirements-board:viewport:mapped', JSON.stringify({ x: 40, y: 80, zoom: 0.3 }))
    })
    await page.goto('/#/board?item=FT-01.1')
    await page.reload()
    await page.locator('.react-flow__node[data-id="FT-01.1"]').waitFor()
    await settled(page)
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await page.keyboard.press('ArrowRight')
    await expect.poll(() => openId(page)).toBe('FT-01.2')
    expect((await settled(page)).zoom).toBeCloseTo(0.9, 2)
    // A click opens the card and never changes the zoom.
    await clickCard(page, 'FT-01.3')
    await expect.poll(() => openId(page)).toBe('FT-01.3')
    expect((await settled(page)).zoom).toBeCloseTo(0.9, 2)
  })
}

test("R-117: ArrowUp to an epic wider than the board lands its title in view right of the panel, with no second pan", async ({ page, request }) => {
  await boot(page, request, { x: 40, y: 80, zoom: 1.4 })
  await page.keyboard.press('/')
  await page.keyboard.type('Feature 2.3')
  await page.keyboard.press('Enter')
  await expect.poll(() => openId(page)).toBe('FT-02.3')
  await settled(page)
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await page.keyboard.press('ArrowUp')
  await expect.poll(() => openId(page)).toBe('EP-02')
  const at = await settled(page)
  expect(at.zoom).toBeCloseTo(1.4, 2)
  const dock = (await page.locator('.dock').boundingBox())!
  const board = (await page.locator('.board').boundingBox())!
  const title = (await node(page, 'EP-02').locator('.card-title').boundingBox())!
  expect(title.x).toBeGreaterThanOrEqual(dock.x + dock.width)
  expect(title.x + 120).toBeLessThanOrEqual(board.x + board.width)
  await page.waitForTimeout(400)
  expect(await view(page)).toEqual(at)
})

test('a click on a card the panel opens over pans to it, after an arrow-key step to it and Esc (review)', async ({ page, request }) => {
  await boot(page, request, { x: 40, y: 80, zoom: 0.6 })
  await clickCard(page, 'FT-01.2')
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await page.keyboard.press('ArrowLeft')
  await expect.poll(() => openId(page)).toBe('FT-01.1')
  await settled(page)
  await page.keyboard.press('Escape')
  await expect.poll(() => openId(page)).toBeNull()
  const dockW = 533 // a third of the 1,600-pixel page, as the panel opens by default
  // Two-finger pan until the card sits where the panel will open.
  for (let n = 0; n < 12 && (await node(page, 'FT-01.1').boundingBox())!.x > 120; n++)
    await page.evaluate(() => {
      const el = document.querySelector('.react-flow__pane')!
      el.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaX: 120, deltaY: 0, clientX: 800, clientY: 600 }))
    })
  await settled(page)
  expect((await node(page, 'FT-01.1').boundingBox())!.x).toBeLessThan(dockW)
  await clickCard(page, 'FT-01.1')
  await expect.poll(() => openId(page)).toBe('FT-01.1')
  await settled(page)
  const dock = (await page.locator('.dock').boundingBox())!
  expect((await node(page, 'FT-01.1').boundingBox())!.x).toBeGreaterThanOrEqual(dock.x + dock.width)
})

test('R-118: the arrows walk a column as drawn, lane by lane, and skip a collapsed lane', async ({ page, request }) => {
  await boot(page, request, { x: 40, y: 80, zoom: 0.6 })
  await clickCard(page, 'FT-01.1')
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  // On screen: Unassigned holds .2 and .3, MVP holds .1 below them.
  const seen: string[] = []
  for (let n = 0; n < 4; n++) {
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(120)
    seen.push((await openId(page))!)
  }
  expect(seen).toEqual(['US-01.1.2', 'US-01.1.3', 'US-01.1.1', 'US-01.1.1'])
  await page.getByRole('button', { name: 'Collapse MVP' }).click()
  await clickCard(page, 'US-01.1.3')
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(200)
  expect(await openId(page)).toBe('US-01.1.3')
})

test('R-114: Show on board for a story in a collapsed lane draws it, alone in the strip, in view', async ({ page, request }) => {
  await boot(page, request, { x: 40, y: 80, zoom: 0.6 })
  await page.getByRole('button', { name: 'Collapse MVP' }).click()
  await expect(node(page, 'US-02.3.1')).toBeHidden()
  await page.goto('/#/board?item=US-02.3.1&focus=US-02.3.1')
  await expect(node(page, 'US-02.3.1')).toBeVisible()
  await expect(node(page, 'US-02.2.1')).toBeHidden()
  await expect(page.getByRole('button', { name: 'Expand MVP' })).toBeVisible()
  await settled(page)
  const card = (await node(page, 'US-02.3.1').boundingBox())!
  const dock = (await page.locator('.dock').boundingBox())!
  const board = (await page.locator('.board').boundingBox())!
  expect(card.x).toBeGreaterThanOrEqual(dock.x + dock.width)
  expect(card.x + card.width).toBeLessThanOrEqual(board.x + board.width)
  // The strip does not run into the next lane's header.
  const next = (await page.locator('.lane-head', { hasText: 'Phase 2' }).boundingBox())!
  expect(card.y + card.height).toBeLessThanOrEqual(next.y)
})

test('R-29: a story under a feature whose epic is missing is on the board, and search finds it', async ({ page, request }) => {
  await boot(page, request, { x: 40, y: 80, zoom: 0.6 })
  writeItem({ ...fixtureItems().find((i) => i.id === 'FT-02.1')!, parent: 'EP-09' }, FIXTURE_DIR)
  await expect(node(page, 'US-02.1.2')).toBeAttached()
  await page.keyboard.press('/')
  await page.keyboard.type('Story 2.1.2')
  await expect(page.locator('.search-count')).toHaveText(/1 match/)
  await page.keyboard.press('Enter')
  await expect.poll(() => openId(page)).toBe('US-02.1.2')
  await expect(node(page, 'US-02.1.2')).toBeVisible()
})

test('R-113: Show on board for a live story under a retired feature draws the story and its feature', async ({ page, request }) => {
  await boot(page, request, { x: 40, y: 80, zoom: 0.6 })
  const ft = fixtureItems().find((i) => i.id === 'FT-02.2')!
  writeItem({ ...ft, status: '5' }, FIXTURE_DIR)
  await expect(node(page, 'FT-02.2')).toBeHidden()
  await page.goto('/#/board?item=US-02.2.2&focus=US-02.2.2')
  await expect(node(page, 'US-02.2.2')).toBeVisible()
  await expect(node(page, 'FT-02.2')).toBeVisible()
  await expect(node(page, 'US-02.2.3')).toBeHidden()
  await settled(page)
  const card = (await node(page, 'US-02.2.2').boundingBox())!
  const dock = (await page.locator('.dock').boundingBox())!
  expect(card.x).toBeGreaterThanOrEqual(dock.x + dock.width)
  expect(parseItem(readFileSync(join(FIXTURE_DIR, 'stories', 'FT-02.2.md'), 'utf8')).status).toBe('5')
})

const onDisk = (id: string) => parseItem(readFileSync(join(FIXTURE_DIR, 'stories', `${id}.md`), 'utf8'))
const lanesOnDisk = () => (JSON.parse(readFileSync(join(FIXTURE_DIR, 'board-layout.json'), 'utf8')) as { lanes?: string[] }).lanes ?? []
const story = (id: string) => fixtureItems().find((i) => i.id === id)!

test('R-119: a band that differs from a lane only in case moves into it from its menu; a rename onto a lane merges into it', async ({ page, request }) => {
  await boot(page, request, { x: 40, y: 80, zoom: 0.6 })
  writeItem({ ...story('US-01.2.2'), swimlane: 'mvp' }, FIXTURE_DIR)
  writeItem({ ...story('US-01.3.3'), swimlane: 'Phase 2' }, FIXTURE_DIR)
  await expect(page.locator('.lane-name')).toHaveText(['Unassigned', 'MVP', 'Phase 2', 'mvp'])
  await page.getByRole('button', { name: 'mvp lane actions', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Move into MVP' }).click()
  await expect.poll(() => onDisk('US-01.2.2').swimlane).toBe('MVP')
  await expect(page.locator('.lane-name')).toHaveText(['Unassigned', 'MVP', 'Phase 2'])
  expect(lanesOnDisk()).toEqual(['MVP', 'Phase 2'])
  // Renaming a lane onto another lane's name, in another case, merges it into that lane.
  await page.getByRole('button', { name: 'Rename Phase 2', exact: true }).click()
  await page.getByRole('textbox', { name: 'Rename Phase 2' }).fill('mvp')
  await page.keyboard.press('Enter')
  // A merge cannot be undone, so the board asks first; Keep lane is the focused answer.
  const ask = page.getByRole('dialog', { name: 'Merge Phase 2 into MVP' })
  await expect(ask.getByRole('button', { name: 'Keep lane' })).toBeFocused()
  await ask.getByRole('button', { name: 'Merge' }).click()
  await expect.poll(() => onDisk('US-01.3.3').swimlane).toBe('MVP')
  await expect.poll(lanesOnDisk).toEqual(['MVP'])
  await expect(page.locator('.lane-name')).toHaveText(['Unassigned', 'MVP'])
  await expect(page.locator('.problem-pill, .masthead').getByText(/Lane not renamed/)).toHaveCount(0)
})

test('R-120: a collapsed lane stays collapsed through a rename and a reload; deleted, a new lane of its name starts open', async ({ page, request }) => {
  await boot(page, request, { x: 40, y: 80, zoom: 0.6 })
  await page.getByRole('button', { name: 'Collapse MVP' }).click()
  await page.getByRole('button', { name: 'Rename MVP' }).click()
  await page.getByRole('textbox', { name: 'Rename MVP' }).fill('Now')
  await page.keyboard.press('Enter')
  await expect.poll(lanesOnDisk).toEqual(['Now', 'Phase 2'])
  await expect(page.locator('.lane-name')).toHaveText(['Unassigned', 'Now', 'Phase 2'])
  await expect(page.getByRole('button', { name: 'Expand Now' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Expand Now' })).toBeVisible()
  await page.getByRole('button', { name: 'Now lane actions' }).click()
  await page.getByRole('menuitem', { name: 'Delete lane' }).click()
  await page.getByRole('dialog', { name: 'Delete Now' }).getByRole('button', { name: 'Delete lane' }).click()
  await expect.poll(lanesOnDisk).toEqual(['Phase 2'])
  // The tab has the deletion's answer (a lane added before it would be refused for a stale list, nothing written).
  await expect(page.locator('.lane-name')).toHaveText(['Unassigned', 'Phase 2'])
  await page.getByRole('button', { name: 'Add lane' }).click()
  await page.getByRole('textbox', { name: 'New lane name' }).fill('Now')
  await page.keyboard.press('Enter')
  await expect.poll(lanesOnDisk).toEqual(['Phase 2', 'Now'])
  await expect(page.getByRole('button', { name: 'Collapse Now' })).toBeVisible()
})
