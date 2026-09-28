/// <reference lib="dom" />
/**
 * The board's search, over the fixture catalogue (port 5182): Ctrl F focuses it, typing lists the
 * matching cards, arrow keys find each on the board without opening it, Enter opens, Esc goes back.
 */
import { expect, test } from '@playwright/test'
import type { CatalogueSnapshot } from '../shared/types.ts'
import { fixtureItems, writeFixture } from './fixtureCatalogue.ts'

test.describe.configure({ mode: 'serial' })

test.beforeEach(async ({ page, request }) => {
  writeFixture()
  await expect.poll(async () => Object.keys(((await (await request.get('/api/catalogue')).json()) as CatalogueSnapshot).items).length).toBe(fixtureItems().length)
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/#/board')
  await expect(page.locator('.react-flow__node[data-id="EP-01"]')).toBeVisible()
})

const search = (page: import('@playwright/test').Page) => page.getByRole('combobox', { name: 'Search the board' })
const viewport = (page: import('@playwright/test').Page) => page.locator('.react-flow__viewport').evaluate((el) => (el as HTMLElement).style.transform)

test('Ctrl F focuses the search, arrows find cards without opening them, Enter opens one', async ({ page }) => {
  await page.keyboard.press('Control+f')
  await expect(search(page)).toBeFocused()
  await page.keyboard.type('story 1.2')
  const rows = page.getByRole('listbox', { name: 'Cards that match' }).getByRole('option')
  await expect(rows.nth(0)).toContainText('Story 1.2.1')
  await expect(rows.nth(1)).toContainText('Story 1.2.2')

  await page.keyboard.press('ArrowDown')
  await expect(page.locator('.react-flow__node.peek')).toHaveAttribute('data-id', 'US-01.2.1')
  await page.keyboard.press('ArrowDown')
  await expect(page.locator('.react-flow__node.peek')).toHaveAttribute('data-id', 'US-01.2.2')
  await expect(rows.nth(1)).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('.search-count')).toHaveText(/^2 of \d+$/)
  expect(page.url()).not.toContain('item=')
  await expect(page.locator('.sheet.docked')).toHaveCount(0)

  await page.keyboard.press('Enter')
  await expect(page.locator('.sheet.docked h2')).toHaveText('Story 1.2.2')
  expect(page.url()).toContain('item=US-01.2.2')
  await expect(page.getByRole('listbox', { name: 'Cards that match' })).toHaveCount(0)
  await expect(page.locator('.react-flow__node.peek')).toHaveCount(0)
  await expect(search(page)).toHaveValue('story 1.2')

  // Esc on the board then closes the card and clears the search.
  await page.keyboard.press('Escape')
  await expect(page.locator('.sheet.docked')).toHaveCount(0)
  await expect(search(page)).toHaveValue('')
  await expect(page.locator('.search-count')).toHaveCount(0)
})

test('Cmd F works too, and Esc takes the board back to where it was', async ({ page }) => {
  const before = await viewport(page)
  await page.keyboard.press('Meta+f')
  await expect(search(page)).toBeFocused()
  await page.keyboard.type('story 2.4')
  await page.keyboard.press('ArrowDown')
  await expect(page.locator('.react-flow__node.peek')).toHaveAttribute('data-id', 'US-02.4.1')
  await expect.poll(() => viewport(page)).not.toBe(before)
  await page.keyboard.press('Escape')
  await expect(search(page)).toHaveValue('')
  await expect(search(page)).not.toBeFocused()
  await expect.poll(() => viewport(page)).toBe(before)
  await expect(page.locator('.react-flow__node.peek')).toHaveCount(0)
})

test('with a card open, a found card lands clear of the panel and the list', async ({ page }) => {
  await page.locator('.react-flow__node[data-id="FT-01.2"]').click()
  await expect(page.locator('.sheet.docked h2')).toHaveText('Feature 1.2')
  await page.keyboard.press('Control+f')
  await page.keyboard.type('story 2.3.3')
  await page.keyboard.press('ArrowDown')
  await expect(page.locator('.react-flow__node.peek')).toHaveAttribute('data-id', 'US-02.3.3')
  // Let the pan settle, then check where the card sits.
  await page.waitForTimeout(600)
  const rect = (sel: string) => page.locator(sel).evaluate((el) => el.getBoundingClientRect().toJSON() as DOMRect)
  const box = await rect('.react-flow__node.peek')
  const list = await rect('.search-results')
  const dock = await rect('.dock')
  expect(box.x).toBeGreaterThan(list.x + list.width)
  expect(box.x).toBeGreaterThan(dock.x + dock.width)
  // Esc from the search leaves the open card open.
  await page.keyboard.press('Escape')
  await expect(page.locator('.sheet.docked h2')).toHaveText('Feature 1.2')
})
