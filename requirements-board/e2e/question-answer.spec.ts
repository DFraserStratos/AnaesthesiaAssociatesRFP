/// <reference lib="dom" />
/**
 * Answering a question, over the fixture catalogue (port 5182): the prompt that follows offers every
 * item it affects Verify or Confirmed beside its own status. Open items start at Verify, the rest keep
 * their status, and only the ones changed are saved.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { writeItem, writeQuestion } from '../server/catalogueFs.ts'
import { parseItem } from '../shared/files.ts'
import type { CatalogueSnapshot, Question } from '../shared/types.ts'
import { FIXTURE_DIR, fixtureItems, writeFixture } from './fixtureCatalogue.ts'

test.describe.configure({ mode: 'serial' })

/** Two Open items, and one already Confirmed (an answer can still send it back to Verify). */
const STARTING = { 'FT-01.2': 'Open', 'FT-01.3': 'Open', 'FT-01.4': 'Confirmed' } as const
const AFFECTS = Object.keys(STARTING) as (keyof typeof STARTING)[]
const question: Question = { id: 'OQ-01', kind: 'question', title: 'Still open', status: 'Open', owner: '', question: 'Is this settled?', answer: '', affects: AFFECTS, sources: [], extra: {} }
const onDisk = (id: string) => parseItem(readFileSync(join(FIXTURE_DIR, 'requirements', `${id}.md`), 'utf8'))

test.beforeEach(async ({ page, request }) => {
  writeFixture()
  for (const it of fixtureItems()) if (it.id in STARTING) writeItem({ ...it, status: STARTING[it.id as keyof typeof STARTING] }, FIXTURE_DIR)
  writeQuestion(question, FIXTURE_DIR)
  await expect
    .poll(async () => {
      const snap = (await (await request.get('/api/catalogue')).json()) as CatalogueSnapshot
      return !!snap.questions['OQ-01'] && AFFECTS.every((id) => snap.items[id]?.data.status === STARTING[id])
    })
    .toBe(true)
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/#/board')
  await page.locator('.react-flow__node[data-id="FT-01.2"]').click()
  await page.locator('.sheet.docked .oq-card', { hasText: 'Still open' }).click()
  const sheet = page.locator('.sheet', { has: page.locator('h2', { hasText: 'Still open' }) })
  await sheet.getByRole('button', { name: 'Answer' }).click()
  // Editing swaps the title heading for an input, so the form is found by its own fields.
  await page.getByPlaceholder('What was decided, by whom, when').fill('Partly.')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Update affected items' })).toBeVisible()
})

test.afterAll(() => writeFixture())

test('Open items start at Verify, a Confirmed one stays, and Update saves each pick', async ({ page }) => {
  const offer = page.getByRole('region', { name: 'Update affected items' })
  const row = (title: string) => offer.getByRole('group', { name: `Status for ${title}` })
  for (const title of ['Feature 1.2', 'Feature 1.3']) {
    await expect(row(title).getByRole('button')).toHaveText(['Open', 'Verify', 'Confirmed'])
    await expect(row(title).locator('[aria-pressed="true"]')).toHaveText('Verify')
  }
  await expect(row('Feature 1.4').getByRole('button')).toHaveText(['Verify', 'Confirmed'])
  await expect(row('Feature 1.4').locator('[aria-pressed="true"]')).toHaveText('Confirmed')

  await row('Feature 1.3').getByRole('button', { name: 'Confirmed' }).click()
  await row('Feature 1.4').getByRole('button', { name: 'Verify' }).click()
  await offer.getByRole('button', { name: 'Update 3 items' }).click()
  await expect(offer).toHaveCount(0)
  await expect.poll(() => onDisk('FT-01.2').status).toBe('Verify')
  expect(onDisk('FT-01.3').status).toBe('Confirmed')
  expect(onDisk('FT-01.4').status).toBe('Verify')
})

test('an item kept at its own status is not saved, and nothing changed leaves nothing to update', async ({ page }) => {
  const offer = page.getByRole('region', { name: 'Update affected items' })
  await expect(offer.getByRole('button', { name: 'Update 2 items' })).toBeEnabled()
  await offer.getByRole('group', { name: 'Status for Feature 1.2' }).getByRole('button', { name: 'Open' }).click()
  await offer.getByRole('group', { name: 'Status for Feature 1.3' }).getByRole('button', { name: 'Open' }).click()
  await expect(offer.getByRole('button', { name: 'Update 0 items' })).toBeDisabled()
  await offer.getByRole('button', { name: 'Leave them as they are' }).click()
  await expect(offer).toHaveCount(0)
  for (const id of AFFECTS) expect(onDisk(id).status).toBe(STARTING[id])
})
