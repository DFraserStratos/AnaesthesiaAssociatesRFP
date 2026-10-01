import { create } from 'zustand'

/**
 * Per-trigger memory that "Replay" needs (catch-up Phase 14). Shared across
 * screens, so a message fired on Mobile Lists can be replayed from Admin
 * Integrations. Not persisted: a reload forgets it, and a replay against an
 * entity a reset removed refuses with a readable message.
 */
export interface DemoTriggerMemory {
  /** The last hospital message fired. */
  lastMessageId: string | null
  /** The last payment webhook sent, replayed with the same key. */
  lastWebhook: { accRecId: string; key: string; amount: number } | null
  /** Webhook key counter, the `<n>` in `WEBHOOK-<accRecId>-<n>`. */
  webhookCounter: number
  rememberMessage: (id: string) => void
  rememberWebhook: (webhook: { accRecId: string; key: string; amount: number }, n: number) => void
}

/** A UI-only store of its own, written only through its actions. */
export const useDemoTriggerMemory = create<DemoTriggerMemory>((set) => ({
  lastMessageId: null,
  lastWebhook: null,
  webhookCounter: 0,
  rememberMessage: (id) => set({ lastMessageId: id }),
  rememberWebhook: (webhook, n) => set({ lastWebhook: webhook, webhookCounter: n }),
}))
