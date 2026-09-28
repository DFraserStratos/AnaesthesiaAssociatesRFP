/// <reference lib="dom" />
/**
 * The status menu in an item sheet, over the fixture catalogue (port 5182): picking a status
 * saves that card alone, no Edit needed, and Retired still asks first.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { parseItem } from '../shared/files.ts'
import type { CatalogueSnapshot } from '../shared/types.ts'
import { FIXTURE_DIR, fixtureItems, writeFixture } from './fixtureCatalogue.ts'

test.describe.configure({ mode: 'serial' })

const onDisk = (id: string) => parseItem(readFileSync(join(FIXTURE_DIR, 'requirements', `${id}.md`), 'utf8'))

test.beforeEach(async ({ page, request }) => {
  writeFixture()
  await expect
    .poll(async () => {
      const snap = (await (await request.get('/api/catalogue')).json()) as CatalogueSnapshot
      const items = Object.values(snap.items).map((r) => r.data)
      return items.length === fixtureItems().length && items.every((i) => i.status === 'Proposed')
    })
    .toBe(true)
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/#/board')
  await page.locator('.react-flow__node[data-id="FT-01.2"]').click()
  await expect(page.locator('.sheet.docked h2')).toHaveText('Feature 1.2')
})

test('picking a status saves only the open card, and picking again saves it back', async ({ page }) => {
  const puts: string[] = []
  page.on('request', (r) => {
    if (r.method() !== 'GET' && r.url().includes('/api/')) puts.push(`${r.method()} ${new URL(r.url()).pathname}`)
  })
  const pill = page.locator('.sheet.docked .status-pick-btn')
  await pill.click()
  await expect(page.locator('.status-menu [aria-checked="true"]')).toContainText('Proposed')
  await page.locator('.status-menu button', { hasText: 'Future' }).click()
  await expect(pill).toHaveText('Future')
  await expect.poll(() => onDisk('FT-01.2').status).toBe('Future')

  await pill.click()
  await page.locator('.status-menu button', { hasText: 'Proposed' }).click()
  await expect(pill).toHaveText('Proposed')
  await expect.poll(() => onDisk('FT-01.2').status).toBe('Proposed')

  expect(puts).toEqual(['PUT /api/items/FT-01.2', 'PUT /api/items/FT-01.2'])
  expect(onDisk('EP-01').status).toBe('Proposed')
})

test('keyboard: arrows walk the menu, Esc puts it away and leaves the panel open', async ({ page }) => {
  const pill = page.locator('.sheet.docked .status-pick-btn')
  await pill.focus()
  await page.keyboard.press('ArrowDown')
  await expect(page.locator('.status-menu')).toBeVisible()
  await page.keyboard.press('ArrowDown')
  await expect(page.locator('.status-menu button:focus')).toContainText('Open')
  await page.keyboard.press('Escape')
  await expect(page.locator('.status-menu')).toHaveCount(0)
  await expect(page.locator('.sheet.docked')).toBeVisible()
  await expect(pill).toBeFocused()
})

test('Retired asks first, and Keep it leaves the card as it was', async ({ page }) => {
  await page.locator('.sheet.docked .status-pick-btn').click()
  await page.locator('.status-menu button.retire').click()
  await expect(page.locator('.sheet-veil')).toContainText('Retire this item?')
  await page.locator('.sheet-veil .btn.primary').click()
  await expect(page.locator('.sheet-veil')).toHaveCount(0)
  expect(onDisk('FT-01.2').status).toBe('Proposed')
})
