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
