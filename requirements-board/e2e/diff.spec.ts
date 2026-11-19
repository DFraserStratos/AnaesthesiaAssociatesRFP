/// <reference lib="dom" />
/**
 * The Diff review tab over the fixture catalogue (port 5182), in a throwaway git repository: the
 * default comparison (last commit against the files on disk), falling back to what the last commit
 * changed when nothing is uncommitted, live refresh, picking commits, filters, Whole card and Viewed.
 */
import { execSync } from 'node:child_process'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import type { Page, Route } from '@playwright/test'
import { writeItem } from '../server/catalogueFs.ts'
import { serialiseArtifact, serialiseQuestion } from '../shared/files.ts'
import type { Artifact, CatalogueSnapshot, Question } from '../shared/types.ts'
import { FIXTURE_DIR, fixtureArtifacts, fixtureItems, writeFixture } from './fixtureCatalogue.ts'

test.describe.configure({ mode: 'serial' })

const git = (cmd: string) => execSync(`git -c user.email=fixture@example.com -c user.name=Fixture ${cmd}`, { cwd: FIXTURE_DIR, stdio: 'ignore' })
const base = (id: string) => fixtureItems().find((i) => i.id === id)!
const baseArtifact = (id: string) => fixtureArtifacts().find((a) => a.id === id)!
const writeArtifact = (a: Artifact) => writeFileSync(join(FIXTURE_DIR, 'artifacts', `${a.id}.md`), serialiseArtifact(a))
const fixtureQuestion: Question = { id: 'OQ-01', kind: 'question', title: 'Who signs off the invoice run', status: '1', owner: 'Client', affects: [], sources: [], question: 'Who signs it off?', answer: '', extra: {} }

/**
 * Holds the requests `match` picks until `release()`, so a test can look at the page while the
 * server has not answered yet, without depending on how long anything takes.
 */
async function hold(page: Page, match: (url: URL) => boolean) {
  let open!: () => void
  const gate = new Promise<void>((r) => (open = r))
  let held = 0
  const handler = async (route: Route) => {
    held++
    await gate
    await route.continue().catch(() => {})
  }
  await page.route(match, handler)
  return {
    held: () => held,
    release: async () => {
      open()
      await page.unroute(match, handler)
    },
  }
}

test.beforeEach(async ({ page, request }) => {
  writeFixture()
  await expect.poll(async () => Object.keys(((await (await request.get('/api/catalogue')).json()) as CatalogueSnapshot).items).length).toBe(fixtureItems().length)
  rmSync(join(FIXTURE_DIR, '.git'), { recursive: true, force: true })
  git('init -q')
  git('add -A')
  git('commit -qm "Fixture catalogue"')
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
})
test.afterEach(() => rmSync(join(FIXTURE_DIR, '.git'), { recursive: true, force: true }))

test('with nothing uncommitted it shows what the last commit changed, as a before and after', async ({ page }) => {
  writeItem({ ...base('US-01.2.1'), description: 'Records start and finish times.' }, FIXTURE_DIR)
  git('commit -qam "Describe a story"')
  writeItem({ ...base('US-01.2.1'), description: 'Records start and end times.', status: '2' }, FIXTURE_DIR)
  git('commit -qam "Reword it"')

  await page.goto('/#/diff')
  await expect(page.locator('.diff-note-line')).toHaveText(/Nothing is uncommitted/)
  const card = page.locator('[id="diff-item:US-01.2.1"]')
  await expect(card).toBeVisible()
  await expect(card.locator('del.dm')).toHaveText('finish')
  await expect(card.locator('ins.dm')).toHaveText('end')
  // The status change sits on the summary line under the title: "Status (Proposed) to (Open)".
  await expect(card.locator('.diff-summary .status')).toHaveCount(2)
  await expect(card.locator('.diff-summary')).toContainText('to')
  // Its unchanged feature and epic sit above it as headings.
  await expect(page.locator('.diff-heading')).toHaveText(['Epic 1', 'Feature 1.2'])
  await expect(page.locator('.diff-colhead.before')).toContainText('Describe a story')
  await expect(page.locator('.diff-colhead.after')).toContainText('Reword it')

  // Pick the first commit as From: both commits' changes show, and the URL keeps the pick.
  await page.locator('.diff-picker').first().click()
  await page.getByRole('option', { name: /Fixture catalogue/ }).click()
  await expect(page).toHaveURL(/from=[0-9a-f]{40}&to=[0-9a-f]{40}/)
  // The fixture story had no description at the first commit: the whole paragraph is new.
  await expect(card.locator('.dc.after.blk-add')).toContainText('Records start and end times')
})

test('uncommitted edits arrive live, and the tab counts them', async ({ page }) => {
  await page.goto('/#/diff')
  await expect(page.locator('.diff-note-line')).toBeVisible()
  writeItem({ ...base('US-02.1.2'), title: 'Story 2.1.2 renamed', acceptance: '- Given a thing, then it works.' }, FIXTURE_DIR)
  const card = page.locator('[id="diff-item:US-02.1.2"]')
  await expect(card).toBeVisible({ timeout: 10_000 })
  await expect(page.locator('.diff-note-line')).toHaveCount(0)
  await expect(page.locator('.diff-colhead.after')).toContainText('Uncommitted')
  await expect(card.locator('.blk-add')).toContainText('Given a thing, then it works.')
  await expect(page.locator('.tabs .tab', { hasText: 'Diff review' })).toContainText('1')

  // Field names are tags on the seam. Whole card shows unchanged fields too: short ones on the
  // summary line, the rest as rows. Viewed folds the card and survives a reload.
  await expect(card.locator('.diff-tag')).toHaveText(['Title', 'Acceptance criteria'])
  // The ID sits by the title, and a click copies it.
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await card.locator('.diff-card-id').click()
  await expect(card.locator('.diff-card-id')).toHaveText('Copied')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('US-02.1.2')
  await expect(card.locator('.diff-card-id')).toHaveText('US-02.1.2')
  await expect(card.locator('.diff-summary')).toHaveCount(0)
  await card.getByRole('button', { name: 'Whole card' }).click()
  await expect(card.locator('.diff-summary .diff-sum', { hasText: 'Area' })).toHaveCount(1)
  await expect(card.locator('.diff-tag', { hasText: 'Sources' })).toHaveCount(1)
  await card.getByLabel('Viewed').check()
  await expect(card.locator('.diff-grid')).toHaveCount(0)
  await expect(page.locator('.diff-viewed-count')).toHaveText('1 of 1 viewed')
  await page.reload()
  await expect(page.locator('[id="diff-item:US-02.1.2"] .diff-grid')).toHaveCount(0)

  // A filter hides it, and says how to bring it back.
  await page.locator('.diff-toggle', { hasText: 'Stories' }).click()
  await expect(page.locator('.diff-state')).toContainText('Nothing matches the filters')
})

test('keys step through changes and cards, a long paragraph shows its changed sentence, folds close again, and the bar folds to one line when scrolled', async ({ page }) => {
  const long = Array.from({ length: 8 }, (_, i) => `Sentence number ${i + 1} of this paragraph.`).join(' ')
  writeItem({ ...base('US-01.1.1'), description: `${long}\n\nKept one.\n\nKept two.\n\nKept three.\n\nKept four.\n\nLast paragraph here.` }, FIXTURE_DIR)
  git('commit -qam "Long story"')
  writeItem({ ...base('US-01.1.1'), description: `${long.replace('number 4', 'number four')}\n\nKept one.\n\nKept two.\n\nKept three.\n\nKept four.\n\nLast paragraph changed.` }, FIXTURE_DIR)
  const others = ['US-01.3.1', 'US-01.4.2', 'US-02.1.1', 'US-02.2.1', 'US-02.3.2', 'US-02.4.3']
  for (const id of others) writeItem({ ...base(id), description: `New words for ${id}.`, acceptance: '- Given one thing, then another.' }, FIXTURE_DIR)
  await page.setViewportSize({ width: 1280, height: 640 })
  await page.goto('/#/diff')
  const card = page.locator('[id="diff-item:US-01.1.1"]')
  await expect(card).toBeVisible({ timeout: 10_000 })

  // The long paragraph shows only its changed sentence; the "…" opens it whole.
  await expect(card.locator('.diff-ell').first()).toBeVisible()
  await expect(card.locator('.dc.after').first()).not.toContainText('Sentence number 7')
  await card.locator('.diff-ell').first().click()
  await expect(card.locator('.dc.after').first()).toContainText('Sentence number 7')

  // The unchanged run folds, opens, and folds again.
  const fold = card.locator('.diff-fold')
  await expect(fold).toHaveText('2 unchanged paragraphs')
  await fold.click()
  await expect(fold).toHaveText('Hide 2 unchanged paragraphs')
  await fold.click()
  await expect(fold).toHaveText('2 unchanged paragraphs')

  // The paragraph kept beside a change is a one-line preview until clicked.
  const ctx = card.locator('.dc.before.ctx').first()
  await expect(ctx).toBeVisible()
  await ctx.click()
  await expect(card.locator('.dc.before.ctx')).toHaveCount(1)

  // Keys: k steps down to the next change, Shift K down a card, v ticks the one in view and moves on.
  await page.locator('body').click({ position: { x: 5, y: 300 } })
  await page.keyboard.press('k')
  await expect(page.locator('.diff-flash-row').first()).toBeVisible()
  await page.keyboard.press('Shift+K')
  await expect(page.locator('.diff-bar-inner.slim')).toBeVisible()
  await page.keyboard.press('v')
  await expect(page.locator('.diff-viewed-count')).toHaveText(/^1 of 7 viewed/)
  await page.getByRole('button', { name: 'Change or filter' }).click()
  await expect(page.locator('.diff-toggle', { hasText: 'Stories' })).toBeVisible()
})

test('an added and a removed card keep both columns, a placeholder opposite the card', async ({ page }) => {
  writeItem({ ...base('US-01.1.3'), id: 'US-01.1.4', title: 'A new story', order: 4 }, FIXTURE_DIR)
  rmSync(join(FIXTURE_DIR, 'stories', 'US-01.1.2.md'))
  await page.goto('/#/diff')
  const added = page.locator('[id="diff-item:US-01.1.4"]')
  await expect(added.locator('.diff-pill')).toHaveText('Added')
  await expect(added.locator('.dc.before .diff-placeholder')).toHaveText("Didn't exist yet")
  const removed = page.locator('[id="diff-item:US-01.1.2"]')
  await expect(removed.locator('.diff-pill')).toHaveText('Removed')
  await expect(removed.locator('.dc.after .diff-placeholder')).toHaveText('Deleted')
  await expect(removed.getByRole('button', { name: 'Open' })).toHaveCount(0)
})

test('a file that does not parse says so, a hidden changed parent still heads its cards, and keys work after a Viewed tick', async ({ page }) => {
  const file = join(FIXTURE_DIR, 'stories', 'US-01.1.2.md')
  writeFileSync(file, readFileSync(file, 'utf8').replace(/^---\n/, '---\ntitle: [unclosed\n'))
  writeItem({ ...base('FT-01.2'), title: 'Feature 1.2 renamed' }, FIXTURE_DIR)
  writeItem({ ...base('US-01.2.1'), description: 'Records start and end times.' }, FIXTURE_DIR)
  await page.goto('/#/diff')

  // Neither added nor removed: edited, with the parser's message and the file's text on the side that broke.
  const broken = page.locator('[id="diff-item:US-01.1.2"]')
  await expect(broken.locator('.diff-pill')).toHaveText('Could not be read')
  await expect(broken.locator('.dc.after .diff-unreadable')).toContainText('This file does not parse.')
  await expect(broken.locator('.dc.after .diff-raw')).toContainText('[unclosed')
  await expect(broken.locator('.dc.before .diff-placeholder')).toHaveCount(0)
  await expect(broken.getByRole('button', { name: 'Open' })).toHaveCount(0)

  // Features off: the renamed feature is a heading over its story, not lost above it.
  await page.locator('.diff-toggle', { hasText: 'Features' }).click()
  await expect(page.locator('[id="diff-item:FT-01.2"]')).toHaveCount(0)
  await expect(page.locator('.diff-heading', { hasText: 'Feature 1.2 renamed' })).toHaveCount(1)
  await expect(page.locator('.diff-heading', { hasText: 'Feature 1.2 renamed' }).locator('.diff-pill')).toHaveText('Changed, hidden by the filters')
  await page.locator('.diff-toggle', { hasText: 'Features' }).click()

  // Ticking Viewed with the mouse leaves the keys working.
  await page.setViewportSize({ width: 1280, height: 400 })
  await page.locator('.diff-card').first().getByLabel('Viewed').check()
  const top = () => page.locator('.diff-page').evaluate((el) => el.scrollTop)
  const was = await top()
  await page.keyboard.press('Shift+K')
  await expect.poll(top).not.toBe(was)
})

test('artifact changes: a drawing shows both pictures, a note its changed words, a short field the summary line', async ({ page }) => {
  writeFileSync(join(FIXTURE_DIR, 'artifacts', 'files', 'AR-01.svg'), readFileSync(join(FIXTURE_DIR, 'artifacts', 'files', 'AR-01.svg'), 'utf8').replace('Other panel', 'Another panel'))
  const note = join(FIXTURE_DIR, 'notes', '2026-01-02-fixture-meeting.md')
  writeFileSync(note, readFileSync(note, 'utf8').replace('fox jumps over', 'fox leaps over'))
  writeArtifact({ ...baseArtifact('AR-02'), date: '2026-10-01' })
  await page.goto('/#/diff')

  // The drawing: its file on the seam, the two versions side by side, each read from git or disk.
  const drawing = page.locator('[id="diff-artifact:AR-01"]')
  await expect(drawing.locator('.diff-tag')).toHaveText(['File'])
  const pics = drawing.locator('.diff-picture img')
  await expect(pics).toHaveCount(2)
  for (const i of [0, 1]) await expect.poll(() => pics.nth(i).evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
  expect(await pics.nth(0).getAttribute('src')).not.toBe(await pics.nth(1).getAttribute('src'))

  // A note kept outside the artifacts folder: its changed word, marked on each side.
  const noteCard = page.locator('[id="diff-artifact:AR-04"]')
  await expect(noteCard.locator('del.dm')).toHaveText('jumps')
  await expect(noteCard.locator('ins.dm')).toHaveText('leaps')

  // A date change costs a line under the head: "Date 2026-09-30 to 2026-10-01", and no rows.
  const picture = page.locator('[id="diff-artifact:AR-02"]')
  const sum = picture.locator('.diff-summary .diff-sum')
  await expect(sum).toHaveCount(1)
  await expect(sum).toContainText('Date')
  await expect(sum.locator('.diff-sum-was')).toContainText('2026-09-30')
  await expect(sum).toContainText('2026-10-01')
  await expect(picture.locator('.diff-grid')).toHaveCount(0)
})

test('removed records are named as they were, on their own cards and where others cited them', async ({ page }) => {
  writeFileSync(join(FIXTURE_DIR, 'questions', 'OQ-01.md'), serialiseQuestion(fixtureQuestion))
  writeItem({ ...base('US-01.1.1'), related: ['OQ-01'], artifacts: ['AR-03'] }, FIXTURE_DIR)
  git('add -A')
  git('commit -qm "Cite a question and a diagram"')
  rmSync(join(FIXTURE_DIR, 'questions', 'OQ-01.md'))
  rmSync(join(FIXTURE_DIR, 'artifacts', 'AR-03.md'))
  writeItem(base('US-01.1.1'), FIXTURE_DIR)
  await page.goto('/#/diff')

  const question = page.locator('[id="diff-question:OQ-01"]')
  await expect(question.locator('h3')).toHaveText('Who signs off the invoice run')
  await expect(question.locator('.diff-pill')).toHaveText('Removed')
  const diagram = page.locator('[id="diff-artifact:AR-03"]')
  await expect(diagram.locator('h3')).toHaveText('Fixture flow')
  await expect(diagram.locator('.diff-pill')).toHaveText('Removed')

  // The story that cited them: their names on the before side, never a bare ID.
  const story = page.locator('[id="diff-item:US-01.1.1"]')
  await expect(story.locator('.diff-tag')).toHaveText(['Related', 'Artifacts'])
  const before = story.locator('.dc.before')
  await expect(before.filter({ hasText: 'Who signs off the invoice run' })).toHaveCount(1)
  await expect(before.filter({ hasText: 'Fixture flow' })).toHaveCount(1)
  await expect(story).not.toContainText('OQ-01')
  await expect(story).not.toContainText('AR-03')
})

test('a source citing an artifact since removed is named by that artifact, as it was', async ({ page }) => {
  writeItem({ ...base('US-01.1.1'), sources: ['Test spec p.3'] }, FIXTURE_DIR)
  git('add -A')
  git('commit -qm "Cite the document"')
  rmSync(join(FIXTURE_DIR, 'artifacts', 'AR-05.md'))
  writeItem({ ...base('US-01.1.1'), sources: ['Fixture'] }, FIXTURE_DIR)
  await page.goto('/#/diff')

  const story = page.locator('[id="diff-item:US-01.1.1"]')
  await expect(story.locator('.diff-tag')).toHaveText(['Sources'])
  const before = story.locator('.dc.before')
  await expect(before).toContainText('Fixture document')
  await expect(before).not.toContainText('Test spec p.3')
})

test('an artifact whose details do not parse still compares its file', async ({ page }) => {
  const sidecar = join(FIXTURE_DIR, 'artifacts', 'AR-01.md')
  writeFileSync(sidecar, readFileSync(sidecar, 'utf8').replace(/^---\n/, '---\ntitle: [unclosed\n'))
  const svg = join(FIXTURE_DIR, 'artifacts', 'files', 'AR-01.svg')
  writeFileSync(svg, readFileSync(svg, 'utf8').replace('Other panel', 'Another panel'))
  await page.goto('/#/diff')

  const card = page.locator('[id="diff-artifact:AR-01"]')
  await expect(card.locator('.diff-pill')).toHaveText('Could not be read')
  await expect(card.locator('.diff-tag')).toHaveText(['Details', 'File'])
  await expect(card.locator('.dc.after .diff-unreadable')).toContainText('This file does not parse.')
  const pics = card.locator('.diff-picture img')
  await expect(pics).toHaveCount(2)
  for (const i of [0, 1]) await expect.poll(() => pics.nth(i).evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
})

test('a card opens its sheet over the review, and Escape closes it again', async ({ page }) => {
  writeItem({ ...base('US-02.1.2'), title: 'Story 2.1.2 renamed' }, FIXTURE_DIR)
  await page.goto('/#/diff')
  const card = page.locator('[id="diff-item:US-02.1.2"]')
  await card.getByRole('button', { name: 'Open' }).click()
  await expect(page).toHaveURL(/#\/diff\?item=US-02\.1\.2/)
  const sheet = page.locator('.sheet')
  await expect(sheet).toBeVisible()
  await expect(sheet).toContainText('Story 2.1.2 renamed')
  await page.keyboard.press('Escape')
  await expect(sheet).toHaveCount(0)
  await expect(page).not.toHaveURL(/item=/)
  await expect(card).toBeVisible()
})

test('the bar folds once on the way down and holds still at rest, wherever the page stops', async ({ page }) => {
  const ids = ['US-01.1.1', 'US-01.3.1', 'US-01.4.2', 'US-02.1.1', 'US-02.2.1', 'US-02.3.2', 'US-02.4.3']
  for (const id of ids) writeItem({ ...base(id), description: `New words for ${id}.\n\nAnd a second paragraph.`, acceptance: '- Given one thing, then another.' }, FIXTURE_DIR)
  await page.setViewportSize({ width: 1280, height: 640 })
  await page.goto('/#/diff')
  await expect(page.locator('.diff-card')).toHaveCount(ids.length)
  const diffPage = page.locator('.diff-page')

  // Count each fold and unfold, frame by frame, from now on.
  const watch = () =>
    page.evaluate(() => {
      const w = window as unknown as { __flips: number; __slim: boolean; __stop?: boolean }
      w.__stop = true
      w.__flips = 0
      w.__slim = !!document.querySelector('.diff-bar-inner.slim')
      requestAnimationFrame(() => {
        w.__stop = false
        const tick = () => {
          if (w.__stop) return
          const now = !!document.querySelector('.diff-bar-inner.slim')
          if (now !== w.__slim) w.__flips++
          w.__slim = now
          requestAnimationFrame(tick)
        }
        tick()
      })
    })
  const flips = () => page.evaluate(() => (window as unknown as { __flips: number }).__flips)
  const frames = (n: number) => page.evaluate((n) => new Promise<void>((r) => { const step = (i: number) => (i ? requestAnimationFrame(() => step(i - 1)) : r()); step(n) }), n)

  // Down in small steps: one fold, no matter how the bar's height changes as it goes.
  await watch()
  for (let y = 0; y <= 400; y += 20) {
    await diffPage.evaluate((el, y) => (el.scrollTop = y), y)
    await frames(2)
  }
  await expect(page.locator('.diff-bar-inner.slim')).toBeVisible()
  expect(await flips()).toBe(1)

  // At rest just either side of the fold, and well past it: no flapping, and the page stays put.
  const fold = await page.locator('.diff-head').evaluate((el: HTMLElement) => el.offsetTop + el.offsetHeight)
  for (const y of [fold - 4, fold + 4, fold + 300]) {
    await diffPage.evaluate((el, y) => (el.scrollTop = y), y)
    await frames(10)
    const at = await diffPage.evaluate((el) => el.scrollTop)
    await watch()
    await frames(60)
    expect(await flips()).toBe(0)
    expect(await diffPage.evaluate((el) => el.scrollTop)).toBe(at)
  }
})

test('picking a commit names it at once and dims the old comparison until git is read', async ({ page }) => {
  writeItem({ ...base('US-01.2.1'), description: 'Records start and finish times.' }, FIXTURE_DIR)
  git('commit -qam "Describe a story"')
  writeItem({ ...base('US-02.1.2'), title: 'Story 2.1.2 renamed' }, FIXTURE_DIR)
  await page.goto('/#/diff')
  await expect(page.locator('[id="diff-item:US-02.1.2"]')).toBeVisible()
  await expect(page.locator('.diff-reading')).toHaveCount(0)

  const gate = await hold(page, (u) => u.pathname === '/api/diff')
  await page.locator('.diff-picker').first().click()
  await page.getByRole('option', { name: /Fixture catalogue/ }).click()
  await expect(page.locator('.diff-picker').first()).toContainText('Fixture catalogue')
  await expect(page.locator('.diff-reading')).toHaveText('Reading git')
  await expect(page.locator('.diff-stream.stale')).toHaveCount(1)
  await expect(page.locator('[id="diff-item:US-01.2.1"]')).toHaveCount(0)
  await expect.poll(gate.held).toBeGreaterThan(0)

  await gate.release()
  await expect(page.locator('[id="diff-item:US-01.2.1"]')).toBeVisible()
  await expect(page.locator('.diff-reading')).toHaveCount(0)
  await expect(page.locator('.diff-stream.stale')).toHaveCount(0)
})

test('coming back to the tab shows the last comparison at once, before git is read again', async ({ page }) => {
  writeItem({ ...base('US-02.1.2'), title: 'Story 2.1.2 renamed' }, FIXTURE_DIR)
  await page.goto('/#/diff')
  const card = page.locator('[id="diff-item:US-02.1.2"]')
  await expect(card.locator('.diff-tag')).toHaveText(['Title'])

  await page.locator('.tabs .tab', { hasText: 'Outline' }).click()
  await expect(page.locator('.diff-page')).toHaveCount(0)
  const gate = await hold(page, (u) => u.pathname.startsWith('/api/diff'))
  await page.locator('.tabs .tab', { hasText: 'Diff review' }).click()
  // Drawn from what was kept, while the refresh is still waiting on the server.
  await expect(card.locator('.diff-tag')).toHaveText(['Title'])
  await expect(page.locator('.diff-state')).toHaveCount(0)
  await expect.poll(gate.held).toBeGreaterThan(0)
  await gate.release()
  await expect(card).toBeVisible()
})

test('Enter picks the first row in the jump list and the pickers, and the arrow keys move the highlight', async ({ page }) => {
  writeItem({ ...base('US-01.2.1'), description: 'Records start and finish times.' }, FIXTURE_DIR)
  git('commit -qam "Describe a story"')
  writeItem({ ...base('US-02.1.2'), title: 'Story 2.1.2 renamed' }, FIXTURE_DIR)
  writeItem({ ...base('US-02.2.1'), title: 'Story 2.2.1 renamed' }, FIXTURE_DIR)
  await page.goto('/#/diff')
  await expect(page.locator('[id="diff-item:US-02.2.1"]')).toBeVisible()

  // The jump list: a search and Enter jumps to the first match and closes.
  const jumpButton = page.getByRole('button', { name: /^2 changes/ })
  await jumpButton.click()
  const jumpSearch = page.getByPlaceholder('Find a change by its title')
  await jumpSearch.fill('2.2.1')
  await jumpSearch.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Jump to a change' })).toHaveCount(0)
  await expect(page.locator('[id="diff-item:US-02.2.1"].diff-flash')).toHaveCount(1)

  // The arrow keys move the highlight (stopping at the ends); Enter jumps to the row it is on.
  await jumpButton.click()
  const search = page.getByPlaceholder('Find a change by its title')
  await search.fill('')
  const rows = page.locator('.diff-jump-row')
  await expect(rows).toHaveCount(2)
  await expect(rows.first()).toHaveClass(/\bactive\b/)
  await search.press('ArrowDown')
  await search.press('ArrowDown')
  await expect(rows.nth(1)).toHaveClass(/\bactive\b/)
  await expect(rows.first()).not.toHaveClass(/\bactive\b/)
  await search.press('ArrowUp')
  await expect(rows.first()).toHaveClass(/\bactive\b/)
  const first = (await rows.first().getAttribute('title'))!
  expect(first).not.toBe('US-02.2.1')
  await search.press('Enter')
  await expect(page.locator(`[id="diff-item:${first}"].diff-flash`)).toHaveCount(1)

  // The From picker: a search and Enter picks the first commit shown.
  await page.locator('.diff-picker').first().click()
  const commitSearch = page.getByPlaceholder('Find a commit by its message')
  await commitSearch.fill('Fixture')
  await commitSearch.press('Enter')
  await expect(page.getByRole('dialog', { name: 'From: pick a commit' })).toHaveCount(0)
  await expect(page.locator('.diff-picker').first()).toContainText('Fixture catalogue')
  await expect(page.locator('[id="diff-item:US-01.2.1"]')).toBeVisible()
})

test("B09 R-94: while a new comparison is read, the old one's empty state or error never speaks for it", async ({ page }) => {
  writeItem({ ...base('US-01.2.1'), description: 'Records start and finish times.' }, FIXTURE_DIR)
  git('commit -qam "Describe a story"')
  const sha = execSync('git rev-parse HEAD', { cwd: FIXTURE_DIR, encoding: 'utf8' }).trim()
  await page.goto(`/#/diff?from=${sha}&to=${sha}`)
  const empty = page.getByText('No card, outstanding item or artifact differs between these two versions.')
  await expect(empty).toBeVisible()

  // A new From picked: only "Reading git" until it is read, never the old "No card differs".
  let gate = await hold(page, (u) => u.pathname === '/api/diff')
  await page.locator('.diff-picker').first().click()
  await page.getByRole('option', { name: /Fixture catalogue/ }).click()
  await expect(page.locator('.diff-picker').first()).toContainText('Fixture catalogue')
  await expect.poll(gate.held).toBeGreaterThan(0)
  await expect(page.locator('.diff-state')).toHaveText('Reading git')
  await expect(empty).toHaveCount(0)
  await gate.release()
  await expect(page.locator('[id="diff-item:US-01.2.1"]')).toBeVisible()

  // A comparison that fails says so; picking another clears it at once.
  const first = execSync('git rev-parse HEAD~1', { cwd: FIXTURE_DIR, encoding: 'utf8' }).trim()
  await page.route((u) => u.pathname === '/api/diff', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'git broke' }) }))
  await page.evaluate((h) => (location.hash = h), `#/diff?from=${sha}&to=${sha}`)
  await expect(page.locator('.diff-state.bad')).toContainText('Git could not be read')
  await page.unroute((u) => u.pathname === '/api/diff')
  gate = await hold(page, (u) => u.pathname === '/api/diff')
  await page.evaluate((h) => (location.hash = h), `#/diff?from=${first}&to=worktree`)
  await expect.poll(gate.held).toBeGreaterThan(0)
  await expect(page.locator('.diff-state.bad')).toHaveCount(0)
  // The last comparison read stays, dimmed, under "Reading git".
  await expect(page.locator('.diff-reading')).toHaveText('Reading git')
  await gate.release()
  await expect(page.locator('[id="diff-item:US-01.2.1"]')).toBeVisible()
})

for (const reduced of [true, false]) {
  test(`B09 R-32: k to the end, then the reader scrolls up: never pulled back${reduced ? ', with reduced motion' : ''}`, async ({ page }) => {
    if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' })
    const ids = ['US-01.1.1', 'US-01.2.1', 'US-01.3.1', 'US-01.4.2', 'US-02.1.1', 'US-02.2.1', 'US-02.3.2', 'US-02.4.3']
    for (const id of ids) writeItem({ ...base(id), description: `New words for ${id}.\n\nA second paragraph.`, acceptance: '- Given one thing, then another.' }, FIXTURE_DIR)
    await page.setViewportSize({ width: 1280, height: 640 })
    await page.goto('/#/diff')
    await expect(page.locator(`[id="diff-item:${ids.at(-1)}"]`)).toBeVisible({ timeout: 10_000 })
    const diffPage = page.locator('.diff-page')
    const top = () => diffPage.evaluate((el) => el.scrollTop)
    const bottom = () => diffPage.evaluate((el) => el.scrollHeight - el.clientHeight)
    await page.locator('body').click({ position: { x: 5, y: 300 } })
    // k until the page stops at its bottom (the last changes cannot come up under the bar), then once more.
    for (let n = 0; n < 60 && Math.abs((await top()) - (await bottom())) >= 2; n++) {
      await page.keyboard.press('k')
      await page.waitForTimeout(reduced ? 50 : 250)
    }
    await expect.poll(async () => Math.abs((await top()) - (await bottom()))).toBeLessThan(2)
    await page.keyboard.press('k')
    // The reader scrolls up by hand.
    await page.mouse.move(640, 400)
    await page.mouse.wheel(0, -500)
    await expect.poll(top).toBeLessThan((await bottom()) - 300)
    const left = await top()
    await page.waitForTimeout(1500)
    expect(Math.abs((await top()) - left)).toBeLessThan(2)
    // j from there goes up, and stays up.
    await page.keyboard.press('j')
    await page.waitForTimeout(1500)
    expect(await top()).toBeLessThan(left + 2)
  })
}
