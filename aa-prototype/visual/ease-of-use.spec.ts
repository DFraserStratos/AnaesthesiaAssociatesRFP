import { expect, test, type Page } from '@playwright/test'

/**
 * Catch-up Phase 43a (US-15.0.1, US-13.5.3): the framed phone's sign-in and
 * Sign out, and point-of-need help on mobile capture, Admin Day and Admin
 * Review. Fresh storage (no demo-ready preset).
 */

test.use({ storageState: { cookies: [], origins: [] } })

const ELLISON_MOBILE = '/mobile/lists/L-34821-2026-11-24-PM/bookings/BK0009'
const DAY = '/admin/day/2026-11-24'
const REVIEW = '/admin/lists/to-authorise/L-34821-2026-11-16-AM'

async function settle(page: Page, ms = 400): Promise<void> {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(ms)
}

test('the framed phone opens signed in; Sign out on More shows the sign-in screen pre-filled; Sign in returns; Reset stays signed in; the audit has the rows', async ({ page }) => {
  await page.goto('/mobile/more')
  await settle(page)
  await expect(page.locator('[data-shot="sign-in-screen"]')).toHaveCount(0)
  await page.locator('[data-shot="more-sign-out"]').click()
  const signIn = page.locator('[data-shot="sign-in-screen"]')
  await expect(signIn).toBeVisible()
  await expect(page.getByLabel('Email')).toHaveValue('m.souter@aa-associates.example')
  // A refused attempt, then the demo account.
  await page.getByLabel('Email').fill('someone@else.example')
  await page.locator('[data-shot="sign-in-submit"]').click()
  await expect(page.getByText('No account with that email. Use the demo account.')).toBeVisible()
  await page.getByLabel('Email').fill('m.souter@aa-associates.example')
  await page.locator('[data-shot="sign-in-submit"]').click()
  await expect(signIn).toHaveCount(0)
  await expect(page).toHaveURL(/\/mobile\/more$/)
  await expect(page.locator('[data-shot="more-sign-out"]')).toBeVisible()

  // The audit holds the sign-out, the refusal and the sign-in, as account rows.
  await page.goto('/admin/audit')
  await settle(page)
  await page.getByLabel('Entity type').selectOption('account')
  for (const label of ['Signed out', 'Sign-in failed', 'Signed in']) await expect(page.getByText(label, { exact: true }).first()).toBeVisible()

  // Sign out again, then Reset: the framed phone lands signed in.
  await page.goto('/mobile/more')
  await settle(page)
  await page.locator('[data-shot="more-sign-out"]').click()
  await expect(page.locator('[data-shot="sign-in-screen"]')).toBeVisible()
  await page.getByRole('button', { name: 'Reset demo data' }).click()
  await page.getByRole('dialog', { name: 'Reset all demo data?' }).getByRole('button').first().click()
  await settle(page, 600)
  await page.goto('/mobile/more')
  await settle(page)
  await expect(page.locator('[data-shot="sign-in-screen"]')).toHaveCount(0)
})

test('mobile capture: the stack tip opens a bottom sheet; the stack and the Price section stay; every tip is easy to hit', async ({ page }) => {
  await page.goto(ELLISON_MOBILE)
  await settle(page, 600)
  await page.locator('[data-shot="info-tip-capture-stack"]').click()
  const sheet = page.locator('[data-shot="info-tip-capture-stack-sheet"]')
  await expect(sheet).toBeVisible()
  await expect(sheet).toContainText('kept exactly as received')
  await sheet.getByRole('button', { name: 'Got it' }).click()
  await expect(sheet).toHaveCount(0)
  await expect(page.locator('[data-shot="procedure-stack"]')).toBeVisible()
  await expect(page.locator('[data-shot="billing-contract-rows"]')).toBeVisible()
  await expect(page.locator('[data-shot="price-card"]')).toBeVisible()

  // Touch targets: each tip's 44px box (the framed phone scales it a little) resolves to the tip at
  // its corners (inset past the rounded corner) and meets no other visible control. Each tip is
  // scrolled to the middle first, so the docked footer and the screens behind the slide stack are out of it.
  const shots = await page.locator('button[data-shot^="info-tip-"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-shot')!))
  expect(shots.length).toBeGreaterThanOrEqual(6)
  const problems: string[] = []
  for (const shot of shots) {
    await page.locator(`button[data-shot="${shot}"]`).scrollIntoViewIfNeeded()
    await page.locator(`button[data-shot="${shot}"]`).evaluate((el) => el.scrollIntoView({ block: 'center' }))
    await page.waitForTimeout(150)
    problems.push(
      ...(await page.evaluate((s) => {
        const out: string[] = []
        const tip = document.querySelector<HTMLElement>(`button[data-shot="${s}"]`)!
        const r = tip.getBoundingClientRect()
        const scale = tip.offsetWidth > 0 ? r.width / tip.offsetWidth : 1
        if (tip.offsetWidth < 44 || tip.offsetHeight < 44) out.push(`${s} is ${tip.offsetWidth}x${tip.offsetHeight}`)
        const inset = 4 * scale
        for (const [x, y] of [
          [r.left + inset, r.top + inset],
          [r.right - inset, r.top + inset],
          [r.left + inset, r.bottom - inset],
          [r.right - inset, r.bottom - inset],
        ]) {
          const hit = document.elementFromPoint(x!, y!)
          if (hit === null || !(hit === tip || tip.contains(hit))) out.push(`${s} corner hits ${hit?.tagName}.${(hit as HTMLElement | null)?.dataset?.shot ?? ''}`)
        }
        const visible = (o: HTMLElement) => {
          const q = o.getBoundingClientRect()
          if (q.width === 0 || q.height === 0) return false
          const at = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2)
          return at !== null && (at === o || o.contains(at))
        }
        for (const o of document.querySelectorAll<HTMLElement>('button, a, input, [role="button"]')) {
          if (o === tip || o.matches('[data-shot^="info-tip-"]') || !visible(o)) continue
          const q = o.getBoundingClientRect()
          const overlap = r.left < q.right - 0.5 && r.right > q.left + 0.5 && r.top < q.bottom - 0.5 && r.bottom > q.top + 0.5
          if (overlap) out.push(`${s} overlaps ${o.tagName}.${o.dataset.shot ?? o.getAttribute('aria-label') ?? o.textContent?.slice(0, 20)}`)
        }
        return out
      }, shot)),
    )
  }
  expect(problems).toEqual([])
})

test('Admin Day: the legend tip opens a popover; Escape closes it and returns focus', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto(DAY)
  await settle(page)
  const trigger = page.locator('[data-shot="info-tip-day-statuses"]')
  await trigger.click()
  const pop = page.locator('[data-shot="info-tip-day-statuses-popover"]')
  await expect(pop).toBeVisible()
  await expect(pop).toHaveAttribute('role', 'dialog')
  const box = (await pop.boundingBox())!
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(1280)
  expect(box.y + box.height).toBeLessThanOrEqual(800)
  await page.keyboard.press('Escape')
  await expect(pop).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('Admin Review: the Procedures popover renders whole in the viewport although the table scrolls', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto(REVIEW)
  await settle(page)
  await page.locator('[data-shot="info-tip-review-contracts"]').click()
  const pop = page.locator('[data-shot="info-tip-review-contracts-popover"]')
  await expect(pop).toBeVisible()
  await expect(pop).toContainText('Procedures and Contracts')
  const box = (await pop.boundingBox())!
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(1280)
  expect(box.y + box.height).toBeLessThanOrEqual(800)
  // Not clipped: the popover's centre is the popover itself, not the table under it.
  const centre = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('[data-shot="info-tip-review-contracts-popover"]') !== null, { x: box.x + box.width / 2, y: box.y + box.height / 2 })
  expect(centre).toBe(true)
})
