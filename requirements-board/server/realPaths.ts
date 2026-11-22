/**
 * Where a file the server reads for the catalogue really is. A folder and the paths under it are
 * compared as real paths (symbolic links resolved on both sides), so a folder reached through a
 * link (a macOS temp folder under `/var`, which is `/private/var`; a checkout opened through a
 * linked folder; git, which names the repository by its real path) still holds its own files. A
 * symbolic link inside a folder that leads out of it is still followed, but can be named, so the
 * server and the check warn about it.
 */
import { existsSync, realpathSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, relative } from 'node:path'

/**
 * `abs` with its symbolic links resolved. The file itself may be gone: its nearest folder that
 * exists is resolved and the rest kept as written.
 */
export function realPath(abs: string): string {
  let dir = abs
  const rest: string[] = []
  while (!existsSync(dir) && dirname(dir) !== dir) {
    rest.unshift(basename(dir))
    dir = dirname(dir)
  }
  try {
    return join(realpathSync(dir), ...rest)
  } catch {
    return abs
  }
}

/** `abs` with the folders above it resolved but not a link at `abs` itself: where the entry sits, not where it leads. */
export const realEntry = (abs: string) => join(realPath(dirname(abs)), basename(abs))

/** Is `abs` strictly under `base`, comparing the two as written? */
export function under(abs: string, base: string): boolean {
  const rel = relative(base, abs)
  return rel !== '' && rel.split(/[\\/]/)[0] !== '..' && !isAbsolute(rel)
}

/** Is `abs` inside `base`, as written or once the folders above both are resolved (one may be spelled through a link)? */
export const inside = (abs: string, base: string) => under(abs, base) || under(realEntry(abs), realPath(base))

/**
 * Where `abs` really leads when a symbolic link at or above it (below `base`) takes it out of
 * `base`; null when it stays inside, or is not there.
 */
export function linkOut(abs: string, base: string): string | null {
  if (!under(abs, base)) return null
  let real: string
  try {
    real = realpathSync(abs)
  } catch {
    return null
  }
  return under(real, realPath(base)) ? null : real
}
