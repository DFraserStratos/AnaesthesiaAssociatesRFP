import { test, expect, type Page } from '@playwright/test'

/**
 * Build plan Phase 47: the grouped Contract catalogue at practice scale. The six groupings with
 * their index and counts, Funding tag › SXAP, Aria under both surgeons, the index scrolling on its
 * own, the toolbar on one row at 1280, and the index reachable and operable by keyboard.
 * Screenshots land in `visual/shots/p47-*.png`.
 */

const index = (page: Page) => page.locator('[data-shot=contract-group-index]')
const rows = (page: Page) => page.locator('[data-shot=contract-catalogue] tr[data-contract]')

async function open(page: Page, url: string) {
  await page.goto(url)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot=contract-catalogue]')).toBeVisible()
}

test('phase 47 the six groupings, each with its index and count line', async ({ page }) => {
  await open(page, '/admin/contracts?group=kind')
  await expect(index(page).locator('button[data-group-key]').nth(1)).toContainText('Anaesthesia Associates')
  await page.screenshot({ path: 'visual/shots/p47-01-kind.png' })
  for (const [group, label, last] of [
    ['holder', 'holder', null],
    ['tag', 'funding tag', 'No tag'],
    ['surgeon', 'surgeon', 'Not linked to a surgeon'],
    ['destination', 'invoice goes to', 'Special'],
    ['pricing', 'pricing', null],
  ] as const) {
    await page.locator('[data-shot=contract-group-by] select').selectOption(group)
    await expect(page).toHaveURL(new RegExp(`group=${group}`))
    await expect(page.locator('[data-shot=contract-result-count]')).toContainText(`Grouped by ${label}.`)
    if (last !== null) await expect(index(page).locator('button[data-group-key]').last()).toContainText(last)
    await page.screenshot({ path: `visual/shots/p47-02-${group}.png` })
  }
  await page.locator('[data-shot=contract-group-by] select').selectOption('destination')
  await expect(index(page).locator('button[data-group-key]').nth(1)).toContainText('Patient')
})

test('phase 47 Funding tag SXAP lists only SXAP Contracts under their holders, the count equal to the rows', async ({ page }) => {
  await open(page, '/admin/contracts?group=tag&in=TAG-SXAP')
  const count = Number((await index(page).locator('button[data-group-key="TAG-SXAP"] span').last().textContent())!.replace(/,/g, ''))
  const pager = page.locator('[data-shot=contract-pager]')
  const shown = (await pager.count()) > 0 ? 50 : count
  await expect(rows(page)).toHaveCount(Math.min(shown, count))
  await expect(page.locator('tr[data-group-level=sub]').first()).toBeVisible()
  for (const row of await rows(page).all()) await expect(row).toContainText('SXAP')
  await page.screenshot({ path: 'visual/shots/p47-03-sxap.png' })
})

test('phase 47 Aria Skin and Laser Clinic shows under Ms Lim and under Mr Okafor', async ({ page }) => {
  await open(page, '/admin/contracts?group=surgeon')
  await expect(index(page)).toContainText('A Contract linked to two surgeons shows under both.')
  for (const name of [/Lim/, /Okafor/]) {
    await index(page).getByRole('button', { name }).first().click()
    await expect(page.locator('tr[data-contract="CT-ARIA-HOURLY"]')).toBeVisible()
  }
  await page.screenshot({ path: 'visual/shots/p47-04-surgeon.png' })
})

test('phase 47 at 1280 the toolbar is one row, nothing scrolls sideways, and the index scrolls on its own', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await open(page, '/admin/contracts?group=holder')
  const toolbar = page.locator('[data-page-toolbar]').first()
  const items = toolbar.locator(':scope > *')
  const tops = await items.evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).filter((r) => r.height > 0).map((r) => Math.round(r.top + r.height / 2)))
  expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(4)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  const scroller = page.locator('[data-page-body] > div').first()
  expect(await scroller.evaluate((e) => e.scrollHeight > e.clientHeight && getComputedStyle(e).overflowY === 'auto')).toBe(true)
  await page.screenshot({ path: 'visual/shots/p47-05-1280.png' })
})

test('phase 47 the index is reachable and operable by keyboard', async ({ page }) => {
  await open(page, '/admin/contracts?group=tag')
  const acc = index(page).locator('button[data-group-key="TAG-ACC"]')
  await acc.focus()
  await expect(acc).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/in=TAG-ACC/)
  await expect(acc).toHaveAttribute('aria-current', 'true')
})
