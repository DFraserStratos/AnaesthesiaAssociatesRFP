import type { AppId } from '../../kit/verdicts'

/**
 * "shadcn fit": how much of each replacement came out of the box versus how
 * much we had to bend the library to match the prototype's custom UI.
 *   5  Out of the box: stock component + theme tokens; the row only composes it.
 *   4  Light touch: stock component, a few class tweaks or a kit variant; behaviour stock.
 *   3  Restyled: many overrides or several primitives composed to rebuild our
 *      anatomy; behaviour still the library's.
 *   2  Bent: library as scaffolding; heavy custom markup or styling, behaviour
 *      layered on or library defaults overridden.
 *   1  Custom: the library contributes little, or we work against it.
 * Each rater writes one file `<app>-<part>.ts` here exporting `fit`; this
 * index merges them.
 */
export interface FitRating {
  score: 1 | 2 | 3 | 4 | 5
  /** One short sentence: what was stock, what was bent. */
  why: string
}

export interface FitFile {
  app: AppId
  ratings: Record<string, FitRating>
}

const files = import.meta.glob<{ fit: FitFile }>('./*-*.ts', { eager: true })
const FIT: Record<AppId, Record<string, FitRating>> = { admin: {}, web: {}, mobile: {} }
for (const mod of Object.values(files)) Object.assign(FIT[mod.fit.app], mod.fit.ratings)

export function getFit(app: AppId, name: string): FitRating | undefined {
  return FIT[app][name]
}

export function fitAverage(app: AppId): { avg: number; n: number } {
  const v = Object.values(FIT[app])
  return { avg: v.length ? v.reduce((a, r) => a + r.score, 0) / v.length : 0, n: v.length }
}
