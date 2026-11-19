/**
 * The watcher's batching (FINDINGS R-158): file events are gathered for a short quiet spell
 * (`debounceMs`), never longer than `maxWaitMs` from the first, then the catalogue is re-synced once
 * with the paths that changed, so a burst of changes costs one re-sync of those files.
 *
 * An event's type is never trusted (macOS coalesces, repeats and splits events: an atomic rename can
 * arrive as an add and a delete): any event, for a file or a folder, means "look at this path again"; the
 * re-sync decides what a path feeds, and reads the whole folder for one it cannot judge alone (the
 * catalogue folder itself, a record folder). The batch itself asks for a whole read after a watcher
 * error, after a re-sync that failed, or when more than `maxPaths` paths changed at once.
 */
export interface WatchBatchOptions {
  /** Re-sync: the changed paths, or null to read the whole folder. Throws when it failed. */
  sync: (paths: string[] | null) => void
  debounceMs?: number
  maxWaitMs?: number
  maxPaths?: number
  now?: () => number
}

export interface WatchBatch {
  /** A watcher event of any kind (`add`, `change`, `unlink`, `addDir`, `unlinkDir`) for a path. */
  event: (abs: string) => void
  /** The watcher failed: what it missed is unknown, so the next re-sync reads everything. */
  error: () => void
  /** Stop: a waiting re-sync is dropped. */
  close: () => void
}

export const DEBOUNCE_MS = 120
export const MAX_WAIT_MS = 600
/** Beyond this many paths in one batch, one read of the whole folder is the cheaper way. */
export const MAX_PATHS = 500

export function createWatchBatch(opts: WatchBatchOptions): WatchBatch {
  const { debounceMs = DEBOUNCE_MS, maxWaitMs = MAX_WAIT_MS, maxPaths = MAX_PATHS, now = () => performance.now() } = opts
  const paths = new Set<string>()
  let whole = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let first: number | undefined

  const run = () => {
    timer = undefined
    first = undefined
    const batch = whole || paths.size > maxPaths ? null : [...paths]
    paths.clear()
    whole = false
    try {
      opts.sync(batch)
    } catch {
      // A failed re-sync forgets nothing: the next one reads the whole folder. After changed paths
      // failed, that whole read runs at once; after a whole read failed, it waits for the next event
      // (so a lasting failure never loops).
      whole = true
      if (batch) {
        clearTimeout(timer)
        timer = setTimeout(run, 0)
      }
    }
  }
  const later = () => {
    const t = now()
    first ??= t
    clearTimeout(timer)
    timer = setTimeout(run, Math.max(0, Math.min(debounceMs, first + maxWaitMs - t)))
  }

  return {
    event(abs) {
      paths.add(abs)
      later()
    },
    error() {
      whole = true
      later()
    },
    close() {
      clearTimeout(timer)
      timer = undefined
    },
  }
}
