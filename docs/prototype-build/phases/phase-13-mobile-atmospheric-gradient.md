# Phase 13 — Mobile atmospheric gradient & tuning lab

**Requirements covered:** P4, P8, N1, N2; PROGRESS conventions 12, 16 and 17  
**Depends on:** Phase 12. This is the final visual-sign-off phase. It must preserve Phase 12's
completed scenarios, presenter flow and documentation, updating only screenshots or visual notes
that are materially affected by the approved treatment.  
**Estimated:** 1 focused session.

## Goal

Elevate the Anaesthetist Mobile App with a subtle, brand-derived atmospheric background while
preserving the calm clinical hierarchy, white content surfaces, semantic status colours and
legibility already established at the end of Phase 11.

The phase also adds a **temporary, prototype-only Gradient Lab outside the phone frame**. It gives
the user live control over the gradient's colour, position, intensity, spread and falloff, making
visual tuning possible without editing code. The lab remains available for review until the user
chooses final values; it must be isolated behind one removable feature gate and must never appear
inside the proposed mobile product UI.

## Current-state findings (Phase 11 baseline)

- The 390×844 phone frame floats centred on the flat `phoneBackdrop` (`#E4E8E6`). The preview
  canvas already has demo-only zoom and Fit controls outside the device.
- Inside the phone, `MobileApp` and every mounted `SlideStack` layer paint the same flat
  `neutral.bg` (`#F6F8F7`). A gradient applied only to the root would therefore be hidden by the
  List detail and Card detail layers.
- Forward Lists, Availability, Balances and More use the neutral canvas with crisp white cards.
  List detail and Card detail add sticky/translucent chrome and dense white sections. These are
  strong structures to retain, but the large neutral areas currently have little visual depth.
- The six List-status colours and the success/warning/error colours already carry specific
  meaning. None of them may be repurposed as decorative gradient colours.

## Reference reading

The two supplied visual references use broad, low-contrast colour fields rather than a visible
"rainbow" or a hard linear blend:

1. A warm white canvas with a quiet cyan/mint wash, leaving content cards crisp and readable.
2. A white canvas with very pale lavender, cool blue and blush atmospheres, strongest around the
   upper portion of the screen and fading softly into neutral body space.

Those references are **technique and mood references only**. Their cyan/lavender palettes come
from unrelated products and are not colour sources for AA.

For AA, translate that treatment into the existing visual language:

- a neutral white/`neutral.bg` base;
- a broad accent-tint atmosphere derived from `accent.tint` (`#E1F0ED`);
- a quieter identity atmosphere derived from `brand.tint` (`#F7E7EC`);
- no saturated crimson, no new decorative palette, and no semantic status colour in the
  background.

`brand.tint` is allowed here only as a very weak identity atmosphere. The hard rule still holds:
AA crimson is never an action colour or a status colour, and deep teal remains the only action
colour.

## Design-led default selection

Before choosing the checked-in defaults, the implementation session must explicitly use the
available **front-end design skill** (or the workspace's equivalent visual-design workflow). That
skill must read `docs/design/Design Language.dc.html`, inspect the AA mobile reference pages and
evaluate the treatment on the running app. It must not infer the palette from the supplied
random-app screenshots.

Use the Gradient Lab to compare a small set of deliberate AA variants on real screenshots, then
choose one default based on hierarchy, restraint and continuity across Forward Lists,
Availability, Balances, More, List detail and Card detail. The final choice should be a visual
judgement grounded in the AA design language, not the unreviewed output of a numeric formula. If
the named skill is unavailable, state that in the phase handoff and perform the same browser-led
comparison explicitly.

## Requirements

### G1. One continuous in-phone atmosphere

- Add one shared mobile-canvas background used by every mobile tab and every depth of the Lists
  stack.
- The atmosphere must cover the full 390×844 logical device canvas, including the area behind the
  status bar, scrolling content, bottom navigation and sticky actions.
- It must stay fixed to the device canvas while content scrolls. It must not repeat, jump, reveal a
  flat seam, or restart when pushing/popping `ForwardLists → List detail → Card detail`.
- The phone's outer `#E4E8E6` preview backdrop, device bezel, Dynamic Island and desktop/web/admin
  apps remain unchanged.

### G2. Brand-derived default composition

Implement a CSS-only composition with a neutral base and at least two independent soft radial
fields:

- **Accent field:** very pale teal/mint, broad, initially anchored near the upper-left or
  upper-centre.
- **Identity field:** much quieter pale blush, initially anchored near the upper-right.
- **Neutral fade:** the lower body returns gently toward `neutral.bg`/white so long forms remain
  calm.

The checked-in default should read as white at first glance and reveal colour only on a second
look. Start the design pass from this AA-specific recipe, then use the front-end design skill and
Gradient Lab to refine it:

- **Base:** `neutral.bg` (`#F6F8F7`).
- **Accent field:** `accent.tint` (`#E1F0ED`), about 85% layer opacity, anchor `12% / -8%`,
  horizontal/vertical spread about `105% / 72%`, fading fully by about 70%.
- **Identity field:** `brand.tint` (`#F7E7EC`), about 70% layer opacity, anchor `96% / 2%`,
  spread about `82% / 64%`, fading fully by about 72%.
- **Lower neutral return:** begin around 46% of the canvas and settle back to `neutral.bg` by
  about 92%.

These opacity values apply to the already-pale tint tokens, not the saturated base colours.
Equivalent implementations using `accent.base`/`brand.base` require much lower alpha. Do not
combine low-alpha values with the tint tokens so aggressively that the effect becomes
imperceptible. The final values must be recorded in PROGRESS with the visual rationale.

Do not use a raster image, canvas, video, noise texture, animated colour drift or a saturated
linear gradient. The background must be deterministic and cheap to render.

### G3. Content hierarchy stays intact

- Existing cards, form sections, List rows, chips, sheets and dialogs remain white or near-white
  content surfaces. This phase is not a component redesign.
- Preserve existing borders, elevations, radii, spacing, typography and action treatments unless
  a small translucency adjustment is required to make fixed/sticky chrome sit naturally over the
  atmosphere.
- Bottom navigation and sticky action/footer chrome may use the existing translucent-white +
  backdrop-blur pattern. Avoid obvious opaque strips or a gradient "cut line".
- Keep dense Card detail/BTM content exceptionally legible. Decorative colour must never compete
  with patient identity, clinical details, fees, warnings or primary actions.
- Do not tint status blocks, status rails, action buttons, form fields, modal sheets or completion
  feedback.

### G4. Tokenised, bounded and easy to remove

- Add a typed `MobileGradientConfig` (or equivalent) in the theme/shell layer, not the domain
  model or Zustand business store.
- Use named theme values/CSS custom properties for the committed defaults; do not scatter gradient
  strings or magic numbers through mobile screens.
- Derive committed colours from the existing neutral, `accent.tint` and `brand.tint` tokens.
  Existing Design Language tokens stay unchanged.
- Keep the atmospheric layer and its lab configuration independent of seeded data, the demo clock,
  audit and app persistence.
- Put all lab rendering behind one clearly named prototype feature gate so the controls can be
  removed after sign-off without touching mobile product components.

### G5. Accessibility and motion

- Body text, muted text, controls and status labels must retain their current readable contrast in
  every supported gradient setting shipped as a preset/default.
- No information may depend on the decorative gradient.
- The gradient is static. `prefers-reduced-motion` needs no special animation because there is no
  colour motion.
- Native form controls or fully labelled equivalents must make the lab keyboard-operable. Every
  slider shows its current numeric value and unit.

## Temporary Gradient Lab requirements

### L1. Location and separation

- Render a panel as a sibling of the scaled phone inside `PhoneFrame`'s outer preview canvas. It
  must not be a child of `MobileApp`, inherit phone scaling, consume the phone's 390×844 layout
  space or appear in mobile screenshots cropped to the device.
- Keep the phone visually centred. Place the panel in the unused outer-canvas space and avoid the
  existing lower-right zoom/Fit toolbar.
- Label it clearly **Gradient Lab · temporary prototype control** so no audience mistakes it for
  proposed product UI.
- At widths where the full panel would overlap the phone, collapse it to a small outer-canvas
  button; opening it may overlay the grey preview canvas, but never the device viewport.

### L2. Live controls

Provide an immediately updating preview with:

- a master on/off switch for comparing gradient vs flat baseline;
- a global intensity multiplier;
- a base canvas colour;
- at least two independently enabled colour fields, each with:
  - colour picker plus editable hex value;
  - X and Y anchor position;
  - horizontal and vertical spread/radius;
  - opacity/intensity;
  - inner stop and fade/falloff (softness);
- a neutral lower-fade strength/position if the implementation uses one;
- a compact live swatch or miniature gradient preview;
- the exact current numeric value and unit beside every range control.

The lab may accept arbitrary experimental colours, but the committed default/presets must remain
inside the AA palette described in G2. Warn visually when an experimental colour or intensity is
outside the recommended brand envelope; do not silently clamp the user's experiment.

### L3. Tuning workflow

- Changes apply instantly to the live phone on all four tabs and every Lists stack depth.
- Preserve the current lab values while navigating between screens.
- Persist the temporary configuration to a dedicated versioned localStorage key so a browser
  refresh does not lose the user's tuning session. This key must be separate from domain
  persistence and unaffected by Reset demo data.
- Include **Reset to AA default**, **Copy configuration** and **Copy CSS** actions. Copy
  configuration should emit a stable, readable JSON object suitable for pasting back into a
  review message; Copy CSS should emit the computed gradient declaration/custom-property values.
- Give successful copy/reset actions brief, non-blocking feedback.
- Keep the panel's open/collapsed state as prototype convenience state, not domain state.

### L4. Safety and maintainability

- The lab only controls decorative background variables. It must not expose or mutate status
  colours, action colours, text colours, domain state, card opacity or billing/scheduling data.
- Invalid hex/numeric entry keeps the last valid preview value and shows an inline validation
  message.
- Use React state plus CSS custom properties; no new state-management or colour-picker dependency.
- The panel must not introduce horizontal page scrolling, cover the harness app switcher, trap
  focus or interfere with phone/zoom pointer input.

## Implementation seam

The expected seam is:

1. a typed default configuration + serializer/validator in `src/theme/` or a small
   `src/shell/gradientLab/` module;
2. a single fixed atmospheric layer/custom-property owner inside the device shell;
3. transparent/shared-canvas mobile roots and `SlideStack` layers so the owner remains visible;
4. a prototype-only `GradientLab` sibling beside the scaled device in `PhoneFrame`;
5. targeted tests for config validation/serialisation and Playwright coverage for the tuning
   controls and mobile depth transitions.

This is guidance, not permission to reorganise unrelated shell or mobile code.

## Out of scope

- Web App, Admin App, Xero/integration/demo-control surfaces and the grey outer preview backdrop.
- Dark mode, a user-facing theme picker, gradient animation, textures, illustrations or new brand
  colours.
- Redesigning cards, typography, spacing, navigation, status language, clinical/billing forms or
  domain behaviour.
- Shipping the Gradient Lab as production/product UI. It is prototype chrome retained only until
  the user has selected and signed off the final values.

## Automated verification

- Add unit tests for config defaults, validation, serialisation and localStorage fallback where
  practical.
- Add Playwright coverage proving that:
  - the lab is outside the device and does not inherit phone scaling;
  - changing each field updates the phone's computed custom properties/background;
  - values survive tab/depth navigation and refresh;
  - Reset returns exactly to the AA default;
  - flat comparison disables only the atmosphere;
  - copy actions produce stable content;
  - narrow layouts collapse the panel without overlapping the device or zoom/Fit controls.
- Keep `npm run build`, full Vitest, oxlint and the existing Playwright suite green.

## Manual test checklist

- [ ] At Fit, 100% and 130%, the phone remains centred; the Gradient Lab and zoom/Fit toolbar stay
      usable and do not overlap the device.
- [ ] Tune both colour fields (colour, X/Y, spread, opacity and falloff) and global intensity;
      changes are immediate, smooth and visibly affect only the in-phone background.
- [ ] Navigate Lists → List detail → Card detail and back: one continuous atmosphere, with no
      white flash, seam, gradient restart or broken slide-stack parallax.
- [ ] Check Forward Lists, Availability, Balances and More at the top and after scrolling: the
      treatment is subtle, cards remain crisp, text is clear, and fixed chrome has no hard cut.
- [ ] Open a bottom sheet, validation warning, completion overlay and dense BTM capture section:
      semantic/status colours and action hierarchy remain unchanged.
- [ ] Refresh: tuning values persist. Reset demo data: tuning values remain. Reset to AA default:
      the exact checked-in configuration returns.
- [ ] Copy configuration and Copy CSS both produce readable, reusable values and brief success
      feedback.
- [ ] At a narrow desktop viewport the full lab collapses outside the phone; keyboard-only use can
      open it, change every control, copy/reset and close it without a focus trap.
- [ ] Toggle the atmosphere off/on and compare with the Phase 11 flat baseline. The approved
      default adds depth without becoming the first thing the eye notices.
- [ ] Existing mobile interactions, full Playwright suite, Vitest, oxlint and production build all
      remain green and the console is clean.

## Adversarial review (after build)

After the checklist and automated verification are green, run the standard PROGRESS convention 18
review-and-fix pass with three independent lenses:

- **visual quality/accessibility:** subtlety, contrast, continuity, sticky/sheet treatment and
  narrow-layout behaviour;
- **bugs/correctness:** config validation/persistence, field updates, reset/copy, scaling and
  slide-stack coverage;
- **plan adherence:** no domain changes, no status-token drift, no web/admin changes, temporary
  controls isolated behind one removable gate.

Independently verify every finding, fix confirmed issues, re-green the suite and record the pass.

## PROGRESS.md updates

Mark Phase 13 DONE with the final approved default values, the Gradient Lab persistence key and
feature-gate location, screenshots/viewport checks run, tests added, review findings fixed and any
remaining sign-off note. Close out the phase table only after the final visual treatment is
approved.
