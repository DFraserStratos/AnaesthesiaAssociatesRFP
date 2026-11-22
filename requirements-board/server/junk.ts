/**
 * Files that are never part of a skill or a kit: dotfiles (`.DS_Store`, an editor's swap file and the
 * like) and Python's bytecode cache (`__pycache__/`, `*.pyc`, left by running an svg-diagram generator).
 * `.gitignore` is the one dotfile that belongs. The kit export and the skill install share this one
 * rule, so what one ships the other installs, and junk never decides who owns a skill folder.
 */

const KEPT_DOTFILES = new Set(['.gitignore'])

/** One file or folder name. */
export const isJunk = (name: string) => (name.startsWith('.') && !KEPT_DOTFILES.has(name)) || name === '__pycache__' || name.endsWith('.pyc')

/** A relative path (either separator): junk when any segment is. */
export const hasJunk = (rel: string) => rel.split(/[\\/]/).some((s) => s !== '' && s !== '.' && s !== '..' && isJunk(s))
