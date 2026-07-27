import { expect, test, type Page } from '@playwright/test'

/**
 * Real routing inside the three apps (Decisions log 2026-07-27). Every screen
 * has a shareable URL, so a refresh and the browser Back button both hold their
 * place. Each test enters the way every other spec does — `goto` an app root,
 * then click — asserts the URL the clicks produced, reloads, and asserts the
 * same screen came back. These are assertions, not screenshots: this is the
 * behaviour the routing work bought.
 *
 * The demo clock is pinned (`DEMO_TODAY` = 2026-07-21, convention 5), so the
 * admin day URLs below are deterministic.
 */

// ---------------------------------------------------------------------------
// Anaesthetist Web App
// ---------------------------------------------------------------------------

test('web: drilling writes the URL; refresh holds the card; Back unwinds the drill', async ({ page }) => {
  await page.goto('/web')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveURL(/\/web$/)

  await page.getByRole('button', { name: 'Lists', exact: true }).click()
  await expect(page).toHaveURL(/\/web\/lists$/)

  await page.getByText('Southern Cross').first().click()
  await expect(page).toHaveURL(/\/web\/lists\/[^/]+$/)
  const listURL = page.url()

  await page.getByText('Margaret Ellison').first().click()
  await expect(page).toHaveURL(/\/web\/lists\/[^/]+\/cards\/[^/]+$/)
  const cardURL = page.url()

  // The behaviour being bought: a refresh stays on the card.
  await page.reload()
  await page.waitForLoadState('networkidle')
  expect(page.url()).toBe(cardURL)
  await expect(page.getByText('ASA status')).toBeVisible()

  // ... and Back unwinds one screen at a time.
  await page.goBack()
  expect(page.url()).toBe(listURL)
  await page.goBack()
  await expect(page).toHaveURL(/\/web\/lists$/)
  await expect(page.getByRole('heading', { name: 'Lists' })).toBeVisible()
})

test('web: the accounts sub-tab is a URL, and the bare section redirects to Overdue', async ({ page }) => {
  await page.goto('/web/accounts')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveURL(/\/web\/accounts\/overdue$/)

  await page.getByRole('button', { name: 'GST activity' }).click()
  await expect(page).toHaveURL(/\/web\/accounts\/gst$/)

  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveURL(/\/web\/accounts\/gst$/)
  await expect(page.getByText(/received, each with its GST component/)).toBeVisible()
})

test('web: the dashboard week strip carries an explicit anchor date', async ({ page }) => {
  await page.goto('/web')
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: 'Next week' }).click()
  await expect(page).toHaveURL(/\/web\?week=\d{4}-\d{2}-\d{2}$/)
  const nextWeekURL = page.url()

  await page.reload()
  await page.waitForLoadState('networkidle')
  expect(page.url()).toBe(nextWeekURL)
  await expect(page.getByRole('heading', { name: /Kia ora, Dr Souter/ })).toBeVisible()

  // Stepping back to the current week drops the param again.
  await page.getByRole('button', { name: 'Previous week' }).click()
  await expect(page).toHaveURL(/\/web$/)
})

test('web: the dashboard jump links land on their own routes', async ({ page }) => {
  await page.goto('/web')
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: 'view overdue accounts' }).click()
  await expect(page).toHaveURL(/\/web\/accounts\/overdue$/)

  await page.getByRole('button', { name: 'Dashboard', exact: true }).click()
  await page.getByRole('button', { name: /Full availability grid/ }).click()
  await expect(page).toHaveURL(/\/web\/availability$/)
  await expect(page.getByRole('heading', { name: 'Availability' })).toBeVisible()
})

// ---------------------------------------------------------------------------
// Admin Web App
// ---------------------------------------------------------------------------

test('admin: the app root lands on today, and a deep-linked day + sort survives a refresh', async ({ page }) => {
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveURL(/\/admin\/day\/2026-07-21$/)

  await page.goto('/admin/day/2026-07-22?sort=az')
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: 'Wednesday 22 July 2026' })).toBeVisible()

  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveURL(/\/admin\/day\/2026-07-22\?sort=az$/)
  await expect(page.getByRole('heading', { name: 'Wednesday 22 July 2026' })).toBeVisible()

  // Row order is a view preference: it round-trips through the query string.
  await page.getByRole('button', { name: 'Roster order' }).click()
  await expect(page).toHaveURL(/\/admin\/day\/2026-07-22$/)
})

test('admin: leaving the day view and returning lands back on the day and order you were on', async ({ page }) => {
  await page.goto('/admin/day/2026-07-22?sort=az')
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: 'Wednesday 22 July 2026' })).toBeVisible()

  await page.getByRole('button', { name: /Review queue/ }).first().click()
  await expect(page).toHaveURL(/\/admin\/review$/)

  // Both are remembered while the office is off in another section.
  await page.getByRole('button', { name: 'Day view', exact: true }).first().click()
  await expect(page).toHaveURL(/\/admin\/day\/2026-07-22\?sort=az$/)
  await expect(page.getByRole('heading', { name: 'Wednesday 22 July 2026' })).toBeVisible()
})

test('admin: review queue → review screen is a URL; refresh holds it, Back returns to the queue', async ({ page }) => {
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: /Review queue/ }).first().click()
  await expect(page).toHaveURL(/\/admin\/review$/)

  await page.getByRole('button', { name: /Morrison/ }).first().click()
  await expect(page).toHaveURL(/\/admin\/review\/[^/]+$/)
  const reviewURL = page.url()

  await page.reload()
  await page.waitForLoadState('networkidle')
  expect(page.url()).toBe(reviewURL)
  await expect(page.getByText('Total units')).toBeVisible()

  await page.goBack()
  await expect(page).toHaveURL(/\/admin\/review$/)
  await expect(page.getByRole('heading', { name: 'Review queue' })).toBeVisible()
})

test('admin: an invoice document is a URL that survives a refresh', async ({ page }) => {
  await page.goto('/admin/invoices')
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: 'View →' }).first().click()
  await expect(page).toHaveURL(/\/admin\/invoices\/[^/]+$/)
  const invoiceURL = page.url()

  await page.reload()
  await page.waitForLoadState('networkidle')
  expect(page.url()).toBe(invoiceURL)
  await expect(page.locator('.aa-invoice-doc')).toBeVisible()
})

test('admin: a card opened from the day drawer is a URL under its day', async ({ page }) => {
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')

  // Open a booked block → the List drawer (a transient overlay, deliberately
  // NOT in the URL), then a card from it → a routed screen under the day.
  await page.getByText("St George's").first().click()
  await expect(page.getByRole('button', { name: 'Edit list' })).toBeVisible()
  await page.getByRole('button', { name: 'Open', exact: true }).first().click()
  await expect(page).toHaveURL(/\/admin\/day\/2026-07-21\/cards\/[^/]+$/)
  const cardURL = page.url()

  await page.reload()
  await page.waitForLoadState('networkidle')
  expect(page.url()).toBe(cardURL)
  await expect(page.getByText(/Office billing setup/).first()).toBeVisible()
  // The drawer did not come back with the card: it was never in the URL.
  await expect(page.getByRole('button', { name: 'Edit list' })).toHaveCount(0)

  await page.goBack()
  await expect(page).toHaveURL(/\/admin\/day\/2026-07-21$/)
})

// ---------------------------------------------------------------------------
// Anaesthetist Mobile App
// ---------------------------------------------------------------------------

test('mobile: the slide stack is in the URL; refresh holds the card, Back pops it', async ({ page }) => {
  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveURL(/\/mobile\/lists$/)

  await page.getByText('Southern Cross', { exact: false }).first().click()
  await expect(page).toHaveURL(/\/mobile\/lists\/[^/]+$/)
  const listURL = page.url()

  await page.getByText('Margaret Ellison', { exact: false }).first().click()
  await expect(page).toHaveURL(/\/mobile\/lists\/[^/]+\/cards\/[^/]+$/)
  const cardURL = page.url()

  await page.reload()
  await page.waitForLoadState('networkidle')
  expect(page.url()).toBe(cardURL)
  await expect(page.getByText('ASA status')).toBeVisible()
  // Drilled in, the tab bar is still hidden after the refresh.
  await expect(page.getByRole('button', { name: 'Balances' })).toHaveCount(0)

  await page.goBack()
  expect(page.url()).toBe(listURL)
  await page.goBack()
  await expect(page).toHaveURL(/\/mobile\/lists$/)
  await expect(page.getByRole('button', { name: 'Balances' })).toBeVisible()
})

/** Computed transform of one `SlideStack` layer ('' when it is not mounted). */
function layerTransform(page: Page, key: string): Promise<string> {
  return page.evaluate((k) => {
    const el = document.querySelector(`[data-testid="slide-${k}"]`)
    return el === null ? '' : getComputedStyle(el).transform
  }, key)
}

test('mobile: popping a layer still animates — the URL drives depth, not mount/unmount', async ({ page }) => {
  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')
  await page.getByText('Southern Cross', { exact: false }).first().click()
  await page.waitForTimeout(400)

  // At rest on the List layer: sitting at translateX(0).
  expect(await layerTransform(page, 'list')).toBe('matrix(1, 0, 0, 1, 0, 0)')

  // Pop it. The layer must stay MOUNTED and slide out (sibling routes would
  // unmount the outgoing screen and there would be nothing to animate), so the
  // computed transform moves through several values on the way off-screen.
  await page.getByRole('button', { name: 'Lists' }).first().click()
  const samples: string[] = []
  for (let i = 0; i < 6; i++) {
    samples.push(await layerTransform(page, 'list'))
    await page.waitForTimeout(40)
  }
  expect(samples.every((s) => s !== ''), `layer unmounted mid-pop: ${samples.join(' | ')}`).toBe(true)
  expect(new Set(samples).size, `layer did not move: ${samples.join(' | ')}`).toBeGreaterThan(1)

  // It comes to rest off-screen right, and the tab bar is back.
  await page.waitForTimeout(400)
  await expect(page).toHaveURL(/\/mobile\/lists$/)
  expect(await layerTransform(page, 'list')).not.toBe('matrix(1, 0, 0, 1, 0, 0)')
  await expect(page.getByRole('button', { name: 'Balances' })).toBeVisible()
})

test('mobile: each tab is a URL that survives a refresh', async ({ page }) => {
  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: 'Balances' }).click()
  await expect(page).toHaveURL(/\/mobile\/balances$/)

  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveURL(/\/mobile\/balances$/)
  await expect(page.getByText('Balances', { exact: true }).first()).toBeVisible()
})

// ---------------------------------------------------------------------------
// Stale ids — a URL outlives the seed it was copied from
// ---------------------------------------------------------------------------

test('stale ids redirect to their parent instead of blanking', async ({ page }) => {
  await page.goto('/web/lists/DOES-NOT-EXIST')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveURL(/\/web\/lists$/)
  await expect(page.getByRole('heading', { name: 'Lists' })).toBeVisible()

  await page.goto('/admin/review/NOPE')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveURL(/\/admin\/review$/)
  await expect(page.getByRole('heading', { name: 'Review queue' })).toBeVisible()

  await page.goto('/admin/invoices/NOPE')
  await expect(page).toHaveURL(/\/admin\/invoices$/)

  await page.goto('/admin/day/not-a-date')
  await expect(page).toHaveURL(/\/admin\/day\/2026-07-21$/)

  await page.goto('/mobile/lists/NOPE')
  await expect(page).toHaveURL(/\/mobile\/lists$/)
})
