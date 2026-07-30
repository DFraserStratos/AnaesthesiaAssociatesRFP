/**
 * Install-prompt capture tests (the PWA's Android one-tap install).
 *
 * The whole point of the module is TIMING, so that is what these assert: Chrome
 * fires `beforeinstallprompt` once, seconds before the card that replays it
 * exists, and the captured event then has to outlive that card being unmounted
 * every time the presenter leaves the More tab. Both are module-scope wiring, so
 * the idiom follows `officeSimulation.test.ts` — with one addition: each test
 * re-imports through `vi.resetModules()`, because a module-level holder cannot be
 * reset any other way.
 *
 * jsdom is enough. `beforeinstallprompt` is not a jsdom event, but nothing about
 * it needs to be: it is an ordinary cancelable `Event` with two extra members,
 * and Chrome's dialog sits entirely behind those two, which a stand-in supplies.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type InstallPromptModule = typeof import('./installPrompt')

/** A fresh module instance, with its own listener attached to this jsdom window. */
async function load(): Promise<InstallPromptModule> {
  vi.resetModules()
  return import('./installPrompt')
}

/**
 * Chrome's event, near enough: cancelable so `preventDefault` is observable, plus
 * the two members lib.dom does not declare. `refuseReplay` is the real Chrome
 * behaviour for an event that has already been used.
 */
function fireInstallPrompt(options: { outcome?: 'accepted' | 'dismissed'; refuseReplay?: boolean } = {}): {
  event: Event
  prompts: () => number
} {
  let prompted = 0
  const event = new Event('beforeinstallprompt', { cancelable: true })
  Object.assign(event, {
    prompt: () => {
      prompted += 1
      return options.refuseReplay === true
        ? Promise.reject(new Error('the event was already used'))
        : Promise.resolve()
    },
    userChoice: Promise.resolve({ outcome: options.outcome ?? 'accepted' }),
  })
  window.dispatchEvent(event)
  return { event, prompts: () => prompted }
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  window.localStorage.clear()
})

describe('capture', () => {
  it('holds an event that arrives before anything is listening, and suppresses the mini-infobar', async () => {
    const installPrompt = await load()
    expect(installPrompt.getInstallEvent()).toBeNull()

    // The real sequence: the entry has imported the module, the card is nowhere
    // near mounted, and Chrome fires.
    const { event } = fireInstallPrompt()

    expect(installPrompt.getInstallEvent()).toBe(event)
    // `preventDefault` only suppresses Chrome's own banner if it happens in the
    // capture, which is the reason the listener is at module scope.
    expect(event.defaultPrevented).toBe(true)
  })

  it('is still holding it for a subscriber that arrives afterwards, which is the card mounting', async () => {
    const installPrompt = await load()
    const { event } = fireInstallPrompt()

    const seen: (Event | null)[] = []
    const unsubscribe = installPrompt.subscribeInstallEvent(() => seen.push(installPrompt.getInstallEvent()))
    try {
      // A late subscriber is not notified retroactively, so the card reads the
      // holder on mount rather than waiting to be told.
      expect(seen).toEqual([])
      expect(installPrompt.getInstallEvent()).toBe(event)
    } finally {
      unsubscribe()
    }
  })

  it('notifies live subscribers on arrival, and not after they unsubscribe', async () => {
    const installPrompt = await load()
    let notifications = 0
    const unsubscribe = installPrompt.subscribeInstallEvent(() => {
      notifications += 1
    })

    fireInstallPrompt()
    expect(notifications).toBe(1)

    // The card unmounting (the presenter left the More tab) must not lose the
    // event, only the notification.
    unsubscribe()
    const { event } = fireInstallPrompt()
    expect(notifications).toBe(1)
    expect(installPrompt.getInstallEvent()).toBe(event)
  })
})

describe('replay', () => {
  it('prompts, reports an accepted install, and drops the spent event', async () => {
    const installPrompt = await load()
    const { prompts } = fireInstallPrompt({ outcome: 'accepted' })

    await expect(installPrompt.promptInstall()).resolves.toBe('accepted')
    expect(prompts()).toBe(1)
    expect(installPrompt.getInstallEvent()).toBeNull()
  })

  it('reports a refusal and still drops the event, so the card falls back to the written steps', async () => {
    const installPrompt = await load()
    fireInstallPrompt({ outcome: 'dismissed' })

    await expect(installPrompt.promptInstall()).resolves.toBe('dismissed')
    expect(installPrompt.getInstallEvent()).toBeNull()
  })

  it('resolves null with nothing to replay: iOS, a WebView, or a Chrome that never fired', async () => {
    const installPrompt = await load()
    await expect(installPrompt.promptInstall()).resolves.toBeNull()
  })

  it('survives Chrome refusing the replay outright rather than leaving a dead button', async () => {
    const installPrompt = await load()
    fireInstallPrompt({ refuseReplay: true })

    await expect(installPrompt.promptInstall()).resolves.toBeNull()
    expect(installPrompt.getInstallEvent()).toBeNull()
  })
})

describe('appinstalled', () => {
  it('is remembered and clears the event, because the tab the user is on is still a tab', async () => {
    const installPrompt = await load()
    fireInstallPrompt()
    expect(installPrompt.wasInstalled()).toBe(false)

    let notifications = 0
    const unsubscribe = installPrompt.subscribeInstallEvent(() => {
      notifications += 1
    })
    try {
      // Installed from Chrome's own menu, not from our button.
      window.dispatchEvent(new Event('appinstalled'))

      expect(installPrompt.wasInstalled()).toBe(true)
      expect(installPrompt.getInstallEvent()).toBeNull()
      // The card is subscribed, so it hides itself instead of telling someone to
      // install an app they have just installed.
      expect(notifications).toBe(1)
    } finally {
      unsubscribe()
    }
  })
})

describe("the coach's dismissal flag", () => {
  /** Asserted by hand, so renaming the key breaks here first. */
  const DISMISS_KEY = 'aa-install-coach-dismissed'

  it('is cleared by `clearInstallCoachDismissal`, so a stray tap on the X is not a one way door', async () => {
    window.localStorage.setItem(DISMISS_KEY, '1')
    const { clearInstallCoachDismissal } = await import('./InstallCoach')

    clearInstallCoachDismissal()

    expect(window.localStorage.getItem(DISMISS_KEY)).toBeNull()
  })
})
