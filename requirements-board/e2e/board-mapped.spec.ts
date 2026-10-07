/// <reference lib="dom" />
/**
 * The Mapped board over the fixture catalogue (port 5182): dragging a feature reorders
 * its siblings in the files, a story can change feature and lane in one drop, and a lane
 * collapses. Each test starts from a freshly written fixture.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { parseItem } from '../shared/files.ts'
import type { CatalogueSnapshot } from '../shared/types.ts'
import { FIXTURE_DIR, FIXTURE_LANES, fixtureItems, writeFixture } from './fixtureCatalogue.ts'

test.describe.configure({ mode: 'serial' })

const onDisk = (id: string) => parseItem(readFileSync(join(FIXTURE_DIR, 'stories', `${id}.md`), 'utf8'))

test.beforeEach(async ({ page, request }) => {
  writeFixture()
  // Wait for the watcher to hand the fresh files to the server.
  const want = fixtureItems().length
  await expect
    .poll(async () => {
      const snap = (await (await request.get('/api/catalogue')).json()) as CatalogueSnapshot
      const items = Object.values(snap.items).map((r) => r.data)
      if (snap.layout.firstLane || JSON.stringify(snap.layout.lanes) !== JSON.stringify(FIXTURE_LANES)) return false
      return items.length === want && items.every((i) => i.order === fixtureItems().find((f) => f.id === i.id)?.order && i.parent === fixtureItems().find((f) => f.id === i.id)?.parent)
    })
    .toBe(true)
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('requirements-board:viewport:mapped', JSON.stringify({ x: 40, y: 80, zoom: 0.6 }))
  })
  await page.goto('/#/board')
  await page.locator('.react-flow__node-card').first().waitFor()
  await page.getByRole('radio', { name: 'Mapped' }).click()
  await expect(page.locator('.board.mapped')).toBeVisible()
  await page.locator('.react-flow__node[data-id="FT-01.1"]').waitFor()
})

const node = (page: Page, id: string) => page.locator(`.react-flow__node[data-id="${id}"]`)

async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(from.x + 8, from.y + 8, { steps: 4 })
  await page.mouse.move(to.x, to.y, { steps: 20 })
  await page.mouse.up()
}

test('shows the lanes, Unassigned first, with no connector lines', async ({ page }) => {
  await expect(page.locator('.lane-name')).toHaveText(['Unassigned', 'MVP', 'Phase 2'])
  await expect(page.locator('.lane-head', { hasText: 'MVP' }).locator('.lane-count')).toHaveText('8')
  await expect(page.locator('.react-flow__edge')).toHaveCount(0)
})

test('dragging a feature to an earlier slot reorders its siblings in the files', async ({ page }) => {
  const f2Before = (await node(page, 'FT-01.2').boundingBox())!
  const f4 = (await node(page, 'FT-01.4').boundingBox())!
  await drag(page, { x: f4.x + 30, y: f4.y + 20 }, { x: f2Before.x + 20, y: f2Before.y + 30 })
  await expect.poll(() => onDisk('FT-01.4').order).toBe(2)
  expect([onDisk('FT-01.1').order, onDisk('FT-01.2').order, onDisk('FT-01.3').order]).toEqual([1, 3, 4])
  // The feature bumped right, and its stories went with it.
  await expect.poll(async () => (await node(page, 'FT-01.2').boundingBox())!.x).toBeGreaterThan(f2Before.x + 50)
  const s = (await node(page, 'US-01.4.2').boundingBox())!
  expect(Math.abs(s.x - f2Before.x)).toBeLessThan(4)
})

test('a story dropped into another feature and lane changes parent and lane, and keeps its ID', async ({ page }) => {
  const story = (await node(page, 'US-01.1.2').boundingBox())!
  const col = (await node(page, 'FT-01.3').boundingBox())!
  const lane = (await page.locator('.lane-head', { hasText: 'Phase 2' }).boundingBox())!
  await drag(page, { x: story.x + 30, y: story.y + 20 }, { x: col.x + 40, y: lane.y + 70 })
  await expect.poll(() => onDisk('US-01.1.2').parent).toBe('FT-01.3')
  expect(onDisk('US-01.1.2')).toMatchObject({ id: 'US-01.1.2', swimlane: 'Phase 2' })
  await expect(page.locator('.lane-head', { hasText: 'Phase 2' }).locator('.lane-count')).toHaveText('1')
})

test('undo puts a dropped story back in its feature and lane, and redo drops it again', async ({ page }) => {
  const before = onDisk('US-01.1.2')
  const story = (await node(page, 'US-01.1.2').boundingBox())!
  const col = (await node(page, 'FT-01.3').boundingBox())!
  const lane = (await page.locator('.lane-head', { hasText: 'Phase 2' }).boundingBox())!
  await drag(page, { x: story.x + 30, y: story.y + 20 }, { x: col.x + 40, y: lane.y + 70 })
  await expect.poll(() => onDisk('US-01.1.2').parent).toBe('FT-01.3')
  await page.keyboard.press('ControlOrMeta+z')
  await expect.poll(() => onDisk('US-01.1.2')).toMatchObject({ parent: before.parent, swimlane: before.swimlane, order: before.order })
  // A step is ignored while the last one is still saving, so press until it takes (an extra press finds nothing to redo).
  await expect(async () => {
    await page.keyboard.press('ControlOrMeta+Shift+z')
    await expect.poll(() => onDisk('US-01.1.2'), { timeout: 1000 }).toMatchObject({ parent: 'FT-01.3', swimlane: 'Phase 2' })
  }).toPass()
  await expect(async () => {
    await page.keyboard.press('ControlOrMeta+z')
    await expect.poll(() => onDisk('US-01.1.2').parent, { timeout: 1000 }).toBe(before.parent)
  }).toPass()
})

test('a card\'s history shows the move that was just made, and Back returns to the card', async ({ page }) => {
  const story = (await node(page, 'US-01.1.2').boundingBox())!
  const col = (await node(page, 'FT-01.3').boundingBox())!
  const lane = (await page.locator('.lane-head', { hasText: 'Phase 2' }).boundingBox())!
  await drag(page, { x: story.x + 30, y: story.y + 20 }, { x: col.x + 40, y: lane.y + 70 })
  await expect.poll(() => onDisk('US-01.1.2').parent).toBe('FT-01.3')
  await node(page, 'US-01.1.2').click()
  await page.locator('.sheet.docked').getByRole('button', { name: 'History' }).click()
  const newest = page.locator('.hist-entry').first()
  await expect(newest).toContainText('On the board')
  await expect(newest).toContainText('Moved from')
  await expect(newest.locator('.hist-name').last()).toContainText('Feature 1.3')
  await expect(newest).toContainText('Phase 2')
  await page.getByRole('button', { name: 'Back to card' }).click()
  await expect(page.locator('.history')).toHaveCount(0)
  await expect(page.locator('.sheet.docked .read-view')).toBeVisible()
})

test('clicking a lane name renames it, the first lane too', async ({ page }) => {
  await page.getByRole('button', { name: 'Rename Unassigned' }).click()
  await page.getByRole('textbox', { name: 'Rename Unassigned' }).fill('Backlog')
  await page.keyboard.press('Enter')
  await expect(page.locator('.lane-name')).toHaveText(['Backlog', 'MVP', 'Phase 2'])
  await page.getByRole('button', { name: 'Rename MVP' }).click()
  await page.getByRole('textbox', { name: 'Rename MVP' }).fill('Release 1')
  await page.keyboard.press('Enter')
  await expect.poll(() => onDisk('US-01.1.1').swimlane).toBe('Release 1')
  await expect
    .poll(() => JSON.parse(readFileSync(join(FIXTURE_DIR, 'board-layout.json'), 'utf8')))
    .toMatchObject({ firstLane: 'Backlog', lanes: ['Release 1', 'Phase 2'] })
})

test('collapsing a lane hides its stories and keeps the rest', async ({ page }) => {
  await expect(node(page, 'US-01.1.1')).toBeVisible()
  await page.getByRole('button', { name: 'Collapse MVP' }).click()
  await expect(node(page, 'US-01.1.1')).toBeHidden()
  await expect(node(page, 'US-01.1.2')).toBeVisible()
  await page.getByRole('button', { name: 'Expand MVP' }).click()
  await expect(node(page, 'US-01.1.1')).toBeVisible()
})

test('two fingers on a trackpad pan the board; a pinch and a mouse wheel zoom', async ({ page }) => {
  const transform = () => page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('.react-flow__viewport')!).transform))
  const at = { x: 800, y: 500 }
  const fire = (init: { deltaX?: number; deltaY?: number; ctrlKey?: boolean }) =>
    page.evaluate(
      (arg: { x: number; y: number; deltaX?: number; deltaY?: number; ctrlKey?: boolean }) =>
        document.elementFromPoint(arg.x, arg.y)!.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, clientX: arg.x, clientY: arg.y, ...arg })),
      { ...at, ...init },
    )
  const before = await transform()
  await fire({ deltaX: 30, deltaY: 40 })
  await expect.poll(async () => (await transform()).f).toBeCloseTo(before.f - 40)
  expect((await transform()).a).toBe(before.a)
  await page.waitForTimeout(300) // end the gesture
  await fire({ deltaY: -20, ctrlKey: true })
  await expect.poll(async () => (await transform()).a).toBeGreaterThan(before.a)
  const pinched = (await transform()).a
  await page.waitForTimeout(300)
  await page.mouse.move(at.x, at.y)
  await page.mouse.wheel(0, 100)
  await expect.poll(async () => (await transform()).a).toBeLessThan(pinched)
})

test('lane headers zoom with the map, and stay pinned 16px inside the board when panned', async ({ page }) => {
  const head = page.locator('.lane-head', { hasText: 'MVP' })
  const zoomOf = () => page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('.react-flow__viewport')!).transform).a)
  const board = (await page.locator('.board').boundingBox())!
  const z0 = await zoomOf()
  const h0 = (await head.boundingBox())!.height
  // A pinch over a header zooms the board (never the page), and the header shrinks with it (small enough to stay in one zoom band).
  const prevented = await head.evaluate((el) => {
    const r = el.getBoundingClientRect()
    const e = new WheelEvent('wheel', { bubbles: true, cancelable: true, ctrlKey: true, deltaY: 8, clientX: r.x + 20, clientY: r.y + 5 })
    el.dispatchEvent(e)
    return e.defaultPrevented
  })
  expect(prevented).toBe(true)
  await expect.poll(zoomOf).toBeLessThan(z0)
  const z1 = await zoomOf()
  expect((await head.boundingBox())!.height / h0).toBeCloseTo(z1 / z0, 1)
  // Pan far to the right: the header stays in view at the board's left edge, whole.
  await page.evaluate(() => {
    const el = document.elementFromPoint(800, 600)!
    for (let i = 0; i < 20; i++) el.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaX: 150, deltaY: 0, clientX: 800, clientY: 600 }))
  })
  await expect.poll(async () => Math.round((await head.boundingBox())!.x - board.x)).toBe(16)
})

/**
 * A real trackpad pinch, through Chrome's own gesture path (not a synthetic wheel event): anywhere
 * on the page it zooms the board or nothing, never the page. A page pinch-zoom magnifies the
 * window's content and slides it sideways on a pan, which pushed the lane headers off screen
 * while every layout-viewport measurement still looked right, so this measures what is visible.
 */
test('a real pinch never zooms the page, and the headers stay whole on screen and no bigger than the cards', async ({ page }) => {
  const cdp = await page.context().newCDPSession(page)
  const pinch = (x: number, y: number, scaleFactor: number) => cdp.send('Input.synthesizePinchGesture', { x, y, scaleFactor, relativeSpeed: 800 })
  const pageScale = () => page.evaluate(() => window.visualViewport!.scale)
  const zoomOf = () => page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('.react-flow__viewport')!).transform).a)
  const masthead = (await page.locator('.masthead').boundingBox())!
  await pinch(masthead.x + masthead.width / 2, masthead.y + masthead.height / 2, 2.5)
  expect(await pageScale()).toBe(1)
  // Over the item panel too.
  await node(page, 'FT-01.1').click()
  const panel = (await page.locator('.dock').boundingBox())!
  await pinch(panel.x + panel.width / 2, panel.y + panel.height / 2, 2.5)
  expect(await pageScale()).toBe(1)
  await page.keyboard.press('Escape')
  // Over the canvas the board zooms out, as far as the overview.
  const board = (await page.locator('.board').boundingBox())!
  for (let i = 0; i < 3 && (await zoomOf()) >= 0.3; i++) await pinch(board.x + board.width / 2, board.y + board.height / 2, 0.4)
  expect(await pageScale()).toBe(1)
  await expect(page.locator('.board.zoom-overview')).toBeVisible()
  // No bigger than a feature title at the same zoom.
  const sizes = await page.evaluate(() => ({
    lane: parseFloat(getComputedStyle(document.querySelector('.lane-name')!).fontSize),
    feature: parseFloat(getComputedStyle(document.querySelector('.feature .card-title')!).fontSize),
  }))
  expect(sizes.lane).toBeLessThanOrEqual(sizes.feature)
  // Pan right: every header is whole and inside the board, as the visual viewport sees it. (This far
  // out the map is narrower than half the board, so the pan limit stops it before its left edge
  // passes the board's: the headers sit at the map's edge rather than pinned to the board's.)
  await page.evaluate(() => {
    const el = document.elementFromPoint(800, 600)!
    for (let i = 0; i < 20; i++) el.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaX: 150, deltaY: 0, clientX: 800, clientY: 600 }))
  })
  const heads = await page.evaluate(() => {
    const vv = window.visualViewport!
    const b = document.querySelector('.board')!.getBoundingClientRect()
    return [...document.querySelectorAll('.lane-head')].map((h) => {
      const r = h.getBoundingClientRect()
      return { left: r.left - vv.offsetLeft, right: r.right - vv.offsetLeft, boardLeft: b.left - vv.offsetLeft, boardRight: Math.min(b.right, vv.width) - vv.offsetLeft }
    })
  })
  expect(heads.length).toBeGreaterThan(0)
  for (const h of heads) {
    expect(h.left).toBeGreaterThanOrEqual(h.boardLeft + 8)
    expect(h.right).toBeLessThanOrEqual(h.boardRight)
  }
})

test('opening and closing a card floats the panel over the board without moving the map', async ({ page }) => {
  // A card on screen that the panel (a third of the width) will not cover.
  const id = await page.evaluate(() => {
    const el = [...document.querySelectorAll<HTMLElement>('.react-flow__node-card')].find((n) => {
      const r = n.getBoundingClientRect()
      return r.left > 700 && r.right < window.innerWidth && r.bottom < window.innerHeight
    })
    return el?.dataset.id
  })
  expect(id).toBeTruthy()
  const before = (await node(page, id!).boundingBox())!
  await node(page, id!).click()
  await expect(page.locator('.dock')).toBeVisible()
  await page.waitForTimeout(600) // past the panel's entrance and any pan it might trigger
  expect(await node(page, id!).boundingBox()).toEqual(before)
  // The lane names and the search step right to stay clear of it.
  const dock = (await page.locator('.dock').boundingBox())!
  expect((await page.locator('.lane-name').first().boundingBox())!.x).toBeGreaterThan(dock.x + dock.width)
  expect((await page.locator('.toolbar .search').boundingBox())!.x).toBeGreaterThan(dock.x + dock.width)
  await page.keyboard.press('Escape')
  await expect(page.locator('.dock')).toHaveCount(0)
  expect(await node(page, id!).boundingBox()).toEqual(before)
})

test('the minimap opens from the map button, jumps the view to wherever it is pressed, and the zoom toggle fits the map then zooms back', async ({ page }) => {
  const minimap = page.getByRole('img', { name: /Minimap/ })
  const mapButton = page.getByRole('button', { name: 'Minimap' })
  await expect(minimap).toBeHidden()
  // The board opens on the whole map, so fitting changes nothing and zooming back goes in to 100%.
  const zoomOf = async () => Number((await page.locator('.react-flow__viewport').getAttribute('style'))!.match(/scale\(([\d.]+)\)/)![1])
  await page.getByRole('button', { name: 'Fit the whole map' }).click()
  await page.getByRole('button', { name: 'Zoom back in' }).click()
  await expect.poll(zoomOf).toBe(1)
  // Hover the map button, then slide straight left onto the minimap: it stays open the whole way.
  await mapButton.hover()
  await expect(minimap).toBeVisible()
  const btn = (await mapButton.boundingBox())!
  await page.waitForTimeout(250) // the slide-in
  let m = (await minimap.boundingBox())!
  expect(m.x + m.width).toBeLessThanOrEqual(btn.x)
  await page.mouse.move(m.x + m.width - 6, btn.y + btn.height / 2, { steps: 12 })
  await page.waitForTimeout(400)
  await expect(minimap).toBeVisible()
  m = (await minimap.boundingBox())!
  const board = (await page.locator('.board').boundingBox())!
  const inBoard = async (id: string) => {
    // Cards off screen aren't rendered at all.
    const b = (await node(page, id).count()) ? await node(page, id).boundingBox() : null
    return !!b && b.x >= board.x && b.x + b.width <= board.x + board.width
  }
  await page.mouse.click(m.x + m.width - 6, m.y + m.height / 3)
  await expect.poll(() => inBoard('FT-02.4')).toBe(true)
  expect(await inBoard('FT-01.1')).toBe(false)
  await page.mouse.click(m.x + 6, m.y + m.height / 3)
  await expect.poll(() => inBoard('FT-01.1')).toBe(true)
  // Off the zone, it closes.
  await page.mouse.move(board.x + board.width / 2, board.y + board.height / 2)
  await expect(minimap).toBeHidden()
  // Pressing the map button pins it open; pressing again unpins it.
  await mapButton.click()
  await page.mouse.move(board.x + board.width / 2, board.y + board.height / 2)
  await page.waitForTimeout(400)
  await expect(minimap).toBeVisible()
  await mapButton.click()
  await page.mouse.move(board.x + board.width / 2, board.y + board.height / 2)
  await expect(minimap).toBeHidden()
  const before = await page.locator('.react-flow__viewport').getAttribute('style')
  await page.getByRole('button', { name: 'Fit the whole map' }).click()
  await page.getByRole('button', { name: 'Zoom back in' }).click()
  await expect(page.getByRole('button', { name: 'Fit the whole map' })).toBeVisible()
  await expect.poll(() => page.locator('.react-flow__viewport').getAttribute('style')).toBe(before)
})

test('panning never takes the map off the board: an edge stops at the middle', async ({ page }) => {
  const board = (await page.locator('.board').boundingBox())!
  await page.mouse.move(board.x + board.width / 2, board.y + board.height / 2)
  // Trackpad-style scrolls (a sideways component), far past the map's right end.
  for (let i = 0; i < 12; i++) await page.mouse.wheel(4000, 0)
  await page.waitForTimeout(200)
  const last = (await node(page, 'US-02.4.3').boundingBox())!
  expect(last.x + last.width).toBeLessThan(board.x + board.width / 2)
  expect(last.x + last.width).toBeGreaterThan(board.x)
  // And back the other way, far past its left end and its top.
  for (let i = 0; i < 12; i++) await page.mouse.wheel(-4000, -4000)
  await page.waitForTimeout(200)
  const first = (await node(page, 'EP-01').boundingBox())!
  expect(first.x).toBeGreaterThan(board.x + board.width / 2 - 20)
  expect(first.x).toBeLessThan(board.x + board.width)
  expect(first.y).toBeLessThan(board.y + board.height)
})
