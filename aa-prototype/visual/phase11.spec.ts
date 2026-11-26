import { expect, test } from '@playwright/test'

/**
 * Phase 11 smoke — the integration surfaces render and their core interactions
 * work end to end in the real app (no crashes): the simulator translates and
 * applies a message, and Admin Intake's two tabs (Arrivals and Sources) respond.
 */

test('integration simulator replays a message and shows the schedule effect', async ({ page }) => {
  await page.goto('/demo/integrations')
  await page.waitForLoadState('networkidle')
  // Desktop workspace keeps the inspection rail and library beside each other,
  // with the library receiving the larger share of the canvas.
  const inspectorBox = await page.getByTestId('integration-inspector').boundingBox()
  const libraryBox = await page.getByTestId('integration-library').boundingBox()
  expect(inspectorBox).not.toBeNull()
  expect(libraryBox).not.toBeNull()
  expect(inspectorBox!.x).toBeLessThan(libraryBox!.x)
  expect(Math.abs(inspectorBox!.y - libraryBox!.y)).toBeLessThanOrEqual(2)
  expect(inspectorBox!.width).toBeLessThan(libraryBox!.width)

  // The selected-message inspector sits beside the library, not buried beneath
  // it: once the Future-scope header (catch-up Phase 34) scrolls away, the
  // sticky inspector holds all three panes in view.
  await expect(page.getByText('1 · Raw HL7 v2')).toBeInViewport()
  await page.getByText('3 · Sent to matching').scrollIntoViewIfNeeded()
  await expect(page.getByText('2 · Translated FHIR R4')).toBeInViewport()
  await expect(page.getByText('3 · Sent to matching')).toBeInViewport()

  // The default selected message is the headline S12 create; replay it: it is sent to matching, nothing applied (catch-up Phase 33).
  await page.getByTestId('integration-inspector').getByRole('button', { name: 'Replay', exact: true }).click()
  await expect(page.getByText('Sent to matching').first()).toBeVisible()
  await expect(page.getByText('Nothing is applied automatically. Open Admin, Intake to decide.')).toBeVisible()
  await expect(page.getByText(/manual intervention/i)).toHaveCount(0)

  // Reset is available in-context and restores both the shared mock backend
  // and this simulator's local selection/live-feed state. Scoped to the
  // inspector, because the harness bar carries its own global reset with the
  // same accessible name.
  const inspector = page.getByTestId('integration-inspector')
  await inspector.getByRole('button', { name: 'Reset demo data' }).click()
  await expect(page.getByText('Reset all demo apps to the pristine seed?')).toBeVisible()
  await inspector.getByRole('button', { name: 'Confirm reset' }).click()
  await expect(page.getByText('Not replayed yet. Click Replay to send this message to matching.')).toBeVisible()

  await page.screenshot({ path: 'visual/shots/phase11-simulator.png', fullPage: true })
})

test('Future scope: HL7 and FHIR has the simulator, the message log and the feed mapping; Christchurch Public does not stream (catch-up Phase 34)', async ({ page }) => {
  await page.goto('/demo/integrations')
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: 'Future scope: HL7 and FHIR' })).toBeVisible()
  await expect(page.locator('[data-shot="demo-surface-future-scope"]')).toContainText("In scope today: St George's and Southern Cross files imported")
  await page.getByRole('button', { name: /Christchurch Public/ }).click()
  await expect(page.getByText('Not integrated today · example of a further feed (Future Work)')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start live feed' })).toBeDisabled()

  await page.getByRole('link', { name: 'Message log' }).click()
  await expect(page).toHaveURL(/\/demo\/integrations\/log$/)
  await expect(page.locator('[data-shot="future-scope-log"]')).toBeVisible()
  await page.getByRole('link', { name: 'Feed mapping' }).click()
  await expect(page).toHaveURL(/\/demo\/integrations\/mapping$/)
  await expect(page.locator('[data-feed-id="FEED-CPH"]')).toContainText('not integrated today')
  await page.screenshot({ path: 'visual/shots/phase11-future-scope.png', fullPage: true })
})

test('Admin Intake holds Arrivals and Sources, unbadged; the old routes redirect (build plan Phase 68; was catch-up Phase 34)', async ({ page }) => {
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')
  const nav = page.getByRole('navigation', { name: 'Admin' })
  await expect(nav.getByRole('button', { name: 'Integrations' })).toHaveCount(0)
  await expect(nav.getByRole('button', { name: 'Matching', exact: true })).toHaveCount(0)
  await nav.getByRole('button', { name: /^Intake/ }).click()
  await expect(page).toHaveURL(/\/admin\/intake$/)
  await expect(page.getByRole('heading', { name: 'Intake', exact: true })).toBeVisible()
  await expect(page.locator('[data-shot="intake-section"]').getByText('Future scope', { exact: true })).toHaveCount(0)

  // Sources is the second tab, inbound only.
  await page.locator('[data-shot="intake-tabs"]').getByRole('link', { name: 'Sources' }).click()
  await expect(page).toHaveURL(/\/admin\/intake\/sources$/)
  await expect(page.locator('[data-shot="intake-sources-inbound"]')).toContainText('never writes back')
  await page.locator('[data-shot="intake-tabs"]').getByRole('link', { name: /^Arrivals/ }).click()
  await expect(page).toHaveURL(/\/admin\/intake$/)
  await expect(page.locator('[data-shot="intake-inbox"]')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/phase11-monitor.png', fullPage: true })
  // Phase 68: the PDF lists tab's facsimile moved to 70 (the New List bench); re-added there.
  // Phase 68: the Validators tab moved to 72 (Validators in Help); re-added there.

  for (const old of ['/admin/integrations', '/admin/matching', '/admin/intake/quality', '/admin/intake/validators']) {
    await page.goto(old)
    await expect(page).toHaveURL(/\/admin\/intake$/)
  }
})
