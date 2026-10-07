/// <reference lib="dom" />
/**
 * Links between cards, over the fixture catalogue (port 5182): links in the text open the card
 * they name, Related shows a relation on both cards plus the cards that mention this one, and a
 * copied card link pasted over selected text makes a Markdown link.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { parseItem } from '../shared/files.ts'
import type { CatalogueSnapshot } from '../shared/types.ts'
import { writeItem } from '../server/catalogueFs.ts'
import { FIXTURE_DIR, fixtureItems, writeFixture } from './fixtureCatalogue.ts'

test.describe.configure({ mode: 'serial' })

const onDisk = (id: string) => parseItem(readFileSync(join(FIXTURE_DIR, 'stories', `${id}.md`), 'utf8'))
const panel = (page: Page) => page.locator('.sheet.docked')

test.beforeEach(async ({ page, request, context }) => {
  writeFixture()
  const base = fixtureItems().find((i) => i.id === 'US-01.1.1')!
  writeItem({ ...base, description: 'Needs [the rule](US-01.1.2) and US-01.2.1.', related: ['US-01.1.3'] }, FIXTURE_DIR)
  await expect
    .poll(async () => {
      const snap = (await (await request.get('/api/catalogue')).json()) as CatalogueSnapshot
      return snap.items['US-01.1.1']?.data.related.join(',')
    })
    .toBe('US-01.1.3')
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
})

test('links in the text open the card they name; a bare ID reads as its title', async ({ page }) => {
  await page.goto('/#/board?item=US-01.1.1')
  await expect(panel(page).locator('h2')).toHaveText('Story 1.1.1')
  const links = panel(page).locator('.prose a.record-link')
  await expect(links).toHaveText(['the rule', 'Story 1.2.1'])
  await links.first().click()
  await expect(panel(page).locator('h2')).toHaveText('Story 1.1.2')
})

test('Related shows a relation on both cards, and the cards whose text mentions this one', async ({ page }) => {
  await page.goto('/#/board?item=US-01.1.3')
  const related = panel(page).locator('.section.related')
  await expect(related.locator('.link-row')).toHaveText(['Story 1.1.1Proposed'])

  await page.goto('/#/board?item=US-01.1.2')
  await expect(related.locator('.related-sub')).toHaveText('Mentioned in')
  await expect(related.locator('.link-row')).toHaveText(['Story 1.1.1Proposed'])
  await related.locator('.link-row').click()
  await expect(panel(page).locator('h2')).toHaveText('Story 1.1.1')
})

test('a copied card link pasted over selected text links it, and Cmd+Z takes it back', async ({ page }) => {
  await page.goto('/#/board?item=US-01.1.2')
  await panel(page).locator('.item-id').click()
  await expect(panel(page).locator('.item-id')).toHaveText('Link copied')
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  expect(copied).toMatch(/#\/board\?item=US-01\.1\.2$/)

  await page.goto('/#/board?item=US-01.1.3')
  await panel(page).getByRole('button', { name: 'Edit' }).click()
  const text = panel(page).locator('textarea.textarea').first()
  await text.fill('Uses the prepaid set here.')
  await text.evaluate((el: HTMLTextAreaElement, pasted) => {
    el.setSelectionRange(9, 20)
    const data = new DataTransfer()
    data.setData('text/plain', pasted)
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }))
  }, copied)
  await expect(text).toHaveValue('Uses the [prepaid set](US-01.1.2) here.')
  await page.keyboard.press('ControlOrMeta+z')
  await expect(text).toHaveValue('Uses the prepaid set here.')

  // Cmd+K: pick the card by title instead.
  await text.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(9, 20))
  await page.keyboard.press('ControlOrMeta+k')
  await page.locator('.link-picker input').fill('Story 1.2.3')
  await page.keyboard.press('Enter')
  await expect(text).toHaveValue('Uses the [prepaid set](US-01.2.3) here.')

  await expect(panel(page).locator('.field-note')).toContainText('Also related from Story 1.1.1')
  await page.keyboard.press('ControlOrMeta+s')
  await expect.poll(() => onDisk('US-01.1.3').description).toBe('Uses the [prepaid set](US-01.2.3) here.')
})
