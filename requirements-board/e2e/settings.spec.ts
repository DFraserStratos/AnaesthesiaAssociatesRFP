/// <reference lib="dom" />
/**
 * The Settings page over the fixture catalogue (port 5182): statuses are renamed, added and
 * guarded there, and only board.config.json changes; no card file does.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { configPath } from '../server/catalogueFs.ts'
import { DEFAULT_ITEM_STATUSES } from '../shared/statuses.ts'
import type { CatalogueSnapshot } from '../shared/types.ts'
import { FIXTURE_DIR, writeFixture } from './fixtureCatalogue.ts'

test.describe.configure({ mode: 'serial' })

const story = () => readFileSync(join(FIXTURE_DIR, 'stories', 'FT-01.2.md'), 'utf8')
const config = () => JSON.parse(readFileSync(configPath(FIXTURE_DIR), 'utf8')) as { statuses?: { code: number; label: string }[]; project: unknown }
const items = (page: import('@playwright/test').Page) => page.locator('section[aria-label="Item statuses"]')

test.beforeEach(async ({ page, request }) => {
  writeFixture()
  // The fixture has no statuses of its own, so a reset brings back the defaults (and drops any added).
  const labels = async () => ((await (await request.get('/api/catalogue')).json()) as CatalogueSnapshot).config.statuses.map((d) => d.label)
  await expect.poll(labels).toEqual(DEFAULT_ITEM_STATUSES.map((d) => d.label))
  await page.goto('/#/settings')
  await expect(page.locator('.page-head h1')).toHaveText('Settings')
})

test('renaming a status rewrites the config only, and the board shows the new name', async ({ page }) => {
  const before = story()
  const label = items(page).getByRole('textbox', { name: 'Name of Proposed' })
  await label.fill('Draft')
  await items(page).getByRole('button', { name: 'Save' }).click()
  await expect.poll(() => config().statuses?.[0]).toMatchObject({ code: 1, label: 'Draft' })
  expect(config().project).toEqual({ name: 'Fixture project' })
  expect(story()).toBe(before)

  await page.goto('/#/board?item=FT-01.2')
  await expect(page.locator('.sheet.docked .status-pick-btn')).toHaveText('Draft')
})

test('a new status takes the next free number and joins the menu', async ({ page }) => {
  await items(page).getByRole('button', { name: 'Add status' }).click()
  await items(page).getByRole('textbox', { name: 'Name of New status' }).fill('On hold')
  await expect(items(page).locator('.status-tr.fresh .status-no')).toHaveText('6')
  await items(page).getByRole('button', { name: 'Save' }).click()
  await expect.poll(() => config().statuses?.at(-1)).toMatchObject({ code: 6, label: 'On hold' })

  await page.goto('/#/board?item=FT-01.2')
  await page.locator('.sheet.docked .status-pick-btn').click()
  await expect(page.locator('.status-menu button', { hasText: 'On hold' })).toBeVisible()
})

test('a status in use, or holding a required role, cannot be removed; the rules hold before saving', async ({ page }) => {
  const remove = items(page).getByRole('button', { name: 'Remove' })
  await expect(remove.first()).toBeDisabled()
  await expect(remove.first()).toHaveAttribute('title', /Used by \d+ cards/)
  await expect(remove.last()).toBeDisabled() // retired holds a required role
  await expect(remove.nth(2)).toBeEnabled() // verify: unused, no role

  // Taking the default role away leaves the list without one: Save waits until it is fixed.
  await items(page).getByRole('combobox', { name: 'Role of Proposed' }).selectOption('')
  await expect(items(page).locator('.settings-problems')).toContainText('one status needs the default role')
  await expect(items(page).getByRole('button', { name: 'Save' })).toBeDisabled()
  await items(page).getByRole('button', { name: 'Discard changes' }).click()
  await expect(items(page).locator('.settings-problems')).toHaveCount(0)
})
