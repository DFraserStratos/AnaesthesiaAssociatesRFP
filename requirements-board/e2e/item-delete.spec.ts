/// <reference lib="dom" />
/**
 * Deleting an item from its sheet, over the fixture catalogue (port 5182): it asks first, naming
 * what goes with it, Keep it leaves the files, and Delete removes the item and everything under it.
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { FIXTURE_DIR, writeFixture } from './fixtureCatalogue.ts'

test.describe.configure({ mode: 'serial' })

const fileOf = (id: string) => join(FIXTURE_DIR, 'stories', `${id}.md`)

test.beforeEach(async ({ page }) => {
  writeFixture()
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/#/board')
})

test.afterAll(() => writeFixture())

test('a feature asks first, names its stories, and Delete removes it and them', async ({ page }) => {
  await page.locator('.react-flow__node[data-id="FT-01.2"]').click()
  const sheet = page.locator('.sheet.docked')
  await expect(sheet.locator('h2')).toHaveText('Feature 1.2')
  await sheet.getByRole('button', { name: 'Delete' }).click()
  const ask = page.getByRole('alertdialog', { name: 'Delete this feature?' })
  await expect(ask).toContainText('Its 3 stories are deleted with it.')
  await expect(page.getByRole('button', { name: 'Keep it' })).toBeFocused()
  await page.getByRole('button', { name: 'Keep it' }).click()
  expect(existsSync(fileOf('FT-01.2'))).toBe(true)

  await sheet.getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('button', { name: 'Delete 4 items' }).click()
  await expect.poll(() => ['FT-01.2', 'US-01.2.1', 'US-01.2.2', 'US-01.2.3'].some((id) => existsSync(fileOf(id)))).toBe(false)
  expect(existsSync(fileOf('FT-01.1'))).toBe(true)
  await expect(page.locator('.react-flow__node[data-id="FT-01.2"]')).toHaveCount(0)
  await expect(page.locator('.sheet.docked')).toHaveCount(0)
})

test('a story alone asks with a plain Delete story', async ({ page }) => {
  await page.locator('.react-flow__node[data-id="US-02.1.3"]').click()
  await page.locator('.sheet.docked').getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('button', { name: 'Delete story' }).click()
  await expect.poll(() => existsSync(fileOf('US-02.1.3'))).toBe(false)
  await expect(page.locator('.react-flow__node[data-id="US-02.1.3"]')).toHaveCount(0)
})

test.describe('a new card left blank', () => {
  const newFiles = () => ['US-01.1.4', 'US-01.1.5'].filter((id) => existsSync(fileOf(id)))
  const addStory = async (page: import('@playwright/test').Page) => {
    await page.getByRole('radio', { name: 'Mapped' }).click()
    await page.locator('.react-flow__node[data-id="FT-01.1"]').waitFor()
    await page.locator('.add-slot').first().click()
    await expect.poll(newFiles).toEqual(['US-01.1.4'])
    await expect(page.locator('.sheet.docked input').first()).toHaveValue('Untitled')
  }

  test('Cancel on its first edit removes it', async ({ page }) => {
    await addStory(page)
    await page.locator('.sheet.docked').getByRole('button', { name: 'Cancel' }).click()
    await expect.poll(newFiles).toEqual([])
    await expect(page.locator('.sheet.docked')).toHaveCount(0)
  })

  test('given a title and saved, it stays, and a later Cancel leaves it', async ({ page }) => {
    await addStory(page)
    const sheet = page.locator('.sheet.docked')
    await sheet.locator('input').first().fill('Wanted')
    await sheet.getByRole('button', { name: 'Save' }).click()
    await sheet.getByRole('button', { name: 'Edit' }).click()
    await sheet.getByRole('button', { name: 'Cancel' }).click()
    await page.waitForTimeout(300)
    expect(newFiles()).toEqual(['US-01.1.4'])
  })
})
