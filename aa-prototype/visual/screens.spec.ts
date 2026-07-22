import { test } from '@playwright/test'

/**
 * Capture a screenshot of every app screen. These are working artifacts for
 * eyeballing the build against the design mockups, not assertions.
 */

const ROUTES = [
  { name: 'mobile', path: '/mobile' },
  { name: 'web', path: '/web' },
  { name: 'admin', path: '/admin' },
  { name: 'demo-control', path: '/demo/control' },
  { name: 'demo-xero', path: '/demo/xero' },
  { name: 'demo-integrations', path: '/demo/integrations' },
] as const

for (const route of ROUTES) {
  test(`screenshot: ${route.name}`, async ({ page }) => {
    await page.goto(route.path)
    // let web fonts and any transitions settle
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await page.screenshot({ path: `visual/shots/${route.name}.png`, fullPage: true })
  })
}

test('screenshot: app switcher open', async ({ page }) => {
  await page.goto('/web')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: /Anaesthetist Web App/ }).click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'visual/shots/switcher-open.png' })
})
