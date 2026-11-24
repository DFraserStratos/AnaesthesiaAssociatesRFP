/// <reference lib="dom" />
/**
 * A snapshot (`npm run snapshot`) served as static files: it reads, never writes, and a reader's
 * answers, comments and suggested edits are kept in the browser and come out in the downloaded file.
 * Served from the fixture snapshot `snapshotFixture.ts` writes (see playwright.config.ts).
 */
import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { SNAPSHOT_QUESTION, SNAPSHOT_STORY } from './snapshotFixture.ts'

test.describe.configure({ mode: 'serial' })

/** Every request the page makes must be answered: the snapshot has no server behind it. */
function watchFailures(page: Page) {
  const failed: string[] = []
  page.on('response', (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`))
  page.on('requestfailed', (r) => failed.push(`failed ${r.url()}`))
  page.on('pageerror', (e) => failed.push(`error ${e.message}`))
  return failed
}

test.beforeEach(async ({ page }) => {
  await page.goto('./')
  await page.evaluate(() => localStorage.clear())
})

test('reads the catalogue and shows no way to edit it', async ({ page }) => {
  const failed = watchFailures(page)
  await page.goto('./#/board')
  await expect(page.locator('.react-flow__node[data-id="EP-01"]')).toBeVisible()
  await expect(page.locator('.snapshot-mark')).toContainText('Snapshot')
  await expect(page.locator('nav.tabs')).not.toContainText('Diff review')
  await expect(page.locator('a[href="#/settings"]')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'New card' })).toHaveCount(0)
  await expect(page.locator('.lane-menu-btn')).toHaveCount(0)

  await page.locator('.react-flow__node[data-id="FT-01.1"]').click()
  const sheet = page.locator('.sheet.docked')
  await expect(sheet.locator('h2')).toHaveText('Feature 1.1')
  for (const label of ['Edit', 'Delete', 'Retire', 'History']) await expect(sheet.getByRole('button', { name: label, exact: true })).toHaveCount(0)
  await expect(sheet.locator('.status-pick')).toHaveCount(0)
  await expect(sheet.getByRole('button', { name: 'Comment' })).toBeVisible()

  // A screenshot, and artifacts of every kind, load from the static files.
  await page.goto(`./#/outline?item=${SNAPSHOT_STORY}`)
  await expect(page.locator('.sheet img').first()).toHaveJSProperty('complete', true)
  expect(await page.locator('.sheet img').first().evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(320)
  for (const [id, sel] of [['AR-01', 'svg'], ['AR-04', '.doc-sheet'], ['AR-05', '.pdf-frame canvas']] as const) {
    await page.goto(`./#/artifacts/${id}`)
    await expect(page.locator('.artifact-panel h2')).toBeVisible()
    await expect(page.locator(`.artifact-stage ${sel}`).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('tab', { name: 'History' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Edit details' })).toHaveCount(0)
  }
  expect(failed).toEqual([])
})

test('a reader answers, comments and suggests an edit, and downloads them', async ({ page }) => {
  await page.goto(`./#/questions?question=${SNAPSHOT_QUESTION}`)
  const q = page.locator('.sheet', { has: page.locator('h2', { hasText: 'Who signs it off' }) })
  await q.getByRole('button', { name: 'Answer' }).click()
  await q.getByRole('textbox', { name: 'Your answer' }).fill('The practice manager.')
  await q.getByRole('button', { name: 'Keep response' }).click()
  await expect(q.locator('.respond-item')).toContainText('The practice manager.')
  await expect(q.getByRole('button', { name: 'Change your answer' })).toBeVisible()
  await q.getByRole('button', { name: 'Close' }).click()

  await page.goto(`./#/outline?item=${SNAPSHOT_STORY}`)
  const s = page.locator('.sheet')
  await s.getByRole('button', { name: 'Suggest an edit' }).click()
  await s.locator('.respond-box textarea').first().fill('The story as it should read.')
  await s.getByRole('button', { name: 'Keep response' }).click()
  await expect(page.locator('.responses-btn .count')).toHaveText('2')

  await page.goto('./#/artifacts/AR-01?region=totals')
  await page.getByRole('button', { name: 'Comment' }).click()
  await page.locator('.respond-box textarea').fill('The totals look wrong.')
  await page.locator('.respond-box').getByRole('button', { name: 'Keep response' }).click()

  // Kept across a reload.
  await page.reload()
  await expect(page.locator('.responses-btn .count')).toHaveText('3')

  await page.locator('.responses-btn').click()
  const tray = page.getByRole('dialog', { name: 'Your responses' })
  await expect(tray.getByRole('button', { name: 'Download' })).toBeDisabled()
  await tray.getByLabel('Your name').fill('Pat Reader')
  const [download] = await Promise.all([page.waitForEvent('download'), tray.getByRole('button', { name: 'Download' }).click()])
  expect(download.suggestedFilename()).toMatch(/^responses-pat-reader-\d{4}-\d{2}-\d{2}\.md$/)
  const text = readFileSync((await download.path())!, 'utf8')
  expect(text).toContain('- **From:** Pat Reader')
  expect(text).toContain(`## Answer · ${SNAPSHOT_QUESTION} · Who signs it off`)
  expect(text).toContain('The practice manager.')
  expect(text).toContain(`## Suggested edit · ${SNAPSHOT_STORY} · Story 1.1.1`)
  expect(text).toMatch(/\*\*Was:\*\*\n\n> The story as written\.\n\n\*\*Suggested:\*\*\n\n> The story as it should read\./)
  expect(text).toContain('## Comment · AR-01#totals · Fixture drawing (spot: Totals)')
  expect(text).toContain('```json')
})
