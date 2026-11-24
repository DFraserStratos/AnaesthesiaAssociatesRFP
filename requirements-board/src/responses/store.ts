/**
 * The reader's responses in a snapshot, kept in browser storage under the project's key
 * (`responsesKey`). Read once the snapshot names its project (`useHydrateResponses`), written on every
 * change, and read again when another tab of the same snapshot changes them.
 */
import { useEffect } from 'react'
import { create } from 'zustand'
import { readJson, writeJson } from '../storage.ts'
import { useCatalogue } from '../store.ts'
import { EMPTY_RESPONSES, isEmptyResponse, responsesKey, responsesShape, type Reader, type ReaderResponse, type ResponsesData } from './model.ts'

interface ResponsesState extends ResponsesData {
  /** The storage key these responses were read from; null until the snapshot has loaded. */
  key: string | null
  hydrate: (key: string) => void
  setReader: (reader: Partial<Reader>) => void
  /** Add a response, or replace the one with its ID. One that says nothing is removed instead. */
  put: (r: Omit<ReaderResponse, 'at' | 'snapshotCommit'>) => void
  remove: (id: string) => void
  clear: () => void
}

const LABEL = 'responses to this snapshot'
const read = (key: string) => readJson(key, LABEL, { reader: { ...EMPTY_RESPONSES.reader }, responses: [] }, responsesShape)

export const useResponses = create<ResponsesState>((set, get) => {
  const save = (next: ResponsesData) => {
    const { key } = get()
    set(next)
    if (key) writeJson(key, { reader: next.reader, responses: next.responses })
  }
  return {
    ...EMPTY_RESPONSES,
    key: null,
    hydrate(key) {
      set({ key, ...read(key) })
    },
    setReader(reader) {
      const s = get()
      save({ reader: { ...s.reader, ...reader }, responses: s.responses })
    },
    put(r) {
      const s = get()
      const rest = s.responses.filter((x) => x.id !== r.id)
      if (isEmptyResponse(r)) return save({ reader: s.reader, responses: rest })
      const full: ReaderResponse = { ...r, snapshotCommit: useCatalogue.getState().snapshot?.commit ?? null, at: new Date().toISOString() }
      const at = s.responses.findIndex((x) => x.id === r.id)
      const responses = at < 0 ? [...s.responses, full] : s.responses.map((x) => (x.id === r.id ? full : x))
      save({ reader: s.reader, responses })
    },
    remove(id) {
      const s = get()
      save({ reader: s.reader, responses: s.responses.filter((x) => x.id !== id) })
    },
    clear() {
      save({ reader: get().reader, responses: [] })
    },
  }
})

/** Read the responses once the snapshot has loaded, and again whenever another tab changes them. */
export function useHydrateResponses() {
  const project = useCatalogue((s) => s.snapshot?.project)
  useEffect(() => {
    if (project === undefined) return
    const key = responsesKey(project)
    useResponses.getState().hydrate(key)
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) useResponses.getState().hydrate(key)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [project])
}

/** The reader's responses about one record, oldest first. */
export function useResponsesFor(type: ReaderResponse['target']['type'], id: string): ReaderResponse[] {
  const all = useResponses((s) => s.responses)
  return all.filter((r) => r.target.type === type && r.target.id === id)
}

/** A new response's ID. */
export const newResponseId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `r-${Date.now()}-${Math.round(Math.random() * 1e9)}`)
