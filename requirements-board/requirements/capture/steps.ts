/**
 * This project's own capture steps, loaded by the board's capture runner (`capture.steps` in
 * board.config.json). They drive the prototype's demo-only controls, so they live with the
 * project's recipes, not in the board.
 *
 *   { "scenario": "S2" }                                   jump to a demo scenario (S1 to S5)
 *   { "trigger": "<id>", "choice": "...", "open": true }   run a Demo actions entry
 */
import type { Page } from '@playwright/test'
import type { StepContext, StepHandler } from '../../scripts/capture.ts'

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Run a demo action from the harness bar's "Demo actions" menu on the current screen. Shots hide
 * the bar, so this lifts the hide style, opens `[data-shot=demo-actions]`, sets the row's select
 * when `choice` is given, clicks the row's Run, waits for its `role="status"` line, closes the
 * popover with Escape and restores the hide (unless `open: true`, which leaves the menu open so a
 * state can shoot it and its result line). Fails when the row is missing or disabled.
 * In the mobile app the same step opens the amber Demo chip's bottom sheet instead
 * (`[data-shot=pwa-demo-actions]`, rows `[data-shot=pwa-demo-action-<id>]`, choices as radio rows)
 * and closes it by tapping the scrim.
 */
const trigger: StepHandler = {
  check: (step) => (typeof step.trigger === 'string' && SLUG.test(step.trigger) ? null : `trigger "${String(step.trigger)}" must be a demo action id (kebab-case)`),
  async run(page: Page, step, ctx: StepContext) {
    const id = step.trigger as string
    const choice = step.choice as string | undefined
    const keepOpen = step.open === true
    const { what } = ctx
    const pwa = ctx.app.key === 'mobile'
    const pillSel = pwa ? '[data-shot="pwa-demo-actions"]' : '[data-shot="demo-actions"]'
    const rowSel = pwa ? `[data-shot="pwa-demo-action-${id}"]` : `[data-shot="demo-action-${id}"]`
    await ctx.setHidden(false)
    try {
      const pill = page.locator(pillSel)
      if (!(await pill.count())) throw new Error(`${what}: no Demo actions menu on ${page.url()} (this screen registers no entries)`)
      const row = page.locator(rowSel)
      if (!(await row.isVisible())) await pill.first().click()
      await row.waitFor({ state: 'visible', timeout: ctx.timeout }).catch(() => undefined)
      if (!(await row.count())) throw new Error(`${what}: no demo action ${rowSel} on ${page.url()}`)
      if (choice !== undefined) {
        if (pwa) await row.locator(`[role=radio]`).filter({ hasText: choice }).first().click()
        else await row.locator('select').selectOption(choice)
      }
      const run = row.getByRole('button', { name: 'Run' })
      if (await run.isDisabled()) {
        const reason = (await row.innerText()).split('\n').slice(-2).join(' ')
        throw new Error(`${what}: demo action ${id} is disabled (${reason})`)
      }
      await run.click()
      await row.getByRole('status').filter({ hasText: /\S/ }).waitFor({ state: 'visible', timeout: ctx.timeout })
      if (!keepOpen) {
        if (pwa) {
          // Tap the scrim above the sheet, then let the sheet-out motion finish.
          await page.mouse.click(12, 12)
          await page.waitForTimeout(400)
        } else await page.keyboard.press('Escape')
      }
    } finally {
      if (!keepOpen) await ctx.setHidden(true)
    }
    await ctx.settle(200)
  },
}

/** Jump to a demo scenario (S1 to S5) from the demo control panel, which only the framed prototype has. */
const scenario: StepHandler = {
  check: (step) => (typeof step.scenario === 'string' && step.scenario.trim() ? null : 'scenario needs a scenario id such as "S2"'),
  async run(page: Page, step, ctx: StepContext) {
    const id = (step.scenario as string).toLowerCase()
    if (ctx.app.key === 'mobile') throw new Error(`${ctx.what}: scenario jumps live on the framed prototype and cannot set up a mobile shot`)
    await page.goto('/demo/control')
    await ctx.settle(200)
    const btn = page.locator(`[data-shot="scenario-${id}"]`)
    if (!(await btn.count())) throw new Error(`${ctx.what}: no scenario button [data-shot=scenario-${id}] on /demo/control`)
    await btn.first().click()
    await page.locator('[data-shot="scenario-confirm"]').first().click()
    await ctx.settle(300)
  },
}

export default { trigger, scenario }
