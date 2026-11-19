import { expect, type Page } from '@playwright/test'

/**
 * Run a harness-bar demo action (catch-up Phase 14): open the "Demo actions"
 * pill, optionally pick a choice, click the entry's Run and wait for its result
 * line. The popover stays open; `close` presses Escape afterwards.
 */
export async function runDemoAction(page: Page, id: string, opts: { choice?: string; close?: boolean } = {}): Promise<string> {
  const pill = page.locator('[data-shot="demo-actions"]')
  const row = page.locator(`[data-shot="demo-action-${id}"]`)
  if (!(await row.isVisible())) await pill.click()
  await expect(row).toBeVisible()
  if (opts.choice !== undefined) await row.locator('select').selectOption(opts.choice)
  const run = row.getByRole('button', { name: 'Run' })
  await expect(run).toBeEnabled()
  await run.click()
  const status = row.getByRole('status')
  await expect(status).not.toHaveText('')
  const text = (await status.textContent()) ?? ''
  if (opts.close === true) await page.keyboard.press('Escape')
  return text
}

/**
 * Advance the demo clock from the harness bar (as `shell-clock.spec.ts` does):
 * open the "Demo clock" popup, press one shortcut (default "+15 min") and close
 * it. Advancing the clock ticks the Xero sync queue (catch-up Phase 37).
 */
export async function advanceClock(page: Page, shortcut = '+15 min'): Promise<void> {
  const trigger = page.getByRole('button', { name: /Demo clock/ })
  await trigger.click()
  const dialog = page.getByRole('dialog').filter({ has: page.getByRole('button', { name: shortcut, exact: true }) })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: shortcut, exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
}
