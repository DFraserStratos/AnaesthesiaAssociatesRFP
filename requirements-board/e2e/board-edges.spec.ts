/// <reference lib="dom" />
/**
 * Every card on screen must be joined to its parent. The lines once vanished board-wide on
 * about two loads in three: a rebuild landing mid-measure left React Flow with sized nodes
 * but no handles, and nothing re-measured them (see `cardHandles` in src/board/cardData.ts).
 * The race is timing-dependent, so each check runs over several fresh loads.
 */
import { expect, test, type Page } from '@playwright/test'
import type { CatalogueSnapshot } from '../shared/types.ts'

const LOADS = 8
const VIEWPORT_KEY = 'requirements-board:viewport'

let parentOf: Record<string, string> = {}
test.beforeAll(async ({ request }) => {
  const snap = (await (await request.get('/api/catalogue')).json()) as CatalogueSnapshot
  parentOf = Object.fromEntries(Object.values(snap.items).flatMap(({ data }) => (data.parent ? [[data.id, data.parent]] : [])))
})

/** Rendered cards whose parent is rendered too but whose edge is not. */
function missingEdges(page: Page) {
  return page.evaluate((parentOf) => {
    const nodes = new Set([...document.querySelectorAll<HTMLElement>('.react-flow__node')].map((e) => e.dataset.id!))
    const edges = new Set([...document.querySelectorAll<HTMLElement>('.react-flow__edge')].map((e) => e.dataset.id!))
    const joined = [...nodes].filter((id) => parentOf[id] && nodes.has(parentOf[id]))
    return { joined: joined.length, missing: joined.filter((id) => !edges.has(`${parentOf[id]}>${id}`)) }
  }, parentOf)
}

async function expectAllJoined(page: Page, when: string) {
  // Poll: edges draw a frame or two after the cards, and a healthy board settles fast.
  await expect.poll(async () => (await missingEdges(page)).missing, { message: `edges missing ${when}`, timeout: 3000 }).toEqual([])
  expect((await missingEdges(page)).joined, `no parent and child both on screen ${when}`).toBeGreaterThan(0)
}

async function freshLoad(page: Page, viewport: { x: number; y: number; zoom: number } | null) {
  await page.goto('/')
  await page.evaluate(([k, v]) => (v ? localStorage.setItem(k, v) : localStorage.removeItem(k)), [VIEWPORT_KEY, viewport && JSON.stringify(viewport)] as const)
  await page.goto('/#/board')
  await page.reload()
  await page.locator('.react-flow__node').first().waitFor()
}

test('a fresh load joins every card to its parent', async ({ page }) => {
  for (let i = 1; i <= LOADS; i++) {
    await freshLoad(page, { x: 40, y: 80, zoom: 0.6 })
    await expectAllJoined(page, `on load ${i}`)
  }
})

test('the whole map, fitted, joins every card', async ({ page }) => {
  for (let i = 1; i <= 3; i++) {
    await freshLoad(page, null)
    await expectAllJoined(page, `fitted, load ${i}`)
  }
})

test('edges survive opening cards, the Retired toggle and zooming', async ({ page }) => {
  await freshLoad(page, { x: 40, y: 80, zoom: 0.6 })
  await page.locator('.react-flow__node').nth(3).click()
  await expectAllJoined(page, 'with a card open')
  await page.getByRole('button', { name: 'Retired' }).click()
  await expectAllJoined(page, 'with retired shown')
  await page.getByRole('button', { name: 'Retired' }).click()
  await expectAllJoined(page, 'with retired hidden again')
  await page.getByRole('button', { name: 'Fit the whole map' }).click()
  await expectAllJoined(page, 'after fitting the map')
})
