import { expect, test, type Page } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * Admin, Intake, Sources and the two benches it feeds (build plan Phase 71; US-02.1.7, US-02.1.6; D117, D118,
 * D125). Each source's state, today's messages and what each became, held messages with their reason and a
 * restricted raw view, the hospitals not connected, inbound only; Lists that match exactly confirmed together
 * in one change, never by themselves; a held message dismissed with a reason.
 */

async function fresh(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await page.evaluate(() => window.localStorage.clear())
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

test('Sources: each source, inbound only, the hospitals not connected, no control that writes', async ({ page }) => {
  await fresh(page, '/admin/intake/sources')
  const view = page.locator('[data-shot="intake-sources"]')
  await expect(view.locator('[data-shot="intake-sources-inbound"]')).toContainText('AA reads from these sources and never writes back to them')
  await expect(view.locator('[data-shot="intake-sources-row"][data-source-id="SRC-STG"]')).toContainText("St George's")
  await expect(view.locator('[data-shot="intake-sources-row"][data-source-id="SRC-SX"]')).toContainText('Southern Cross')
  await expect(view.locator('[data-shot="intake-sources-row"][data-source-id="SRC-MAILBOX"]')).toBeVisible()
  const notConnected = view.locator('[data-shot="intake-sources-not-connected"]')
  await expect(notConnected).toContainText('Forte Health')
  await expect(notConnected).toContainText('Lists come by PDF to the mailbox')
  await expect(view.getByRole('button', { name: /retry|reconnect|send/i })).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/admin-intake-sources.png', fullPage: true })
})

test('A feed message fails: held under Southern Cross with its reason; View raw asks a reason; Dismiss with a reason', async ({ page }) => {
  await fresh(page, '/admin/intake')
  await runDemoAction(page, 'intake-feed-fails', { close: true })
  await page.goto('/admin/intake/sources')
  await page.waitForLoadState('networkidle')
  const held = page.locator('[data-shot="intake-sources-held"]')
  await expect(held).toContainText('Southern Cross')
  await expect(page.locator('[data-shot="intake-sources-messages"] [data-message-state="held"]')).toHaveCount(1)
  await held.locator('[data-shot="intake-sources-held-raw"]').first().click()
  await expect(page.locator('[data-shot="matching-raw-row-sheet"]')).toBeVisible()
  await page.keyboard.press('Escape')

  // The held bench on Arrivals: dismiss it with a reason; it leaves the count and reads Dismissed.
  await page.goto('/admin/intake')
  await page.waitForLoadState('networkidle')
  await page.locator('[data-shot="intake-feed-item"][data-arrival-kind="held"]').first().click()
  const bench = page.locator('[data-shot="intake-bench-held"]')
  await expect(bench).toBeVisible()
  await bench.locator('[data-shot="intake-held-dismiss"]').click()
  const sheet = page.locator('[data-shot="intake-held-dismiss-sheet"]')
  await expect(sheet.locator('[data-shot="intake-held-dismiss-confirm"]')).toBeDisabled()
  await sheet.locator('[data-shot="intake-held-dismiss-reason"]').fill('Southern Cross resent it with the patient')
  await sheet.locator('[data-shot="intake-held-dismiss-confirm"]').click()
  await page.goto('/admin/intake/sources')
  await expect(page.locator('[data-shot="intake-sources-messages"] [data-message-state="dismissed"]')).toHaveCount(1)
})

test("St George's day-before: the Lists that match exactly are confirmed together", async ({ page }) => {
  await fresh(page, '/admin/intake')
  await runDemoAction(page, 'intake-stg-day-before', { close: true })
  const item = page.locator('[data-shot="intake-feed-item"][data-arrival-kind="matchesExactly"]').first()
  await item.click()
  const bench = page.locator('[data-shot="intake-bench-matchesExactly"]')
  const rows = bench.locator('[data-shot="intake-unchanged-lists"] tr[data-arrival-key]')
  const n = await rows.count()
  expect(n).toBeGreaterThan(0)
  const confirm = bench.locator('[data-shot="intake-confirm-unchanged"]')
  await expect(confirm).toHaveText(`Confirm unchanged (${n})`)
  await page.screenshot({ path: 'visual/shots/admin-intake-matches-exactly.png', fullPage: true })
  await confirm.click()
  // Decided, they leave To decide.
  await expect(page.locator('[data-shot="intake-feed-item"][data-arrival-kind="matchesExactly"]')).toHaveCount(0)
})
