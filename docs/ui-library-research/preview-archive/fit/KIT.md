# Kit deviation from stock shadcn (base-nova)

How far each file in `src/components/ui/` sits from the stock shadcn base-nova output. Compared on
2026-11-12 against the live registry (`https://ui.shadcn.com/r/styles/base-nova/<name>.json`), after
stripping our `tw:` prefix and ignoring whitespace. Input to the per-row fit score (`index.ts`).

**Plumbing every file shares, not counted as deviation:** the `tw:` prefix, lucide icons in place of
the registry's `IconPlaceholder`, `@/components/ui` imports, `cn-*` registry hook classes dropped, and
`container={usePortalContainer()}` on every Portal (keeps popups inside the preview's styled scope).
Token renames (`bg-popover` to `bg-surface`, `text-muted-foreground` to `text-slate`, `ring-1` to
`border-line` + `shadow-e2`) are re-skinning, not bending.

**Scale:** 0 stock (plumbing only) · 1 re-skinned (classes, sizes and type changed inside the stock
variant set; at most one variant added) · 2 reshaped (variant API changed, a prop default changed, or
the library's enter/exit motion swapped for our named `aa-motion-*` patterns) · 3 rewritten (variant
table replaced wholesale, render logic changed, theme locked, or heavy `!` overrides fighting the
library).

| Component | Dev | What changed |
|---|---|---|
| accordion | 1 | Trigger 15/22 semibold ink, no hover underline, r-ctl focus shadow; chevron nudged 3px; panel text slate, links teal not underlined. |
| alert-dialog | 2 | Zoom/fade motion and blurred `bg-black/10` overlay swapped for `aa-motion-fade` + scrim; r-panel, e3, 24/28 padding, widths 440/360; footer no longer a muted band; title 18 bold. |
| alert | 2 | `success` and `warning` variants added; destructive becomes error tint/on-tint; r-ctl, 13/20 type, links teal. |
| avatar | 2 | New `variant` prop (`tint` web nav chip, `elevated` mobile white chip at e1); sizes up 32/40/24 to 36/44/28; crimson brand initials; badge green. |
| badge | 3 | Variant table replaced: stock default/secondary/destructive/ghost/link removed; 5 Pill tints plus 6 status chips (`private` to `free`) with a `::before` dot added; no fixed height. |
| breadcrumb | 1 | 13px slate, link hover teal, current page semibold ink, separator mist. |
| button-group | 1 | Text addon r-ctl, line border, semibold. Otherwise stock. |
| button | 3 | Every variant restyled (teal hover/pressed, destructive becomes an outline, link loses underline via `h-auto! p-0!`); `pill` variant and `cta` size (54px, r-card `!`) added; sizes rescaled 32 to 40 base, xs/sm/lg/icon all up; compound variants added; press translate and opacity-disable removed. |
| calendar | 2 | `buttonVariant` default ghost to outline; cell size 28 to 40, radius 10; caption 17 bold; day cells mono 13, today an inset teal ring, range middle teal tint; several `rounded-...!` overrides on day cells; weekday 10.5 mist. |
| card | 1 | r-card, line border + e1 in place of ring, spacing 16/12 to 20/16, title 17 semibold, footer surface not muted. |
| chart | 1 | Tooltip r-ctl, line border, e2, ink/slate text; axis ticks mist. Recharts wiring stock. |
| checkbox | 1 | Line-strong border on surface, focus shadow, white check (strokeWidth 3), field-label focus tweaks removed. |
| collapsible | 0 | Stock. |
| combobox | 2 | Slide/zoom motion swapped for `aa-motion-fade`; popup r-ctl line e2; items 6px radius, taller padding; group label 11px uppercase eyebrow; chips input 48 tall, chips pill 28px; teal chevron/check. |
| context-menu | 2 | Slide/zoom motion swapped for `aa-motion-fade`; popup r-ctl line e2; items 6px radius, py-2; label uppercase eyebrow; destructive uses error tint; shortcut mono. |
| dialog | 2 | Zoom/fade motion and blurred overlay swapped for `aa-motion-fade` + scrim; width 384 to min(520, 100%-48), max-h 86vh scroll; r-panel e3; footer muted band removed; title 18 bold with room for close. |
| drawer | 2 | `showSwipeHandle` default false to true (36px handle); timings 450/400ms to 320/260ms on `ease-sheet` plus `aa-motion-sheet`; no border, r-sheet, e3; max height 90%; header left aligned; footer pads for the home indicator (`--aa-inset-bottom`); nested-drawer dim removed. |
| dropdown-menu | 2 | Slide/zoom motion swapped for `aa-motion-fade`; popup r-ctl line e2; items 6px radius, py-2; label uppercase eyebrow; destructive error tint; sub-popup motion removed. |
| empty | 1 | r-card, line-strong dashed border, padding 32; icon 40 sunken; title 17 semibold; links teal. |
| field | 2 | FieldLabel turned into the prototype's 11px uppercase mist eyebrow via a long `not-has-[>[data-slot=field]]:` selector set (choice cards exempt); choice card checked state teal tint; error/description 12px; gap tightened. |
| hover-card | 2 | Slide/zoom motion swapped for `aa-motion-fade`; r-card, line, e2, padding 16. |
| input-group | 1 | Height 32 to 48, r-ctl, surface bg, focus shadow; addon padding up; inner control resets need `rounded-none!` and `shadow-none!` to undo our own input re-skin. |
| input | 1 | Height 32 to 48, 15px ink, r-ctl, line border, teal focus border + focus shadow, disabled sunken. |
| item | 1 | r-ctl, line/sunken variants, title semibold, description 13 slate. |
| kbd | 1 | Mono 11px, line border, sunken, 6px radius. |
| label | 1 | 13/16 semibold ink. |
| navigation-menu | 2 | Directional slide/scale motion (0.35s) removed: content fades on `ease-sheet` 240ms, popup uses `aa-motion-fade`; trigger 40 tall slate to ink, teal chevron; link 6px radius, active semibold. |
| pagination | 1 | Tabular numerals, active ink, ellipsis 40px mist. Links reuse the kit button. |
| popover | 2 | Slide/zoom motion swapped for `aa-motion-fade`; r-card, line, e2, padding 16; title 15 semibold, description 13 slate. |
| progress | 1 | Track 6px pill sunken; indicator pill with width transition on `ease-card`; value mono. |
| radio-group | 1 | Line-strong border on surface, focus shadow, white dot, field-label focus tweaks removed. |
| scroll-area | 0 | Stock. |
| select | 2 | Slide/zoom motion swapped for `aa-motion-fade`; trigger 32 to 48 (sm 28 to 32), 15px, r-ctl, teal chevron; popup r-ctl line e2; items py-2; label uppercase eyebrow; teal check. |
| separator | 0 | Stock. |
| sheet | 2 | Stock fade + 2.5rem slide replaced by `aa-motion-sheet` (bottom) or `aa-motion-fade` (other sides); side panels fixed 600px; bottom/top capped at 90% with r-sheet; header and footer become bordered bands (24px padding, footer right-aligned row); title 20 bold. |
| skeleton | 1 | r-ctl, sunken. |
| slider | 0 | Stock. |
| sonner | 3 | `next-themes` dropped and theme locked to `light`; radius fixed 14px, font forced; toast, title, description and action buttons all restyled through `!` overrides in `classNames`; typed icons coloured (success, warning, error, teal spinner). |
| spinner | 0 | Lucide `Loader2Icon` in place of the placeholder. Stock otherwise. |
| switch | 2 | Proportions reshaped to the iOS-style prototype switch: 52x32 track with 3px padding and 26px thumb (stock 32x18.4 and 16px); sm 36x22; unchecked line-strong; invalid as a 1px error ring. |
| table | 2 | `data-numeric` attribute added (right-aligned mono 12.5 cells and headers); headers become 10px bold uppercase mist on the page bg, 36 tall; rows 40 tall, line borders, selected teal tint; header row hover suppressed. |
| tabs | 3 | Both variants rewritten: `default` becomes the prototype segmented control (sunken r12 track, r9 white raised pill, 40 tall), `line` becomes ink-underline tab links via an inset shadow; the stock `::after` indicator and active-state classes removed; long `group-data-[variant=...]` selector chains. |
| textarea | 1 | Min-height 72, 15px ink, r-ctl, teal focus, `resize-none`, disabled sunken. |
| toggle-group | 3 | Render logic changed: the item's classes are chosen in JS by variant (`teal`, `outline`, default); group becomes a sunken r12 track with r9 cells (`rounded-[9px]!`), stock spacing/joined-edge rules removed; new `teal` variant (filled pressed cell). |
| toggle | 2 | `teal` variant added; pressed state teal tint and teal-pressed text in place of muted; sizes 32/28/36 to 40/32/48; slate at rest. |
| tooltip | 2 | Slide/zoom motion swapped for `aa-motion-fade`; ink bg, white 12 medium text, 8px radius, e2. |

**Totals:** 0 stock: 5 · 1 re-skinned: 17 · 2 reshaped: 19 · 3 rewritten: 5 (badge, button, sonner,
tabs, toggle-group). The motion swap alone is what lifts most popup components (popover, hover-card,
tooltip, menus, select, combobox) from 1 to 2.
