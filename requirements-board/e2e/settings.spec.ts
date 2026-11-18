/// <reference lib="dom" />
/**
 * The Settings page over the fixture catalogue (port 5182): statuses are renamed, added and
 * guarded there, and only board.config.json changes; no card file does.
 */
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { configPath, writeItem } from '../server/catalogueFs.ts'
import { DEFAULT_ITEM_STATUSES } from '../shared/statuses.ts'
import type { CatalogueSnapshot } from '../shared/types.ts'
import { FIXTURE_DIR, fixtureItems, writeFixture } from './fixtureCatalogue.ts'

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

test('naming the project and picking its accent changes the masthead and the tab, and nothing else', async ({ page }) => {
  const project = page.locator('section[aria-label="Project"]')
  await project.getByLabel('Project name').fill('Orders')
  await project.getByRole('radio', { name: 'Indigo' }).click()
  await project.getByRole('button', { name: 'Save' }).click()
  await expect(page.locator('.masthead .brand-name')).toHaveText('Requirements board')
  await expect(page.locator('.masthead .brand-project')).toHaveText('Orders')
  await expect(page.locator('.masthead')).toHaveClass(/accented/)
  await expect(page.locator('.masthead .brand-mark rect').last()).toHaveAttribute('fill', '#5a4fcf')
  await expect(page).toHaveTitle('Orders · Requirements board')
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /5a4fcf/)
  const saved = config() as unknown as { board?: unknown; project: unknown }
  expect(saved.board).toBeUndefined()
  expect(saved.project).toEqual({ name: 'Orders', accent: '#5a4fcf' })

  // None takes the accent away again.
  await project.getByRole('radio', { name: 'None' }).click()
  await project.getByRole('button', { name: 'Save' }).click()
  await expect(page.locator('.masthead')).not.toHaveClass(/accented/)
  await expect.poll(() => (config() as unknown as { project: unknown }).project).toEqual({ name: 'Orders' })
})

test('a component in use cannot be removed or renamed; a new one is saved', async ({ page }) => {
  const comps = page.locator('section[aria-label="Components"]')
  await expect(comps.getByRole('button', { name: 'Remove' }).first()).toBeDisabled()
  await comps.getByRole('button', { name: 'Add component' }).click()
  await comps.getByRole('textbox', { name: 'Name of new component' }).fill('Reporting')
  await comps.getByRole('button', { name: 'Save' }).click()
  await expect.poll(() => (config() as unknown as { components: { name: string }[] }).components.map((c) => c.name)).toContain('Reporting')
})

test('the masthead shows a problem pill only while a check fails, and Settings lists the checks', async ({ page }) => {
  const pill = page.locator('.masthead .problem-pill')
  await expect(page.locator('section[aria-label="Checks"]')).toContainText('Every ID, parent, link and value checks out.')
  await expect(pill).toHaveCount(0)
  // A story whose feature does not exist: an error, written on disk as an agent would.
  const orphan = { ...fixtureItems().find((i) => i.id === 'US-01.1.1')!, id: 'US-01.1.9', parent: 'FT-09.9', title: 'Orphan story' }
  writeItem(orphan, FIXTURE_DIR)
  await expect(pill).toHaveClass(/bad/)
  await expect(pill).toHaveText(/\d+ errors?/)
  await pill.click()
  await expect(page.locator('.problem-panel')).toContainText('US-01.1.9')
  await expect(page.locator('section[aria-label="Checks"] .issue-list')).toContainText('US-01.1.9')
  rmSync(join(FIXTURE_DIR, 'stories', 'US-01.1.9.md'))
  await expect(pill).toHaveText('All clear')
  await expect(pill).toHaveCount(0, { timeout: 6000 })
})

test('the About page explains the loop and lists the live statuses', async ({ page }) => {
  await page.goto('/#/about')
  await expect(page.locator('.loop-step')).toHaveCount(6)
  await expect(page.locator('.skill-card')).toHaveCount(8)
  await expect(page.locator('#about-board .about-statuses').first().locator('.status')).toHaveCount(DEFAULT_ITEM_STATUSES.length)
})

test('the writing voice is written and saved to VOICE.md, and a change on disk meanwhile is caught', async ({ page }) => {
  const voicePath = join(FIXTURE_DIR, 'VOICE.md')
  rmSync(voicePath, { force: true })
  await page.reload()
  const voice = page.locator('section[aria-label="Writing voice"]')
  await expect(voice).toContainText('No VOICE.md yet')

  await voice.getByRole('button', { name: 'Write it' }).click()
  await voice.getByRole('textbox', { name: 'VOICE.md' }).fill('# How requirements are written\n\nShort sentences.')
  await expect(voice.locator('.voice-preview')).toContainText('Short sentences.')
  await voice.getByRole('button', { name: 'Save' }).click()
  await expect(voice.getByRole('textbox', { name: 'VOICE.md' })).toBeHidden()
  await expect(voice.locator('.voice-doc')).toContainText('Short sentences.')
  expect(readFileSync(voicePath, 'utf8')).toBe('# How requirements are written\n\nShort sentences.\n')

  // An agent rewrites the file while it is open for editing: saving offers theirs or keeps mine.
  await voice.getByRole('button', { name: 'Edit' }).click()
  await voice.getByRole('textbox', { name: 'VOICE.md' }).fill('# How requirements are written\n\nMine.')
  writeFileSync(voicePath, '# How requirements are written\n\nTheirs.\n')
  await voice.getByRole('button', { name: 'Save' }).click()
  await expect(voice.getByRole('alert')).toContainText('changed on disk')
  await voice.getByRole('button', { name: 'Keep mine' }).click()
  await expect(voice.getByRole('textbox', { name: 'VOICE.md' })).toBeHidden()
  await expect(voice.locator('.voice-doc')).toContainText('Mine.')
  await expect.poll(() => readFileSync(voicePath, 'utf8')).toContain('Mine.')
  rmSync(voicePath, { force: true })
})
