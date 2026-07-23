import { test, expect } from '@playwright/test'

/**
 * Phase 05 web walkthrough — dashboard, lists table, list detail, card detail
 * (shared BTM capture), availability grid + request-cover, and the accounts
 * (overdue + GST) surfaces. Working artifacts for eyeballing, plus a few
 * assertions that the shared flows actually reach the web app.
 */

test('web phase 05 walkthrough', async ({ page }) => {
  await page.goto('/web')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(400)

  // Dashboard.
  await expect(page.getByRole('heading', { name: /Kia ora, Dr Souter/ })).toBeVisible()
  await page.screenshot({ path: 'visual/shots/w-01-dashboard.png', fullPage: true })

  // Lists table.
  await page.getByRole('button', { name: 'Lists', exact: true }).click()
  await page.waitForTimeout(300)
  await expect(page.getByRole('heading', { name: 'Lists' })).toBeVisible()
  await page.screenshot({ path: 'visual/shots/w-02-lists.png', fullPage: true })

  // Drill into today's Southern Cross PM list.
  await page.getByText('Southern Cross').first().click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'visual/shots/w-03-list-detail.png', fullPage: true })

  // Drill into a card → shared card body + BTM capture.
  await page.getByText('Margaret Ellison').first().click()
  await page.waitForTimeout(300)
  await expect(page.getByText('ASA status')).toBeVisible()
  await expect(page.getByText('Procedure code', { exact: true })).toBeVisible()
  await page.screenshot({ path: 'visual/shots/w-04-card-detail.png', fullPage: true })

  // A BTM edit: pick an ASA class (writes through the same guard as mobile).
  await page.getByRole('button', { name: 'III', exact: true }).click()
  await page.waitForTimeout(200)
  await page.screenshot({ path: 'visual/shots/w-05-btm-edit.png', fullPage: true })

  // Availability grid.
  await page.getByRole('button', { name: 'Availability', exact: true }).click()
  await page.waitForTimeout(300)
  await expect(page.getByRole('heading', { name: 'Availability' })).toBeVisible()
  await page.screenshot({ path: 'visual/shots/w-06-availability.png', fullPage: true })

  // Request cover on a free cell → shared RequestCover as a web dialog.
  await page.locator('button', { hasText: 'Open for booking' }).first().click()
  await page.waitForTimeout(300)
  await expect(page.getByRole('button', { name: 'Send cover request' })).toBeVisible()
  await page.screenshot({ path: 'visual/shots/w-07-cover-dialog.png', fullPage: true })
  await page.getByRole('button', { name: 'Send cover request' }).click()
  await page.waitForTimeout(300)
  await expect(page.getByText('Request sent')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/w-08-cover-sent.png', fullPage: true })
  await page.getByRole('button', { name: 'Done' }).click()

  // Accounts → Overdue.
  await page.getByRole('button', { name: 'Accounts', exact: true }).click()
  await page.waitForTimeout(300)
  await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible()
  await page.screenshot({ path: 'visual/shots/w-09-overdue.png', fullPage: true })

  // Accounts → GST activity.
  await page.getByRole('button', { name: 'GST activity' }).click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'visual/shots/w-10-gst.png', fullPage: true })
})
