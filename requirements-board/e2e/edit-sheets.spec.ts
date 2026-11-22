/// <reference lib="dom" />
/**
 * B06 · edit sheets and Settings end to end, over the fixture catalogue, files written the way
 * an agent writes them: Keep mine keeps everything the user did not change (R-02), the artifact page keeps
 * an orphaned details draft and leaves full screen (R-12), a new card's title takes the typing (R-109),
 * Settings catches a list changed on disk (R-45) and locks a damaged one until it is repaired (R-01).
 */
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { configPath, itemPath } from '../server/catalogueFs.ts'
import { parseItem } from '../shared/files.ts'
import { DEFAULT_ITEM_STATUSES } from '../shared/statuses.ts'
import type { CatalogueSnapshot } from '../shared/types.ts'
import { FIXTURE_CONFIG, FIXTURE_DIR, writeFixture } from './fixtureCatalogue.ts'

test.describe.configure({ mode: 'serial' })

const STORY = 'US-01.1.2'
const storyFile = () => itemPath(STORY, FIXTURE_DIR)
const config = () => JSON.parse(readFileSync(configPath(FIXTURE_DIR), 'utf8')) as { statuses?: { code: number; label: string; help: string }[] }

test.beforeEach(async ({ request }) => {
  writeFixture()
  const ready = async () => ((await (await request.get('/api/catalogue')).json()) as CatalogueSnapshot).config.statuses.length
  await expect.poll(ready).toBe(DEFAULT_ITEM_STATUSES.length)
})

test('Keep mine keeps the user’s description and everything an agent changed meanwhile (R-02)', async ({ page }) => {
  await page.goto(`/#/outline?item=${STORY}`)
  await page.locator('.sheet').getByRole('button', { name: 'Edit' }).click()
  const description = page.locator('.sheet .field', { hasText: 'Description' }).locator('textarea')
  await description.fill('Written in the sheet.')
  // An agent rewrites the description too, moves the card and links an artifact.
  const text = readFileSync(storyFile(), 'utf8')
  writeFileSync(storyFile(), text.replace('parent: FT-01.1', 'parent: FT-01.2').replace('images: []', 'images: []\nartifacts:\n  - AR-01').replace(/\n---\n[\s\S]*$/, '\n---\n\nWritten by the agent.\n'))
  await expect(page.locator('.sheet [role="alert"]')).toContainText('changed on disk')
  await page.locator('.sheet').getByRole('button', { name: 'Keep mine' }).click()
  await page.keyboard.press('ControlOrMeta+s')
  await expect(page.locator('.sheet').getByRole('button', { name: 'Edit' })).toBeVisible()
  const saved = parseItem(readFileSync(storyFile(), 'utf8'))
  expect(saved).toMatchObject({ description: 'Written in the sheet.', parent: 'FT-01.2', artifacts: ['AR-01'] })
})

test('a new card opened in Edit takes the typing in its title (R-109)', async ({ page }) => {
  // A story added from its feature's sheet opens in its own sheet, in Edit.
  await page.goto('/#/outline?item=FT-01.1')
  await page.locator('.sheet').getByRole('button', { name: 'Story', exact: true }).click()
  await page.locator('.sheet input[placeholder="New story title"]').fill('A story')
  await page.keyboard.press('Enter')
  const title = page.locator('.sheet input.title-input')
  await expect(title).toBeFocused()
  await page.keyboard.type(' typed on')
  await expect(title).toHaveValue('A story typed on')
})

test('New card on Outline makes the card and opens it in Edit, typing in its title; Esc gives focus back (R-109)', async ({ page }) => {
  await page.goto('/#/outline')
  const plus = page.getByRole('button', { name: 'New card' })
  await plus.click()
  await page.locator('.new-card-pop').getByRole('radio', { name: 'Epic' }).click()
  await page.locator('.new-card-pop input.input').fill('A new epic')
  await page.keyboard.press('Enter')
  const title = page.locator('.sheet input.title-input')
  await expect(title).toHaveValue('A new epic')
  await expect(title).toBeFocused()
  await page.keyboard.type(' at once')
  await expect(title).toHaveValue('A new epic at once')
  await page.keyboard.press('Escape') // asks: the title was changed
  await page.getByRole('button', { name: 'Discard changes' }).click()
  await page.keyboard.press('Escape')
  await expect(page.locator('.sheet')).toHaveCount(0)
  await expect(page.evaluate(() => document.activeElement === document.body)).resolves.toBe(false)
})

test('the artifact page keeps an orphaned details draft, leaves full screen, and lets it go only when asked (R-12)', async ({ page }) => {
  await page.goto('/#/artifacts/AR-01')
  await page.getByRole('button', { name: 'Edit details' }).click()
  await page.getByLabel('Name').fill('Renamed in the panel')
  await page.locator('.canvas-dock .view-bar').getByRole('button', { name: 'Full screen' }).click()
  await expect(page.locator('html')).toHaveClass(/artifact-full/)
  rmSync(join(FIXTURE_DIR, 'artifacts', 'AR-01.md'))
  await expect(page.locator('.artifact-panel')).toContainText('AR-01 not found')
  await expect(page.locator('.artifact-panel .orphan-text')).toHaveText('Renamed in the panel')
  await expect(page.locator('html')).not.toHaveClass(/artifact-full/)
  await expect(page.locator('.masthead')).toBeVisible()
  // Nothing goes without asking: Esc and the Artifacts crumb each ask first.
  for (const leave of [() => page.keyboard.press('Escape'), () => page.locator('.artifact-panel-head .crumb').click()]) {
    await leave()
    await expect(page.getByRole('alertdialog')).toContainText('Discard your changes?')
    await expect(page.getByRole('button', { name: 'Keep editing' })).toBeFocused()
    await page.getByRole('button', { name: 'Keep editing' }).click()
  }
  await page.getByRole('button', { name: 'Discard edits' }).click()
  await expect(page.getByText('There is no artifact AR-01')).toBeVisible()
})

test('Settings catches a status list changed on disk, and Keep mine keeps both (R-45)', async ({ page }) => {
  await page.goto('/#/settings')
  const items = page.locator('section[aria-label="Item statuses"]')
  await items.getByRole('textbox', { name: 'What Proposed means' }).fill('Reworded here')
  writeFileSync(configPath(FIXTURE_DIR), JSON.stringify({ ...FIXTURE_CONFIG, statuses: [...DEFAULT_ITEM_STATUSES.map((d) => ({ ...d, code: Number(d.code) })), { code: 7, label: 'On hold', help: '', tone: 'neutral' }] }, null, 2) + '\n')
  await expect(items.getByRole('alert')).toContainText('changed in board.config.json')
  await expect(items.getByRole('button', { name: 'Save' })).toBeDisabled()
  await items.getByRole('button', { name: 'Keep mine' }).click()
  await expect(items.getByRole('textbox', { name: 'Name of On hold' })).toBeVisible()
  await items.getByRole('button', { name: 'Save' }).click()
  await expect.poll(() => config().statuses?.map((d) => `${d.code} ${d.help}`)).toEqual(expect.arrayContaining([expect.stringMatching(/^1 Reworded here$/), '7 ']))
})

test('a damaged status list is locked, and comes back when repaired, without a reload (R-01)', async ({ page }) => {
  await page.goto('/#/settings')
  const items = page.locator('section[aria-label="Item statuses"]')
  await expect(items.getByRole('button', { name: 'Add status' })).toBeVisible()
  const list = DEFAULT_ITEM_STATUSES.map((d) => ({ ...d, code: Number(d.code) }))
  writeFileSync(configPath(FIXTURE_DIR), JSON.stringify({ ...FIXTURE_CONFIG, statuses: [...list, list[1]] }, null, 2) + '\n')
  await expect(items).toContainText('until board.config.json is fixed')
  await expect(items.getByRole('button', { name: 'Add status' })).toHaveCount(0)
  await expect(items.locator('.status-tr')).toHaveCount(0)
  await expect(page.locator('section[aria-label="Project"]').getByRole('button', { name: 'Save' })).toBeVisible()
  writeFileSync(configPath(FIXTURE_DIR), JSON.stringify({ ...FIXTURE_CONFIG, statuses: list }, null, 2) + '\n')
  await expect(items.getByRole('button', { name: 'Add status' })).toBeVisible()
})
