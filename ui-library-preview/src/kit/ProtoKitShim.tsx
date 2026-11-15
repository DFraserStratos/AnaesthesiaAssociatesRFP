/**
 * PLAN D3: the prototype's catalogue pages import THIS module in place of their
 * own CatalogueKit (vite.config.ts kitSwap). It re-exports the preview kit
 * (src/kit/Kit.tsx) under the original kit's names; StageHint, WebStage,
 * MobileStage and LIBRARY_GROUPS stay the prototype's own.
 */
export { LIBRARY_GROUPS, WebStage, MobileStage, StageHint } from '@proto/apps/demo/catalogue/CatalogueKit.tsx'
export { CataloguePage, LibraryGroup, CatalogueRow } from './Kit'
export type { CatalogueRowProps } from './Kit'
