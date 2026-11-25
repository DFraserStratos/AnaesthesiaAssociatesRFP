import { expect, test } from '@playwright/test'

/**
 * The Admin page frame (docs/admin-layout-audit.md, "Layout decisions"; AdminPage in
 * src/apps/admin/components/AdminPage.tsx): at a 1280 laptop up to a 2560 desktop, every side-nav page
 * fills the content column with no sideways scroll, and a `fit` list page is one window high (the
 * page itself never scrolls; its list scrolls inside its card). A `document` page keeps its paper at
 * print width on the left, so it is not held to the right edge. The Day view has its own frame (no
 * `data-admin-page`), so only the sideways check applies to it.
 */

/** The content column's inset from the window's right edge (ADMIN_PAGE_HORIZONTAL_PADDING). */
const CONTENT_INSET = 28

const PAGES = [
  '/admin/day/2026-11-24',
  '/admin/intake/matching',
  '/admin/intake/pdfs',
  '/admin/intake/quality',
  '/admin/intake/validators',
  '/admin/draft-lists',
  '/admin/conflicts',
  '/admin/notifications',
  '/admin/review',
  '/admin/invoices',
  '/admin/people/patients',
  '/admin/intake/waiting',
  '/admin/people/patients?filter=follow-up',
  '/admin/people/anaesthetists',
  '/admin/people/surgeons',
  '/admin/people/specialties',
  '/admin/billing',
  '/admin/billing/aa-fees',
  '/admin/ledger',
  '/admin/masters',
  '/admin/audit',
] as const

const VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 1536, height: 864 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
] as const

const isDayView = (path: string) => path.startsWith('/admin/day/')

for (const viewport of VIEWPORTS) {
  test.describe(`admin layout at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport })

    for (const path of PAGES) {
      test(path, async ({ page }) => {
        test.setTimeout(60_000)
        await page.goto(path)
        await page.waitForLoadState('networkidle')
        await expect(page.locator('nav[aria-label="Admin"]')).toBeVisible()
        if (!isDayView(path)) await expect(page.locator('[data-admin-page]').first()).toBeVisible()

        const m = await page.evaluate(() => {
          const main = document.querySelector('main')
          const root = document.querySelector<HTMLElement>('[data-admin-page]')
          return {
            main: main === null ? null : { scrollWidth: main.scrollWidth, clientWidth: main.clientWidth, scrollHeight: main.scrollHeight, clientHeight: main.clientHeight },
            mode: root?.getAttribute('data-admin-page') ?? null,
            right: root === null ? null : root.getBoundingClientRect().right,
            viewportWidth: window.innerWidth,
          }
        })

        expect(m.main, 'the page has a <main>').not.toBeNull()
        const main = m.main!
        expect(main.scrollWidth, `${path}: <main> has no sideways overflow`).toBeLessThanOrEqual(main.clientWidth + 1)

        if (isDayView(path)) return
        expect(m.mode, `${path}: the page root carries its mode`).not.toBeNull()
        if (m.mode !== 'document') {
          expect(m.right, `${path}: the ${m.mode} page reaches the content column's right edge`).not.toBeNull()
          expect(Math.abs(m.right! - (m.viewportWidth - CONTENT_INSET)), `${path}: right edge ${m.right} vs ${m.viewportWidth - CONTENT_INSET}`).toBeLessThanOrEqual(2)
        }
        if (m.mode === 'fit') {
          expect(main.scrollHeight, `${path}: a fit page does not scroll`).toBeLessThanOrEqual(main.clientHeight + 1)
        }
      })
    }
  })
}
