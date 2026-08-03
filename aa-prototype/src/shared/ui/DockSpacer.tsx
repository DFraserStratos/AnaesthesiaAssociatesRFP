/**
 * The tail of a mobile scroller whose dock or tab bar floats OVER it.
 *
 * Every mobile scroll surface in the app has translucent chrome pinned across
 * its foot: the list detail's submit dock, the card's commit dock, the four-tab
 * bar. Content is meant to scroll under that frosted chrome, which is a
 * deliberate part of the design, so each scroller has to reserve enough room
 * below its last item for the chrome to cover nothing that matters.
 *
 * That reservation USED TO BE `padding-bottom`, and that is the bug this
 * component exists to kill. A scroll container's scrollable overflow is the
 * union of its own padding box and its descendants' overflow, so bottom padding
 * creates no scrollable extent of its own: it only shows up once the CONTENT
 * has already overflowed. When a screen's content stops just short of filling
 * the scroller, the reservation silently evaporates, the last item sits under
 * the dock, and there is nothing to scroll to bring it out.
 *
 * Measured on the St George's AM list (5 cards, 402x874, iPhone 16 Pro insets),
 * where "Add a card" was permanently stranded behind the dock:
 *
 *     engine      clientHeight   scrollHeight   scrollable
 *     WebKit 26.5      639            639            0     <- unreachable
 *     Chromium         639            715           76
 *
 * The two engines disagree on whether trailing padding joins the scrollable
 * area, and WebKit has the better reading of the spec. Either way the layout
 * was relying on the generous one, so the demo broke on the only engine the
 * installed app ever runs on.
 *
 * An in-flow spacer is the fix, and it is not a hack: the clearance becomes
 * real content, so it pushes the last item up and creates genuine scroll extent
 * in every engine. Use it INSTEAD of a bottom padding on the scroller, never as
 * well as one.
 *
 * `height` is whatever the padding said, less the flex `gap` where the scroller
 * has one, so the reserved space comes out identical to before.
 */
export function DockSpacer({ height }: { height: string }) {
  return <div aria-hidden data-testid="dock-spacer" style={{ flex: 'none', height }} />
}
