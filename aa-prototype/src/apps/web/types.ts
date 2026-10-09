/** The RequestCover dialog target — offer (own free session) or request (a colleague's). */
export interface CoverTarget {
  /** The open session (a Slot id; catch-up Phase 28). */
  slotId: string
  personName: string
  slotLabel: string
  kind: 'offer' | 'request'
  targetAnaesthetistId?: string
}
