/// <reference lib="dom" />
/**
 * Stepping through Outstanding items from a question's sheet, over the fixture catalogue (port 5182):
 * the arrows follow the list's order (Open, then Awaiting confirmation, then Answered), and a question
 * answered in the sheet keeps its place among the Open ones while it is open.
 */
import { expect, test } from '@playwright/test'
import { writeQuestion } from '../server/catalogueFs.ts'
import type { CatalogueSnapshot, Question } from '../shared/types.ts'
import { FIXTURE_DIR, writeFixture } from './fixtureCatalogue.ts'

test.describe.configure({ mode: 'serial' })

const base = { kind: 'question', owner: '', sources: [], extra: {}, affects: [], question: 'Is this settled?', answer: '' } as const
const questions: Question[] = [
  { ...base, id: 'OQ-01', title: 'First open', status: 'Open', affects: [], sources: [] },
  { ...base, id: 'OQ-02', title: 'Long answered', status: 'Answered', answer: 'Yes.', affects: [], sources: [] },
  { ...base, id: 'OQ-03', title: 'Second open', status: 'Open', affects: [], sources: [] },
  { ...base, id: 'OQ-04', title: 'Third open', status: 'Open', affects: [], sources: [] },
  { ...base, id: 'OQ-05', title: 'Needs confirming', status: 'Confirm', affects: [], sources: [] },
]

test.beforeEach(async ({ page, request }) => {
  writeFixture()
  for (const q of questions) writeQuestion(q, FIXTURE_DIR)
  await expect.poll(async () => Object.keys(((await (await request.get('/api/catalogue')).json()) as CatalogueSnapshot).questions).length).toBe(questions.length)
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/#/questions')
})

test.afterAll(() => writeFixture())

const sheet = (page: import('@playwright/test').Page) => page.getByRole('dialog')

test('the arrows walk the list in its on-screen order', async ({ page }) => {
  await page.locator('.q-row', { hasText: 'First open' }).click()
  await expect(sheet(page).locator('h2')).toHaveText('First open')
  await expect(sheet(page).getByText('1 of 5')).toBeVisible()
  await expect(sheet(page).getByRole('button', { name: 'Previous question' })).toBeDisabled()
  for (const title of ['Second open', 'Third open', 'Needs confirming', 'Long answered']) {
    await sheet(page).getByRole('button', { name: 'Next question' }).click()
    await expect(sheet(page).locator('h2')).toHaveText(title)
  }
  await expect(sheet(page).getByRole('button', { name: 'Next question' })).toBeDisabled()
})

test('an answered question keeps its place, and the walk then skips it', async ({ page }) => {
  await page.locator('.q-row', { hasText: 'Second open' }).click()
  await sheet(page).getByRole('button', { name: 'Answer' }).click()
  await page.getByPlaceholder('What was decided, by whom, when').fill('Decided.')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(sheet(page).locator('h2')).toHaveText('Second open')
  await expect(sheet(page).getByText('2 of 5')).toBeVisible()
  await sheet(page).getByRole('button', { name: 'Next question' }).click()
  await expect(sheet(page).locator('h2')).toHaveText('Third open')
  // Now answered, Second open sits with the Answered ones, so Previous goes to the open one before it.
  await sheet(page).getByRole('button', { name: 'Previous question' }).click()
  await expect(sheet(page).locator('h2')).toHaveText('First open')
})

test('with answered hidden the walk ends before them', async ({ page }) => {
  await page.getByRole('button', { name: 'Show answered' }).click()
  await page.locator('.q-row', { hasText: 'Needs confirming' }).click()
  await expect(sheet(page).getByText('4 of 4')).toBeVisible()
  await expect(sheet(page).getByRole('button', { name: 'Next question' })).toBeDisabled()
})
