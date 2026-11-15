/**
 * PLAN D4: TypeScript never sees aa-prototype source. Every `@proto/...` import is typed `any`;
 * only Vite resolves the alias (vite.config.ts). Do not add `@proto` to tsconfig `paths`.
 */
declare module '@proto/*'

/**
 * The one prototype module the preview kit leans on, typed just enough for its keys
 * (still loose elsewhere). Mirrors aa-prototype/src/apps/demo/catalogue/CatalogueKit.tsx.
 */
declare module '@proto/apps/demo/catalogue/CatalogueKit.tsx' {
  import type { ReactNode } from 'react'
  type GroupId = 'shadcn' | 'sonner' | 'tanstack' | 'forms' | 'daypicker' | 'recharts' | 'numberflow' | 'motion' | 'custom'
  export const LIBRARY_GROUPS: Record<GroupId, { title: string; blurb: string }>
  export type LibraryGroupId = GroupId
  export function CataloguePage(props: { title: string; intro: string; children: ReactNode }): ReactNode
  export function LibraryGroup(props: { id: GroupId; children?: ReactNode }): ReactNode
  export function CatalogueRow(props: any): ReactNode
  export function WebStage(props: { height?: number; children: ReactNode }): ReactNode
  export function MobileStage(props: { height: number; children: ReactNode }): ReactNode
  export function StageHint(props: { children: ReactNode }): ReactNode
}
