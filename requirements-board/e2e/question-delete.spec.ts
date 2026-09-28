/// <reference lib="dom" />
/**
 * Questions on an item sheet, over the fixture catalogue (port 5182): only open ones show,
 * and deleting one from its sheet asks first, removes the file and drops it off the card.
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { writeQuestion } from '../server/catalogueFs.ts'
import type { CatalogueSnapshot, Question } from '../shared/types.ts'
import { FIXTURE_DIR, writeFixture } from './fixtureCatalogue.ts'

test.describe.configure({ mode: 'serial' })

const base = { kind: 'question', owner: '', sources: [], extra: {}, affects: ['FT-01.2'] } as const
const questions: Question[] = [
  { ...base, id: 'OQ-01', title: 'Still open', status: 'Open', question: 'Is this settled?', answer: '', affects: ['FT-01.2'], sources: [] },
  { ...base, id: 'OQ-02', title: 'Already answered', status: 'Answered', question: 'Was this settled?', answer: 'Yes.', affects: ['FT-01.2'], sources: [] },
]
const fileOf = (id: string) => join(FIXTURE_DIR, 'questions', `${id}.md`)

test.beforeEach(async ({ page, request }) => {
  writeFixture()
  for (const q of questions) writeQuestion(q, FIXTURE_DIR)
  await expect.poll(async () => Object.keys(((await (await request.get('/api/catalogue')).json()) as CatalogueSnapshot).questions).length).toBe(2)
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/#/board')
  await page.locator('.react-flow__node[data-id="FT-01.2"]').click()
  await expect(page.locator('.sheet.docked h2')).toHaveText('Feature 1.2')
})

test.afterAll(() => writeFixture())

test('the item sheet lists only open questions', async ({ page }) => {
  const cards = page.locator('.sheet.docked .oq-card')
  await expect(cards).toHaveCount(1)
  await expect(cards).toContainText('Still open')
})

test('deleting asks first, Keep it leaves the file, Delete question removes it and it drops off the card', async ({ page }) => {
  await page.locator('.sheet.docked .oq-card', { hasText: 'Still open' }).click()
  const sheet = page.locator('.sheet', { has: page.locator('h2', { hasText: 'Still open' }) })
  await sheet.getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByRole('alertdialog', { name: 'Delete this question?' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Keep it' })).toBeFocused()
  await page.getByRole('button', { name: 'Keep it' }).click()
  expect(existsSync(fileOf('OQ-01'))).toBe(true)

  await sheet.getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('button', { name: 'Delete question' }).click()
  await expect.poll(() => existsSync(fileOf('OQ-01'))).toBe(false)
  expect(existsSync(fileOf('OQ-02'))).toBe(true)
  await expect(page.locator('.sheet.docked h2')).toHaveText('Feature 1.2')
  await expect(page.locator('.sheet.docked .oq-card')).toHaveCount(0)
})
