/** The RequestCover dialog target — offer (own free session) or request (a colleague's). */
export interface CoverTarget {
  listId: string
  personName: string
  slotLabel: string
  kind: 'offer' | 'request'
  targetAnaesthetistId?: string
}
