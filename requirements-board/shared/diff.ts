/**
 * The Diff review tab's data: what the dev server sends for a comparison of the catalogue between
 * two git states (`server/catalogueDiff.ts`), shared so the server and the browser agree.
 */
import type { Artifact, Item, Question } from './types.ts'

/** The working tree: every file as it is on disk now, committed or not. */
export const WORKTREE = 'worktree'

/**
 * The state before the first commit, so a first commit compares as all added: git's (SHA-1) empty
 * tree. The server reads it as the repository's own empty tree, so it also works in a SHA-256 one.
 */
export const EMPTY_TREE = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'

/** A ref the API accepts: HEAD, or a commit hash, SHA-1 or SHA-256 (never anything git could read as an option). */
export const isCommitRef = (ref: string) => ref === 'HEAD' || /^[0-9a-f]{7,64}$/.test(ref)

/** A commit that changed at least one catalogue record (a card, an outstanding item, an artifact). */
export interface CatalogueCommit {
  sha: string
  short: string
  /** Author date, ISO. */
  at: string
  subject: string
  /** How many records it changed, as the comparison of it with its parent shows them. */
  records: number
  /**
   * Its first parent (null for a root commit), so "what this commit changed" is `parent..sha`, even
   * for a merge: the list follows first parents, and a merge counts what it brought in.
   */
  parent: string | null
}

export interface CommitsResponse {
  /** False outside a git repository (or with no git): there is nothing to compare. */
  available: boolean
  /** Newest first, along HEAD's first parents. */
  commits: CatalogueCommit[]
  /** HEAD as resolved when the list was read (null with no commits): the From of "what is uncommitted". */
  head: string | null
}

/** `GET /api/diff/count`: how many records differ (minor changes left out), for the tab's count. */
export interface DiffCountResponse {
  available: boolean
  count: number
}

interface Sides<T> {
  id: string
  /** The record at From; null where it did not exist (added). */
  before: T | null
  /** The record at To; null where it no longer exists (removed). */
  after: T | null
  /**
   * The side's file is there but does not parse (a hand edit, a merge conflict): the parser's
   * message. Its record is then null without the record having been added or removed.
   */
  beforeError?: string
  afterError?: string
  /** The raw text of a side that does not parse, to show instead of the record. */
  beforeText?: string
  afterText?: string
}

export interface ItemDiff extends Sides<Item> {
  kind: 'item'
  /** Screenshot files by path, for images the card lists on either side: their git blob hashes. */
  images?: { before: Record<string, string>; after: Record<string, string> }
}

export interface QuestionDiff extends Sides<Question> {
  kind: 'question'
}

export interface ArtifactDiff extends Sides<Artifact> {
  kind: 'artifact'
  /** The artifact's file at each side, by git blob hash (null: no file there). */
  fileBefore: string | null
  fileAfter: string | null
  /**
   * For a side whose sidecar does not parse: the file it names (its own `file:` line, else the
   * other side's), so the file can still be compared.
   */
  fileNameBefore?: string | null
  fileNameAfter?: string | null
}

export type DiffRecord = ItemDiff | QuestionDiff | ArtifactDiff

export interface DiffResponse {
  available: boolean
  /** The refs compared, as resolved: full hashes, or `worktree` for To. */
  from: string
  to: string
  records: DiffRecord[]
  /**
   * Unchanged cards the changed ones sit under (their epics and features), as they stood at each
   * side, so the page can show the hierarchy as it was at an old commit.
   */
  context: {
    before: Record<string, Item>
    after: Record<string, Item>
    /**
     * The artifacts at each side that read differently from today's (or are gone now), without
     * their prose, so a card can name an artifact it cites as it stood then, and read its sources
     * against the artifacts of then. Any other artifact is as the page has it today.
     */
    artifacts?: { before: Record<string, Artifact>; after: Record<string, Artifact> }
  }
  /**
   * Only from `GET /api/diff/auto`: true when nothing differs from the last commit, so the response
   * is instead what that commit changed (`from` its first parent, `to` the commit).
   */
  jumped?: boolean
}
