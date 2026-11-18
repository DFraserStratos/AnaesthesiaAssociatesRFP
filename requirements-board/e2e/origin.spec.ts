/// <reference lib="dom" />
/**
 * The board's origin boundary in a browser, over the fixture catalogue (port 5182): a link in a
 * drawing never moves the board (a link to one of its own spots brings that spot into view), a
 * record link still opens its record, a sidecar naming a moved file says the file is missing, and
 * a page from another origin can neither read nor embed what the board serves.
 */
import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { FIXTURE_DIR, FIXTURE_SVG, writeFixture } from './fixtureCatalogue.ts'

test.describe.configure({ mode: 'serial' })

/** The fixture drawing with links of its own (to a spot in it, to a spot it lacks, one meant to run script) and record IDs, below the panels. */
const LINKED_SVG = FIXTURE_SVG.replace(
  '</svg>',
  `<a href="#panel-a"><text x="440" y="200" font-size="16">Jump to the first box</text></a>
<a href="#settings"><text x="440" y="230" font-size="16">Missing spot link</text></a>
<a xmlns:x="http://www.w3.org/1999/xlink" x:href="javascript:window.__pwned=2"><text x="440" y="255" font-size="16">Script link</text></a>
<text x="60" y="330" font-size="16">Story US-01.1.1</text>
<text x="60" y="360" font-size="16">Picture AR-02</text>
</svg>`,
)

const link = (page: Page, text: string) => page.locator('.canvas-host a', { hasText: text })
const hash = (page: Page) => page.evaluate(() => location.hash)

test.beforeEach(async ({ request }) => {
  writeFixture()
  writeFileSync(join(FIXTURE_DIR, 'artifacts', 'files', 'AR-01.svg'), LINKED_SVG)
  await expect.poll(async () => (await request.get('/artifact-file/AR-01')).text(), { timeout: 20_000 }).toContain('Jump to the first box')
})

test('a link in a drawing never moves the board, opens a tab or runs anything; a record link still opens its record', async ({ page, context }) => {
  await page.goto('/#/artifacts/AR-01')
  await expect(link(page, 'Missing spot link')).toBeVisible()
  const start = await hash(page)
  const opened: string[] = []
  context.on('page', (p) => opened.push(p.url()))
  for (const text of ['Missing spot link', 'Script link', 'Jump to the first box']) {
    await link(page, text).click()
    await link(page, text).click({ modifiers: ['ControlOrMeta'] })
    await link(page, text).click({ modifiers: ['Shift'] })
    await link(page, text).click({ modifiers: ['Alt'] })
    await link(page, text).click({ button: 'middle' })
    // A link left with an href takes focus, and Enter is a click (the script link has none left).
    if (await link(page, text).evaluate((a) => a.hasAttribute('href'))) {
      await link(page, text).focus()
      await page.keyboard.press('Enter')
    }
    expect(await hash(page), text).toBe(start)
  }
  await page.waitForTimeout(300)
  expect(opened).toEqual([])
  expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined()
  // The board's own record links still work: a modified click opens a new tab at the record...
  const record = (id: string) => page.locator('.canvas-host a.record-id', { hasText: id })
  // A link inside drawn text has no box of its own to aim at: aim at the end of its line, where the ID is.
  const clickId = async (line: string, modifiers: ('ControlOrMeta' | 'Shift')[] = []) => {
    const box = (await page.locator('.canvas-host svg text', { hasText: line }).boundingBox())!
    await page.mouse.move(box.x + box.width * 0.85, box.y + box.height / 2)
    for (const m of modifiers) await page.keyboard.down(m)
    await page.mouse.down()
    await page.mouse.up()
    for (const m of modifiers) await page.keyboard.up(m)
  }
  const tab = context.waitForEvent('page')
  await clickId('Story US-01.1.1', ['ControlOrMeta'])
  const opened2 = await tab
  await opened2.waitForURL(/item=US-01\.1\.1/)
  await opened2.close()
  expect(await hash(page)).toBe(start)
  // ...Enter and a plain click open it here: a story's sheet, an artifact's page.
  await record('US-01.1.1').focus()
  await page.keyboard.press('Enter')
  await expect.poll(() => hash(page)).toContain('US-01.1.1')
  await page.goto('/#/artifacts/AR-01')
  await expect(record('AR-02')).toBeVisible()
  await clickId('Picture AR-02')
  await expect.poll(() => hash(page)).toContain('/artifacts/AR-02')
})

test('a link to one of the drawing’s own spots brings that spot into view', async ({ page }) => {
  await page.goto('/#/artifacts/AR-01')
  await expect(link(page, 'Jump to the first box')).toBeVisible()
  // Zoom in on the far side of the drawing from panel A, about the pointer.
  const frame = (await page.locator('.canvas-frame').boundingBox())!
  await page.mouse.move(frame.x + frame.width * 0.8, frame.y + frame.height * 0.6)
  await page.locator('.canvas-frame').focus()
  await page.keyboard.down('Control')
  for (let i = 0; i < 8; i++) await page.mouse.wheel(0, -240)
  await page.keyboard.up('Control')
  const centreInFrame = () =>
    page.evaluate(() => {
      const host = document.querySelector('.canvas-host')!
      const r = host.shadowRoot!.getElementById('panel-a')!.getBoundingClientRect()
      const f = document.querySelector('.canvas-frame')!.getBoundingClientRect()
      const x = r.left + r.width / 2
      const y = r.top + r.height / 2
      return x >= f.left && x <= f.right && y >= f.top && y <= f.bottom
    })
  await expect.poll(centreInFrame).toBe(false)
  const start = await hash(page)
  // The link itself is off screen now: activate it as Enter would.
  await page.evaluate(() => {
    const a = [...document.querySelector('.canvas-host')!.shadowRoot!.querySelectorAll('a')].find((x) => x.textContent?.includes('Jump to the first box'))!
    a.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }))
  })
  await expect.poll(centreInFrame).toBe(true)
  expect(await hash(page)).toBe(start)
})

test('a sidecar naming a moved file says the file is missing', async ({ page }) => {
  rmSync(join(FIXTURE_DIR, 'notes', '2026-01-02-fixture-meeting.md'))
  await page.goto('/#/artifacts/AR-04')
  await expect(page.getByText(/the file is missing/)).toBeVisible()
  // Before, the app's own page came back as the document and was shown as its text.
  await expect(page.getByText('@vite/client', { exact: false })).toHaveCount(0)
})

test('a page from another origin can neither read nor embed what the board serves', async ({ page, baseURL }) => {
  const board = new URL(baseURL!)
  // The same board, reached by another name: another origin and another site.
  // Vite listens on whichever loopback `localhost` resolves to: use the address that answers.
  let other = ''
  for (const host of ['127.0.0.1', '[::1]']) {
    if (await page.request.get(`http://${host}:${board.port}/`).then((r) => r.ok(), () => false)) {
      other = `http://${host}:${board.port}/`
      break
    }
  }
  expect(other).not.toBe('')
  await page.goto(other)
  const tries = await page.evaluate(async (base) => {
    const read = async (path: string) => {
      try {
        return (await fetch(base + path)).status
      } catch {
        return 'refused'
      }
    }
    const embed = (path: string) =>
      new Promise<string>((done) => {
        const img = new Image()
        img.onload = () => done('loaded')
        img.onerror = () => done('refused')
        img.src = base + path
      })
    return { catalogue: await read('/api/catalogue'), file: await read('/artifact-file/AR-02'), picture: await embed('/artifact-file/AR-02') }
  }, `http://localhost:${board.port}`)
  expect(tries).toEqual({ catalogue: 'refused', file: 'refused', picture: 'refused' })
  // The board's own page still loads its files.
  await page.goto('/')
  expect(await page.evaluate(() => fetch('/api/catalogue').then((r) => r.status))).toBe(200)
  expect(await page.evaluate(() => new Promise((done) => Object.assign(new Image(), { onload: () => done('loaded'), onerror: () => done('refused'), src: '/artifact-file/AR-02' })))).toBe('loaded')
})
