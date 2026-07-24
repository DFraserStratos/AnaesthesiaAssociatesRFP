import { expect, test, type Page } from '@playwright/test'

/**
 * Phase 13 — the mobile atmospheric gradient + the temporary Gradient Lab.
 * Asserts the lab lives OUTSIDE the scaled device, that it live-tunes the
 * atmosphere's computed background, that a change survives navigation + reload,
 * that Reset restores the default, that the master switch flips the atmosphere
 * off, and that Copy config / Copy CSS produce stable content. Narrow viewports
 * collapse the lab to a button clear of the device and the zoom toolbar. The
 * console stays clean throughout (phase12 guard).
 */

/** Computed, var-resolved background-image of the fixed atmosphere layer. */
function atmosphereImage(page: Page): Promise<string> {
  return page.evaluate(() => {
    const el = document.querySelector('[data-testid="mobile-atmosphere"]')
    return el ? getComputedStyle(el).backgroundImage : ''
  })
}

type Box = { x: number; y: number; width: number; height: number }
function overlaps(a: Box, b: Box): boolean {
  return !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y)
}

test('atmosphere + lab: outside the device, live-tunes, persists, resets, copies clean', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => consoleErrors.push(err.message))

  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')

  const device = page.locator('[data-testid="mobile-atmosphere"]').locator('xpath=..')
  // The lab starts collapsed behind its button; open it.
  await page.getByRole('button', { name: 'Open Gradient Lab' }).click()
  const lab = page.getByRole('region', { name: 'Gradient Lab' })
  await expect(lab).toBeVisible()

  // The lab is not a descendant of the scaled device, and their boxes are disjoint.
  const isDescendant = await page.evaluate(() => {
    const atmos = document.querySelector('[data-testid="mobile-atmosphere"]')
    const dev = atmos?.parentElement
    const panel = document.querySelector('[aria-label="Gradient Lab"]')
    return dev && panel ? dev.contains(panel) : null
  })
  expect(isDescendant).toBe(false)

  const deviceBox = await device.boundingBox()
  const labBox = await lab.boundingBox()
  expect(deviceBox).not.toBeNull()
  expect(labBox).not.toBeNull()
  expect(overlaps(deviceBox as Box, labBox as Box)).toBe(false)

  // Baseline (default) atmosphere.
  const defaultImage = await atmosphereImage(page)
  expect(defaultImage).toContain('radial-gradient')

  // Moving a field changes the computed atmosphere.
  const intensity = page.getByRole('slider', { name: 'Global intensity' })
  await intensity.focus()
  for (let i = 0; i < 4; i++) await intensity.press('ArrowLeft')
  const changedImage = await atmosphereImage(page)
  expect(changedImage).not.toBe(defaultImage)

  // The change survives tab + List/Card depth navigation.
  await page.getByRole('button', { name: 'Availability' }).click()
  await page.getByRole('button', { name: 'Balances' }).click()
  await page.getByRole('button', { name: 'Lists' }).click()
  await page.getByText('Southern Cross', { exact: false }).first().click()
  await page.getByText('Margaret Ellison', { exact: false }).first().click()
  await page.waitForTimeout(400)
  expect(await atmosphereImage(page)).toBe(changedImage)

  // ... and a reload (persisted under its own key).
  await page.reload()
  await page.waitForLoadState('networkidle')
  expect(await atmosphereImage(page)).toBe(changedImage)

  // The lab is collapsed again after a reload; re-open it.
  await page.getByRole('button', { name: 'Open Gradient Lab' }).click()

  // Master switch off → data-atmosphere off, image none, card still visible.
  await page.getByRole('checkbox', { name: 'Master atmosphere' }).click()
  await expect(page.locator('[data-testid="mobile-atmosphere"]')).toHaveAttribute('data-atmosphere', 'off')
  expect(await atmosphereImage(page)).toBe('none')
  await expect(page.getByText("St George's", { exact: false }).first()).toBeVisible()

  // Reset restores the default computed background (and master on).
  await page.getByRole('button', { name: 'Reset to AA default' }).click()
  await expect(page.locator('[data-testid="mobile-atmosphere"]')).toHaveAttribute('data-atmosphere', 'on')
  expect(await atmosphereImage(page)).toBe(defaultImage)

  // Presets switch the whole atmosphere and are reversible.
  await page.getByRole('button', { name: 'Apply preset: Teal dawn', exact: true }).click()
  expect(await atmosphereImage(page)).not.toBe(defaultImage)
  await page.getByRole('button', { name: 'Apply preset: Brand whisper (default)', exact: true }).click()
  expect(await atmosphereImage(page)).toBe(defaultImage)

  // Copy configuration → valid, parseable JSON.
  await page.getByRole('button', { name: 'Copy config' }).click()
  const configText = await page.evaluate(() => navigator.clipboard.readText())
  const parsed = JSON.parse(configText)
  expect(parsed.version).toBeDefined()
  expect(parsed.accent).toBeDefined()

  // Copy CSS → a self-contained custom-property block.
  await page.getByRole('button', { name: 'Copy CSS' }).click()
  const cssText = await page.evaluate(() => navigator.clipboard.readText())
  expect(cssText).toContain('--aa-atmos-base')
  expect(cssText).toContain('background-image: var(--aa-atmos-image)')

  expect(consoleErrors, `console errors: ${consoleErrors.join(' | ')}`).toEqual([])
})

test('narrow viewport: lab collapses to a button clear of the device and zoom controls', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => consoleErrors.push(err.message))

  // Load AT a narrow size so the lab collapses by default.
  await page.setViewportSize({ width: 760, height: 820 })
  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')

  // Collapsed: a toggle button, not the full panel.
  const toggle = page.getByRole('button', { name: 'Open Gradient Lab' })
  await expect(toggle).toBeVisible()
  await expect(page.getByRole('region', { name: 'Gradient Lab' })).toHaveCount(0)

  const device = page.locator('[data-testid="mobile-atmosphere"]').locator('xpath=..')
  const zoom = page.getByRole('group', { name: 'Resize the phone preview' })

  const toggleBox = await toggle.boundingBox()
  const deviceBox = await device.boundingBox()
  const zoomBox = await zoom.boundingBox()
  expect(toggleBox).not.toBeNull()
  expect(deviceBox).not.toBeNull()
  expect(zoomBox).not.toBeNull()
  expect(overlaps(toggleBox as Box, deviceBox as Box)).toBe(false)
  expect(overlaps(toggleBox as Box, zoomBox as Box)).toBe(false)

  // The button opens the panel; the OPEN panel is capped to the left gutter so
  // it still clears the centred device (plan L1), and the atmosphere is live.
  const panel = page.getByRole('region', { name: 'Gradient Lab' })
  await toggle.click()
  await expect(panel).toBeVisible()
  await page.waitForTimeout(150) // let the gutter measurement settle
  const openPanelBox = await panel.boundingBox()
  const deviceBox2 = await device.boundingBox()
  expect(openPanelBox).not.toBeNull()
  expect(deviceBox2).not.toBeNull()
  expect(overlaps(openPanelBox as Box, deviceBox2 as Box)).toBe(false)
  expect(await atmosphereImage(page)).toContain('radial-gradient')

  expect(consoleErrors, `console errors: ${consoleErrors.join(' | ')}`).toEqual([])
})
