import { expect, test } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * Catch-up Phase 36: the Admin Ledger (US-13.2.1, US-08.3.4, US-08.3.5). The
 * whole ledger in balance from a reset; the "Inject unmatched receipt" demo
 * action (naming Dr Souter) takes it and her ledger out by $120.00 and badges
 * the nav's Finances entry (build plan Phase 58: the Ledger is a Finances
 * tab); "Allocate" in the rail's Receipts to place clears it (Phase 64: the
 * one sentence, four tiles and the Anaesthetists list), back in balance on the
 * tab and on her account.
 */

const SOUTER = '34821'

test('admin ledger: in balance, an unmatched receipt takes it out, allocating brings it back', async ({ page }) => {
  test.setTimeout(60_000)
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => consoleErrors.push(error.message))

  await page.goto('/admin/finances/ledger')
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: 'Finances', exact: true, level: 1 })).toBeVisible()
  await expect(page.locator('[data-shot="finances-tabs"] [data-finances-tab="ledger"]')).toBeVisible()

  // A reset (build plan Phase 64): the sentence says the books are square, four tiles, nothing to place.
  const balance = page.locator('[data-shot="ledger-balance"]')
  await expect(balance).toHaveAttribute('data-in-balance', 'true')
  await expect(balance).toContainText('The books are square')
  await expect(page.locator('[data-shot="ledger-tiles"] [data-ledger-tile]')).toHaveCount(4)
  await expect(page.locator('[data-ledger-tile="receipts-to-place"]')).toContainText('$0.00')
  await expect(page.locator('[data-shot="ledger-summary"]')).toContainText('every one square')
  await expect(page.locator('[data-shot="nav-badge-finances"]')).toHaveCount(0)
  await expect(page.locator('[data-shot="ledger-unmatched"] [data-unmatched-id]')).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/ledger-01-in-balance.png', fullPage: true })

  // A $120.00 bank deposit naming Dr Souter matches no invoice.
  const message = await runDemoAction(page, 'inject-unmatched-receipt', { choice: 'souter' })
  expect(message).toMatch(/out of balance by \$120\.00/)
  const inject = page.locator('[data-shot="demo-action-inject-unmatched-receipt"]')
  await expect(inject.getByRole('button', { name: 'Run' })).toBeDisabled()
  await page.keyboard.press('Escape')

  await expect(balance).toHaveAttribute('data-in-balance', 'false')
  await expect(balance).toContainText('The books are out by $120.00')
  await expect(balance).toContainText('1 receipt that matches no invoice')
  await expect(page.locator('[data-check="unmatchedReceiptHeld"]')).toContainText('SOUTER JULY, $120.00')
  await expect(page.locator('[data-ledger-tile="receipts-to-place"]')).toContainText('$120.00')
  await expect(page.locator('[data-shot="nav-badge-finances"]')).toHaveText('1')
  // 85 anaesthetists page at 50: find her by name.
  await page.locator('[data-shot="ledger-search"] input, input[data-shot="ledger-search"]').first().fill('Souter')
  const list = page.locator('[data-shot="ledger-anaesthetists"]')
  const souterRow = list.locator(`[data-anaesthetist-id="${SOUTER}"]`)
  await expect(souterRow).toContainText('Dr Souter')
  await expect(souterRow).toContainText('Out by $120.00')
  await expect(page.locator('[data-shot="ledger-summary"]')).toContainText('1 out of balance')
  const held = page.locator('[data-shot="ledger-unmatched"]')
  await expect(held.locator('[data-unmatched-id]')).toHaveCount(1)
  await page.screenshot({ path: 'visual/shots/ledger-02-out-of-balance.png', fullPage: true })

  // Her account says the same, in words.
  await souterRow.click()
  await expect(page).toHaveURL(new RegExp(`/admin/finances/ledger/anaesthetists/${SOUTER}$`))
  await expect(balance).toContainText("Dr Souter's ledger is out of balance by $120.00")
  // Who owes whom, in words. (Read from the tiles row: the two cards' own hooks do not reach the DOM, see Phase 36's checklist.)
  const tiles = page.locator('[data-shot="ledger-tiles"]')
  await expect(tiles).toHaveAttribute('data-shot-scope', 'anaesthetist')
  await expect(tiles).toContainText('AA owes Dr Souter')
  await expect(tiles).toContainText('Dr Souter owes AA')
  await page.screenshot({ path: 'visual/shots/ledger-03-souter-out.png', fullPage: true })

  // Back to the whole ledger; allocate the held receipt to an invoice it covers.
  await page.goBack()
  await expect(page).toHaveURL(/\/admin\/finances\/ledger(\?q=Souter)?$/)
  await held.locator('[data-shot="ledger-allocate"]').click()
  const dialog = page.locator('[data-shot="ledger-allocate-dialog"]')
  await expect(dialog).toBeVisible()
  const options = dialog.locator('[data-allocate-pair]')
  expect(await options.count()).toBeGreaterThan(0)
  // Dr Souter's receivables are listed first.
  await expect(options.first()).toContainText('Dr Souter')
  await page.screenshot({ path: 'visual/shots/ledger-04-allocate.png', fullPage: true })
  const pairId = await options.first().getAttribute('data-allocate-pair')
  await options.first().click()
  await expect(dialog).toHaveCount(0)

  await expect(balance).toHaveAttribute('data-in-balance', 'true')
  await expect(balance).toContainText('The books are square')
  await expect(souterRow).toContainText('Square')
  await expect(page.locator('[data-shot="nav-badge-finances"]')).toHaveCount(0)
  // A placed receipt leaves the rail (D106).
  await expect(held.locator('[data-unmatched-id]')).toHaveCount(0)
  expect(pairId).not.toBeNull()
  await page.screenshot({ path: 'visual/shots/ledger-05-allocated.png', fullPage: true })

  // Her scope is back in balance too.
  await page.goto(`/admin/finances/ledger/anaesthetists/${SOUTER}`)
  await page.waitForLoadState('networkidle')
  await expect(balance).toHaveAttribute('data-in-balance', 'true')
  await expect(balance).toContainText("Dr Souter's ledger is in balance")
  await page.screenshot({ path: 'visual/shots/ledger-06-souter-in-balance.png', fullPage: true })

  expect(consoleErrors, `console errors: ${consoleErrors.join(' | ')}`).toEqual([])
})
