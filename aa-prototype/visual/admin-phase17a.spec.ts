import { test, expect } from '@playwright/test'

/**
 * Catch-up Phase 17a: rooms without an email, surgeons at more than one room,
 * and practice manager and PA contacts. Admin only: nothing here reaches the
 * anaesthetist apps or the PWA.
 */

test('phase 17a a two-room surgeon: a card per room, listed under both rooms', async ({ page }) => {
  await page.goto('/admin/masters/surgeons/S-WAINWRIGHT')
  await page.waitForLoadState('networkidle')
  const rooms = page.locator('[data-shot="surgeon-room-card"]')
  await expect(rooms).toHaveCount(2)
  await expect(rooms.nth(0)).toHaveAttribute('data-room', 'RM-UPPERGIPAR')
  await expect(rooms.nth(0).getByText('Main room')).toBeVisible()
  await expect(rooms.nth(1)).toHaveAttribute('data-room', 'RM-HILLSBOROU')
  await page.waitForTimeout(450)
  await page.screenshot({ path: 'visual/shots/p17a-01-two-rooms.png', fullPage: true })

  await page.goto('/admin/masters?view=surgeonRooms')
  await page.waitForLoadState('networkidle')
  const table = page.locator('[data-shot="masters-surgeon-rooms"]')
  await expect(table.locator('tr[data-room="RM-UPPERGIPAR"]').getByText('Mr N. Wainwright')).toBeVisible()
  await expect(table.locator('tr[data-room="RM-HILLSBOROU"]').getByText('Mr N. Wainwright')).toBeVisible()
  await expect(table.locator('tr[data-room="RM-GENERALSUR"]').getByText('No email held')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p17a-02-rooms.png', fullPage: true })
})

test('phase 17a add a contact to a room with no email from a surgeon profile', async ({ page }) => {
  await page.goto('/admin/masters/surgeons/S-YEOMAN')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="surgeon-room-card"]').getByText('No email held')).toBeVisible()
  const contacts = page.locator('[data-shot="surgeon-contacts"]')
  await expect(contacts.getByText('Rosalind Pemberton')).toBeVisible()
  await contacts.getByRole('button', { name: /Add contact/ }).click()
  const sheet = page.locator('[data-shot="room-contact-sheet"]')
  await expect(sheet).toBeVisible()
  await sheet.getByLabel('Name').fill('Fran Okoro')
  await sheet.getByLabel('Email').fill('fran@generalsurgerypartners.example')
  await page.waitForTimeout(450)
  await page.screenshot({ path: 'visual/shots/p17a-03-add-contact.png' })
  await sheet.getByRole('button', { name: 'Add contact' }).click()
  await expect(sheet).toBeHidden()
  await expect(contacts.getByText('Fran Okoro')).toBeVisible()
  await expect(contacts.getByText('For this surgeon')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p17a-04-contact-added.png', fullPage: true })
})
