/**
 * Progressive drawing for the Diff review: every card is on the page at once (its head, and a space
 * about its size), the first few drawn whole; the rest are drawn a few per step in a transition,
 * those nearest the view first. A card filtered out is forgotten, so switching its filter back on
 * fills it in again by steps.
 */
import { startTransition, useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { flushSync } from 'react-dom'
import type { Entry } from '../../shared/diffModel.ts'

/** Cards drawn whole on the first render; the rest fill in a few at a time, nearest the view first. */
const FIRST_CARDS = 2
const CARDS_PER_STEP = 6

const adding = (keys: string[]) => (d: ReadonlySet<string>) => {
  if (keys.every((k) => d.has(k))) return d
  const next = new Set(d)
  for (const k of keys) next.add(k)
  return next
}

export function useProgressiveDraw(cards: Entry[], page: RefObject<HTMLElement>) {
  const [drawn, setDrawn] = useState<ReadonlySet<string>>(() => new Set())
  const firstCards = useMemo(() => new Set(cards.slice(0, FIRST_CARDS).map((e) => e.key)), [cards])
  const isDrawn = (key: string) => drawn.has(key) || firstCards.has(key)

  useEffect(() => {
    const present = new Set(cards.map((e) => e.key))
    if ([...drawn].some((k) => !present.has(k))) return setDrawn(new Set([...drawn].filter((k) => present.has(k))))
    const waiting = cards.filter((e) => !drawn.has(e.key) && !firstCards.has(e.key))
    if (!waiting.length) return
    const t = setTimeout(() => {
      let pick = waiting
      const view = page.current?.getBoundingClientRect()
      if (view) {
        const near = waiting.filter((e) => {
          const r = document.getElementById(`diff-${e.key}`)?.getBoundingClientRect()
          return !!r && r.bottom > view.top - 600 && r.top < view.bottom + 1200
        })
        if (near.length) pick = near
      }
      startTransition(() => setDrawn(adding(pick.slice(0, CARDS_PER_STEP).map((e) => e.key))))
    }, 16)
    return () => clearTimeout(t)
  }, [cards, drawn, firstCards, page])

  // The latest list for `drawAround`, so it stays one function across renders.
  const latest = useRef({ cards, drawn, firstCards })
  latest.current = { cards, drawn, firstCards }
  /** The card with this key and the next two, drawn whole now (a jump or a key is about to scroll to them). */
  const drawAround = useCallback((key: string) => {
    const { cards: list, drawn: d, firstCards: first } = latest.current
    const i = list.findIndex((e) => e.key === key)
    if (i < 0) return
    const keys = list.slice(i, i + 3).map((e) => e.key)
    if (keys.every((k) => d.has(k) || first.has(k))) return
    flushSync(() => setDrawn(adding(keys)))
  }, [])

  return { isDrawn, drawAround }
}
