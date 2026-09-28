/// <reference lib="dom" />
/**
 * Answering a question, over the fixture catalogue (port 5182): the prompt that follows offers each
 * Open item it affects Verify (the default), Confirmed or Open, and saves only the ones moved on.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { writeItem, writeQuestion } from '../server/catalogueFs.ts'
import { parseItem } from '../shared/files.ts'
import type { CatalogueSnapshot, Question } from '../shared/types.ts'
import { FIXTURE_DIR, fixtureItems, writeFixture } from './fixtureCatalogue.ts'

test.describe.configure({ mode: 'serial' })

const AFFECTS = ['FT-01.2', 'FT-01.3']
const question: Question = { id: 'OQ-01', kind: 'question', title: 'Still open', status: 'Open', owner: '', question: 'Is this settled?', answer: '', affects: AFFECTS, sources: [], extra: {} }
const onDisk = (id: string) => parseItem(readFileSync(join(FIXTURE_DIR, 'requirements', `${id}.md`), 'utf8'))

test.beforeEach(async ({ page, request }) => {
  writeFixture()
  for (const it of fixtureItems().filter((i) => AFFECTS.includes(i.id))) writeItem({ ...it, status: 'Open' }, FIXTURE_DIR)
  writeQuestion(question, FIXTURE_DIR)
  await expect
    .poll(async () => {
      const snap = (await (await request.get('/api/catalogue')).json()) as CatalogueSnapshot
      return !!snap.questions['OQ-01'] && AFFECTS.every((id) => snap.items[id]?.data.status === 'Open')
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

test('each item defaults to Verify, and Update saves each to its pick', async ({ page }) => {
  const offer = page.getByRole('region', { name: 'Update affected items' })
  const row = (title: string) => offer.getByRole('group', { name: `Status for ${title}` })
  for (const title of ['Feature 1.2', 'Feature 1.3']) await expect(row(title).locator('[aria-pressed="true"]')).toHaveText('Verify')

  await row('Feature 1.3').getByRole('button', { name: 'Confirmed' }).click()
  await offer.getByRole('button', { name: 'Update 2 items' }).click()
  await expect(offer).toHaveCount(0)
  await expect.poll(() => onDisk('FT-01.2').status).toBe('Verify')
  expect(onDisk('FT-01.3').status).toBe('Confirmed')
})

test('an item left Open is not saved, and all Open leaves nothing to update', async ({ page }) => {
  const offer = page.getByRole('region', { name: 'Update affected items' })
  await offer.getByRole('group', { name: 'Status for Feature 1.2' }).getByRole('button', { name: 'Open' }).click()
  await expect(offer.getByRole('button', { name: 'Update 1 item' })).toBeEnabled()
  await offer.getByRole('group', { name: 'Status for Feature 1.3' }).getByRole('button', { name: 'Open' }).click()
  await expect(offer.getByRole('button', { name: 'Update 0 items' })).toBeDisabled()
  await offer.getByRole('button', { name: 'Leave them all Open' }).click()
  await expect(offer).toHaveCount(0)
  for (const id of AFFECTS) expect(onDisk(id).status).toBe('Open')
})
