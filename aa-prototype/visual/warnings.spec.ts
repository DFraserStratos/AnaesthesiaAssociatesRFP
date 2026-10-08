import { expect, test, type Page } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * Catch-up Phase 15a: warnings, never a block. The Admin Day To-do card, the
 * day-grid outline down to the drawer's Booking row, Clear, the sample
 * triggers; on the phone (the PWA at 375 x 812) Riley's triangle, the warning
 * on screen the moment her Booking opens with no scroll, and the usual submit
 * sheet (no warning text, no extra step).
 */

const RILEY_LIST = 'L-34821-2026-07-24-AM'
const PWA = 'http://localhost:5174'

async function inViewport(page: Page, selector: string): Promise<boolean> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (el === null) return false
    const r = el.getBoundingClientRect()
    return r.top >= 0 && r.bottom <= window.innerHeight && r.height > 0
  }, selector)
}

test('admin: To-do card, outline down to the Booking, Clear, sample triggers', async ({ page }) => {
  await page.goto('/admin/day/2026-07-24')
  await page.waitForLoadState('networkidle')

  const todo = page.locator('[data-shot="admin-warnings-todo"]')
  await expect(todo).toBeVisible()
  await expect(todo).toContainText('Prepayment required')
  await expect(todo).toContainText('Annette Riley')
  await expect(todo).not.toContainText('Provisional')
  // The To-do card sits directly under the mini calendar in the rail.
  const railOrder = await page.locator('[data-testid="admin-right-rail"] > *').evaluateAll((els) =>
    els.map((el) => el.getAttribute('data-shot') ?? el.textContent?.slice(0, 20) ?? ''),
  )
  expect(railOrder[1]).toBe('admin-warnings-todo')

  const block = page.locator('[data-shot="daygrid-block-warnings"]')
  await expect(block).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Has warnings' })).toBeVisible()
  await page.screenshot({ path: 'visual/shots/w15a-01-admin-day-fri24.png', fullPage: true })

  await block.click()
  const row = page.locator('[data-shot="drawer-booking-warning"]')
  await expect(row).toBeVisible()
  await expect(row).toContainText('Annette Riley')
  await expect(row.locator('[data-shot="booking-warning"]')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/w15a-02-drawer-outline.png' })
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Close' }).click()

  // Clear empties the row; the outline drops with it.
  await todo.getByRole('button', { name: 'Clear' }).click()
  await expect(todo).toContainText('Nothing needs attention.')
  await expect(page.locator('[data-shot="daygrid-block-warnings"]')).toHaveCount(0)

  // Samples on the demo day fill the list; clearing them empties it again.
  await page.goto('/admin/day/2026-07-21')
  await page.waitForLoadState('networkidle')
  const raised = await runDemoAction(page, 'raise-sample-warnings', { close: true })
  expect(raised).toContain('1 rule registered')
  await expect(todo.locator('li')).toHaveCount(2)
  await expect(page.locator('[data-shot="daygrid-block-warnings"]')).toHaveCount(2)
  await page.screenshot({ path: 'visual/shots/w15a-03-samples.png', fullPage: true })
  await runDemoAction(page, 'clear-sample-warnings', { close: true })
  await expect(todo.locator('li')).toHaveCount(0)
})

test('admin: the Booking detail shows the warning first, with Raise pre-procedure invoice on its row', async ({ page }) => {
  await page.goto('/admin/day/2026-07-24')
  await page.waitForLoadState('networkidle')
  await page.locator('[data-shot="admin-warnings-todo"]').getByRole('button', { name: "Open Annette Riley's Booking" }).click()
  const panel = page.locator('[data-shot="booking-warnings"]')
  await expect(panel).toBeVisible()
  await expect(panel.locator('[data-shot="booking-prepayment"]')).toContainText('Prepayment required')
  await expect(panel.getByRole('button', { name: /Raise pre-procedure invoice/ })).toBeVisible()
  await expect(panel.getByRole('button', { name: 'Clear' })).toBeVisible()
  await expect(page.getByText(/Override\s+gate/i)).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/w15a-04-admin-booking.png', fullPage: true })
})

test.describe('phone (PWA, 375 x 812)', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true })

  test('triangle on the row, the warning on opening with no scroll, then submit straight through', async ({ page }) => {
    await page.goto(`${PWA}/mobile/lists/${RILEY_LIST}`)
    await page.waitForLoadState('networkidle')
    const rileyRow = page.getByRole('button', { name: /Annette Riley/ })
    const triangle = rileyRow.locator('[data-shot="booking-warning"]')
    await expect(triangle).toBeVisible()
    await page.screenshot({ path: 'visual/shots/w15a-05-mobile-list.png' })

    await rileyRow.click()
    const panel = page.locator('[data-testid="slide-booking"] [data-shot="booking-warnings"]')
    await expect(panel).toBeVisible()
    await expect(panel).toContainText('Before procedure')
    await expect(panel).toContainText('Strong')
    await page.waitForTimeout(500)
    expect(await inViewport(page, '[data-testid="slide-booking"] [data-shot="booking-warnings"]')).toBe(true)
    await expect(panel.getByRole('button', { name: /Clear/ })).toHaveCount(0)
    await page.screenshot({ path: 'visual/shots/w15a-06-mobile-booking-open.png' })

    // Mark complete goes straight through, then submit: the usual sheet, no warning text.
    await page.getByRole('button', { name: 'Mark complete' }).click()
    const markList = page.getByRole('button', { name: 'Mark list completed' })
    await expect(markList).toBeVisible()
    await markList.click()
    const sheet = page.getByText('Submit this list to the office?')
    await expect(sheet).toBeVisible()
    const sheetBody = sheet.locator('xpath=..')
    await expect(sheetBody).toContainText('Submit to office')
    await expect(sheetBody).not.toContainText(/warning|prepayment/i)
    await page.waitForTimeout(600)
    await expect(page.getByRole('button', { name: /anyway/i })).toHaveCount(0)
    await page.screenshot({ path: 'visual/shots/w15a-07-mobile-submit-sheet.png' })
    await page.getByRole('button', { name: 'Submit to office' }).click()
    await expect(page.getByTestId('list-submission-overlay')).toContainText('List submitted')
  })
})
