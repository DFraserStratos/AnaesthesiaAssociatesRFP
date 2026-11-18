/**
 * The admin flows' field chrome now lives in `shared/ui/fieldChrome.ts` (UI
 * unification U4). Re-exported here so the screens a later phase rebuilds
 * (the Billing monitor, Phase 37) keep compiling; new code uses `SelectField`.
 * A plain module (no components) so fast-refresh's only-export-components rule
 * stays clean.
 */
export { selectControlStyle, controlStyle } from '../../../shared/ui/fieldChrome'
