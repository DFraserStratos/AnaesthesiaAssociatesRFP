/// <reference lib="dom" />
/**
 * B04, one rule, one helper, in the running board (fixture catalogue): a Markdown
 * document's headings carry the server's slugs whatever the page shows (R-28), every heading=,
 * quote= and section spot the check accepts draws its box, and a decomposed passage is boxed over
 * exactly its words (R-101).
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { serialiseArtifact } from '../shared/files.ts'
import { HIGHLIGHT } from '../shared/highlight.ts'
import type { Artifact, ArtifactRec, CatalogueSnapshot } from '../shared/types.ts'
import { FIXTURE_DIR, writeFixture } from './fixtureCatalogue.ts'

test.describe.configure({ mode: 'serial' })

const NFD = 'Māori health'
const NOTE = `# One rule

## Plan for US-01.1.1 today

We talked about ${NFD} at length.

See US-01.1.2 for the rules &amp; *fees* here.

## fee_schedule rules

Body text.

## Q&amp;A

Last.
`
const region = (id: string, around: string[]) => ({ id, name: id, around, box: null, page: null, pad: null, note: '' })
const NOTE_ARTIFACT: Artifact = {
  id: 'AR-08',
  title: 'One rule note',
  kind: 'note',
  status: 'Current',
  supersededBy: null,
  citedAs: [],
  date: '2026-01-03',
  author: '',
  components: [],
  sources: ['Fixture'],
  file: 'notes/2026-01-03-one-rule.md',
  regions: [region('maori', ['quote=Māori health']), region('bare', ['quote=See US-01.1.2 for the rules & fees']), region('fees', ['heading=fee_schedule rules']), region('plan', ['heading=Plan for US-01.1.1 today'])],
  steps: [],
  stepView: null,
  description: '',
  source: '',
  extra: {},
}

test.beforeEach(async ({ request }) => {
  writeFixture()
  writeFileSync(join(FIXTURE_DIR, 'notes', '2026-01-03-one-rule.md'), NOTE)
  writeFileSync(join(FIXTURE_DIR, 'artifacts', 'AR-08.md'), serialiseArtifact(NOTE_ARTIFACT))
  await expect.poll(async () => !!((await (await request.get('/api/catalogue')).json()) as CatalogueSnapshot).artifacts?.['AR-08']?.meta).toBe(true)
})
test.afterAll(() => writeFixture())

test('every heading carries the server slug, a record ID in it included, and opens from the Sections list (R-28)', async ({ page, request }) => {
  const snap = (await (await request.get('/api/catalogue')).json()) as CatalogueSnapshot
  const server = (snap.artifacts!['AR-08'] as ArtifactRec).meta.headings!.map((h) => h.slug)
  expect(server).toEqual(['one-rule', 'plan-for-us-0111-today', 'fee_schedule-rules', 'qa'])
  await page.goto('/#/artifacts/AR-08')
  await expect(page.locator('.doc-sheet h2').first()).toContainText('Story 1.1.1') // the ID is drawn as its title
  await expect.poll(() => page.locator('.doc-sheet :is(h1, h2)').evaluateAll((hs) => hs.map((h) => h.getAttribute('data-slug')))).toEqual(server)
  for (const slug of server) {
    await page.goto(`/#/artifacts/AR-08?region=${encodeURIComponent(slug)}`)
    await expect(page.locator('.doc-sheet .region-box'), slug).toBeVisible()
    await expect(page.locator('.viewer-flag')).toHaveCount(0)
  }
  await page.goto('/#/artifacts/AR-08')
  await page.locator('.spot-list.auto').getByText('Plan for US-01.1.1 today').click()
  await expect(page).toHaveURL(/region=plan-for-us-0111-today/)
  await expect(page.locator('.doc-sheet .region-box')).toBeVisible()
  await expect(page.locator('.viewer-flag')).toHaveCount(0)
})

test('heading= and quote= anchors the check accepts draw their box: an ID, an entity, emphasis, an underscore (R-28, R-83)', async ({ page }) => {
  for (const id of ['bare', 'fees', 'plan', 'maori']) {
    await page.goto(`/#/artifacts/AR-08?region=${id}`)
    await expect(page.locator('.doc-sheet .region-box'), id).toBeVisible()
    await expect(page.locator('.viewer-flag'), id).toHaveCount(0)
  }
})

test('a decomposed passage is boxed over exactly its words (R-101)', async ({ page }) => {
  await page.goto('/#/artifacts/AR-08?region=maori')
  await page.locator('.doc-sheet .region-box').evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)))
  const box = (await page.locator('.doc-sheet .region-box').boundingBox())!
  const words = await page.locator('.doc-sheet').evaluate((sheet, nfd) => {
    const walker = document.createTreeWalker(sheet, NodeFilter.SHOW_TEXT)
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const i = (n as Text).data.indexOf(nfd)
      if (i < 0) continue
      const r = document.createRange()
      r.setStart(n, i)
      r.setEnd(n, i + nfd.length)
      const b = r.getBoundingClientRect()
      return { x: b.x, y: b.y, w: b.width, h: b.height }
    }
    return null
  }, NFD)
  expect(words).not.toBeNull()
  // The box is the passage plus the highlight's padding and border on each side, give or take a pixel.
  const out = HIGHLIGHT.pad + HIGHLIGHT.width
  expect(Math.abs(box.x + out - words!.x)).toBeLessThan(2)
  expect(Math.abs(box.width - 2 * out - words!.w)).toBeLessThan(2)
  expect(Math.abs(box.y + out - words!.y)).toBeLessThan(2)
})
