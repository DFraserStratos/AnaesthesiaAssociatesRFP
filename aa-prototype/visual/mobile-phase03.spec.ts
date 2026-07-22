import { test } from '@playwright/test'

/** Phase 03 mobile walkthrough screenshots (working artifacts, not assertions). */

test('mobile: forward lists home', async ({ page }) => {
  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'visual/shots/m-01-home.png', fullPage: true })
})

test('mobile: list detail', async ({ page }) => {
  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')
  await page.getByText('Southern Cross', { exact: false }).first().click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: 'visual/shots/m-02-list.png', fullPage: true })
})

test('mobile: card detail', async ({ page }) => {
  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')
  await page.getByText('Southern Cross', { exact: false }).first().click()
  await page.waitForTimeout(500)
  await page.getByText('Margaret Ellison', { exact: false }).first().click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: 'visual/shots/m-03-card.png', fullPage: true })
})

test('mobile: add card sheet', async ({ page }) => {
  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')
  await page.getByText('Southern Cross', { exact: false }).first().click()
  await page.waitForTimeout(500)
  await page.getByText('Add a card', { exact: false }).first().click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'visual/shots/m-04-add.png', fullPage: true })
})

test('mobile: availability', async ({ page }) => {
  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Availability' }).click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'visual/shots/m-05-availability.png', fullPage: true })
})

test('mobile: manual card form', async ({ page }) => {
  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')
  await page.getByText('Southern Cross', { exact: false }).first().click()
  await page.waitForTimeout(500)
  await page.getByText('Add a card', { exact: false }).first().click()
  await page.waitForTimeout(400)
  await page.getByText('Enter manually', { exact: false }).first().click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'visual/shots/m-06-manual.png', fullPage: true })
})

test('mobile: request cover sheet', async ({ page }) => {
  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Availability' }).click()
  await page.waitForTimeout(400)
  await page.getByText('Tap to ask', { exact: false }).first().click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'visual/shots/m-07-cover.png', fullPage: true })
})
