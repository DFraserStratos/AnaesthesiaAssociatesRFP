"""svgkit: shared building blocks for explainer diagrams (SVG).

Import it from a generator script:

    import sys; sys.path.insert(0, "<repo>/requirements-board/agent/skills/svg-diagram")
    from svgkit import *

    d = Diagram(1600, 900)
    d.panel(20, 20, 500, 860, BLUE, BLUE_S)
    d.heading(38, 58, "Procedure Master List")
    ...
    d.save("out.svg")

Every helper appends raw SVG to the diagram. Coordinates are absolute pixels. Nothing is measured
for you: SVG cannot measure text, so render the PNG (render.mjs) and look at it.
"""

FONT = "'Schibsted Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif"

# ---- palette: fill, stroke (and text where it has one) ----
PAGE = "#F3F6FA"                       # page background
INK, MUTED, LIGHT = "#1B1B1F", "#55555E", "#D7D7DE"   # body text, secondary text, text on charcoal
CHAR, CHAR_S = "#2E2E31", "#55555C"   # dark "hero" panel and its inner strokes
BLUE, BLUE_S = "#E1F0FB", "#A9C3DA"   # list / master-data panel
SUB, SUB_S = "#F3F7FB", "#A9BCD0"     # nested sub-box inside a panel
GRN, GRN_S, GRN_T = "#E9F5EC", "#9FD0AE", "#1D6B3B"   # group box; also "RVG-style" / defaults
PEACH, PEACH_S = "#FFE9C2", "#E9AE45" # the leaf item (a procedure)
LAV, LAV_S = "#EEE9FC", "#C7BAF0"     # contracts / a side column
YEL, YEL_S = "#FFF5C4", "#EFD46A"     # notes, callouts, the bottom summary bar
CARD_S = "#D3DCE6"                    # white card outline
CHIP, CHIP_T = "#E6E5EC", "#3C3C46"   # neutral chip (a value's kind, e.g. "Fixed price")
GOOD_F, GOOD_T = "#CDE8FA", "#1B5C8A" # positive state pill ("Yes, with reason")
LOCK_F, LOCK_T = "#D9D9E0", "#3C3C46" # negative / locked state pill
UNITS_F, UNITS_S, UNITS_T = "#C4EDD2", "#8FCBA2", "#1D6B3B"  # pricing pill: RVG units × rate
PERSON_F, PERSON_S, PERSON_T = "#FFE1C4", "#F0A868", "#9A4A0B"  # payer pill: a person pays (patient)
INSURER_F, INSURER_S, INSURER_T = "#DDE3F4", "#9AA9D6", "#2E3F7A"  # payer pill: an insurer pays
HOSPITAL_F, HOSPITAL_S, HOSPITAL_T = "#D3EFEC", "#7CC6BE", "#0D5F57"  # payer pill: a hospital pays
WIN = "#2E9E5B"                       # highlight: the winning cell, the rule that applied
ACCENT = "#3B8FD6"                    # numbered step circles, flow chevrons
TREE = "#2E2E31"                      # tree connector lines

# Category colours for things that come in kinds (fill, stroke, shadow, tag fill, tag text).
# Use one per kind, never two kinds in one colour family.
KIND = {
    "green":    ("#E9F5EC", "#8FCBA2", "#D2EBDA", "#C4EDD2", "#1D6B3B"),
    "lavender": ("#EEE9FC", "#B9AAEE", "#DCD3F7", "#DDD4FA", "#4B3A8C"),
    "rose":     ("#FCEAF2", "#E2A3C4", "#F3D3E3", "#F8D4E6", "#93305F"),
}

PAD = 14   # minimum gap between a box's edge and anything inside it


class Diagram:
    def __init__(self, width, height, title="Diagram", top_crop=0):
        """top_crop: pixels to cut from the top (the viewBox starts there), e.g. to drop a title band."""
        self.W, self.H, self.top_crop = width, height, top_crop
        self.out = []
        self.title = title
        self.rect(0, 0, width, height, PAGE, r=0)

    # ---------- primitives ----------
    def raw(self, s):
        self.out.append(s)

    def rect(self, x, y, w, h, fill, stroke=None, r=10, sw=1.2, dash=None, id=None):
        st = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
        d = f' stroke-dasharray="{dash}"' if dash else ""
        i = f' id="{id}"' if id else ""
        self.raw(f'<rect{i} x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"{st}{d}/>')

    def text(self, x, y, s, size=14, weight=400, fill=INK, anchor="start", style=""):
        fs = f' font-style="{style}"' if style else ""
        self.raw(f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{fill}" '
                 f'text-anchor="{anchor}"{fs}>{esc(s)}</text>')

    def lines(self, x, y, rows, size=12.5, lh=16, **kw):
        """Several lines of text. Wrap by hand: keep lines short enough for the box."""
        for i, s in enumerate(rows):
            self.text(x, y + i * lh, s, size=size, **kw)

    def path(self, d, color=TREE, w=2.5, dash=None):
        da = f' stroke-dasharray="{dash}"' if dash else ""
        self.raw(f'<path d="{d}" stroke="{color}" stroke-width="{w}" fill="none" '
                 f'stroke-linecap="round" stroke-linejoin="round"{da}/>')

    def pill(self, cx, y, w, label, fill, color, size=12, h=24, stroke=None, dash=None, weight=600):
        """Rounded tag centred on cx."""
        self.rect(cx - w / 2, y, w, h, fill, stroke, r=h / 2, dash=dash)
        self.text(cx, y + h / 2 + size * 0.36, label, size=size, weight=weight, fill=color, anchor="middle")

    def badge_number(self, cx, cy, n, fill=ACCENT, r=12):
        self.raw(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}"/>')
        self.text(cx, cy + r * 0.42, str(n), size=r * 1.1, weight=800, fill="#FFFFFF", anchor="middle")

    def down_arrow(self, x, y0, y1, color=MUTED):
        """Short vertical arrow drawn as line + triangle (markers render unreliably)."""
        self.raw(f'<path d="M{x} {y0} V{y1 - 7}" stroke="{color}" stroke-width="1.8"/>'
                 f'<path d="M{x - 6} {y1 - 8} L{x + 6} {y1 - 8} L{x} {y1} z" fill="{color}"/>')

    def chevron(self, cx, cy, fill=ACCENT):
        """Flow marker between two cards in a left-to-right sequence."""
        self.raw(f'<circle cx="{cx}" cy="{cy}" r="15" fill="{fill}"/>')
        self.path(f"M{cx - 4} {cy - 7} L{cx + 4} {cy} L{cx - 4} {cy + 7}", color="#FFFFFF", w=2.5)

    # ---------- components ----------
    def panel(self, x, y, w, h, fill, stroke=None, r=12, id=None):
        """A full-height column panel (blue list, charcoal hero, lavender side column). `id` names it
        for an artifact region's anchor (`#id`)."""
        self.rect(x, y, w, h, fill, stroke, r=r, id=id)

    def heading(self, x, y, s, size=29, fill=INK, sub=None, sub_fill=MUTED):
        """Panel heading with an optional list of subtitle lines below it."""
        self.text(x, y, s, size=size, weight=800, fill=fill)
        if sub:
            self.lines(x, y + 26, sub, size=14, lh=18, fill=sub_fill)

    def card(self, x, y, w, h, title=None, number=None, id=None):
        """White card with optional numbered title (stage cards in a flow)."""
        self.rect(x, y, w, h, "#FFFFFF", CARD_S, r=14, id=id)
        if number is not None:
            self.badge_number(x + 34, y + 36, number, r=16)
        if title:
            self.text(x + (60 if number is not None else 18), y + 44, title, size=21, weight=800)

    def stacked_group(self, x, y, w, h, kind, title, tag=None, id=None):
        """A card that reads as 'one of a stack': offset shadow, kind colour, left stripe, title, and
        an optional right-aligned note (e.g. when the group is shown). tag = label or (label, width)."""
        fill, stroke, shadow, tf, tt = KIND[kind]
        self.rect(x + 5, y + 5, w, h, shadow, r=10)
        self.rect(x, y, w, h, fill, stroke, r=10, sw=1.4, id=id)
        self.rect(x, y + 10, 6, h - 20, stroke, r=3)
        self.text(x + 20, y + 29, title, size=18, weight=700)
        if tag:   # plain right-aligned text, not a pill: the rows already carry many pills
            label = tag[0] if isinstance(tag, tuple) else tag
            self.text(x + w - PAD - 4, y + 29, label, size=13.5, weight=500, fill="#2E2E36", anchor="end")

    def table_header(self, x, y, w, columns, dividers, fill="#3D3D42"):
        """Dark header band. columns = [(x, label, anchor)], dividers = [x, ...]."""
        self.rect(x, y, w, 32, fill, CHAR_S, r=8)
        for cx, label, anchor in columns:
            self.text(cx, y + 21, label, size=12.5, weight=700, fill="#E4E4EA", anchor=anchor)
        for dx in dividers:
            self.path(f"M{dx} {y + 7} V{y + 25}", color="#66666E", w=1)

    def table_row(self, x, y, w, dividers, stroke="#DAD1F5", h=36):
        """White row with faint column dividers aligned to the header. Fill the cells yourself."""
        self.rect(x, y, w, h, "#FFFFFF", stroke, r=7)
        for dx in dividers:
            self.path(f"M{dx} {y + 7} V{y + h - 7}", color="#E3E0EC", w=1)

    def step(self, x, y, w, n, title, body=None, chip=None, h=None, id=None):
        """Numbered step card. chip = (label, fill, stroke) shown at the right."""
        h = h or (50 if not body else 40 + 17 * len(body))
        self.rect(x, y, w, h, "#FFFFFF", "#DCD3F5", r=9, id=id)
        self.badge_number(x + 24, y + 24, n)
        self.text(x + 46, y + 29, title, size=15.5, weight=700)
        if chip:
            label, cf, cs = chip
            cw = 9 * len(label) + 18
            self.rect(x + w - PAD - cw, y + 11, cw, 26, cf, cs, r=6, sw=1.4)
            self.text(x + w - PAD - cw / 2, y + 29, label, size=14, weight=600, anchor="middle")
        if body:
            self.lines(x + 46, y + 50, body, size=12.5, lh=17, fill=MUTED)
        return y + h + 10

    def aside(self, x, y, lines, w=200, title=None, lead=None, id=None, size=13.5, lh=18):
        """A note: an open square bracket with muted italic text beside it, no box or fill. Use it
        for every note (a caveat, a "may happen", a "good to know"), so a note never reads as a
        step. lead = (x, y), the point on the thing it annotates (usually a card's bottom or side
        edge): a dotted leader runs from there straight to the middle of the bracket's side,
        vertical then horizontal, never into a corner. Keep lead x at least 16px left of x so the
        turn shows. `id` names an invisible box round the note for an artifact region.
        Returns the bottom y."""
        rows = ([title] if title else []) + list(lines)
        h = len(rows) * lh + 22
        mid = y + h / 2
        if lead:
            lx, ly = lead
            self.path(f"M{lx} {ly} V{mid} H{x}", color=MUTED, w=1.4, dash="2 4")
        if id:
            self.rect(x, y, w, h, "none", id=id, r=0)
        self.path(f"M{x + 10} {y} H{x} V{y + h} H{x + 10}", color=MUTED, w=1.6)
        for i, s in enumerate(rows):
            bold = 700 if (title and i == 0) else 400
            self.text(x + 16, y + 22 + i * lh, s, size=size, weight=bold, fill=MUTED, style="italic")
        return y + h

    def note(self, x, y, w, h, title, body, bullets=False, id=None):
        """Yellow callout. Legacy (the reference diagrams use it): for new notes use `aside`."""
        self.rect(x, y, w, h, YEL, YEL_S, r=9, id=id)
        self.text(x + PAD, y + 26, title, size=15, weight=700)
        for i, s in enumerate(body):
            if bullets:
                self.text(x + PAD, y + 50 + 19 * i, "•", size=13)
            self.text(x + PAD + (12 if bullets else 0), y + 50 + 19 * i, s, size=13)

    def bottom_bar(self, y, parts):
        """Full-width yellow summary bar. parts = [(bold label, plain text), ...] joined by a middot."""
        self.rect(20, y, self.W - 40, 40, YEL, YEL_S, r=10)
        spans = []
        for i, (label, rest) in enumerate(parts):
            sep = '<tspan dx="14">·</tspan><tspan dx="14"' if i else '<tspan'
            spans.append(f'{sep} font-weight="800">{esc(label)}</tspan> {esc(rest)}')
        self.raw(f'<text x="{self.W / 2}" y="{y + 27}" font-size="19" fill="{INK}" text-anchor="middle">'
                 + "".join(spans) + "</text>")

    # ---------- tree (body section > subgroup > leaf) ----------
    def tree_section(self, y, title, subgroups, trunk_x=40, x=56, w=372, leaf_w=244):
        """Green section box ticked off a trunk, with pale subgroup boxes and peach leaves.
        subgroups = [(name, [leaf, ...])]. Returns (bottom y, {leaf: mid y})."""
        sy = y + 44
        subs, mids = [], {}
        for sname, leaves in subgroups:
            sh = 36 + 32 * len(leaves) + 6
            subs.append((sy, sh, sname, leaves))
            sy += sh + 8
        h = sy - y + 2
        self.rect(x, y, w, h, GRN, GRN_S, r=10)
        self.path(f"M{trunk_x} {y + 26} H{x + 14}")
        self.text(x + 20, y + 33, title, size=21, weight=800)
        sub_trunk = x + 26
        self.path(f"M{sub_trunk} {y + 42} V{subs[-1][0] + 22}")
        for gy, gh, sname, leaves in subs:
            self.rect(x + 40, gy, w - 52, gh, SUB, SUB_S, r=8)
            self.path(f"M{sub_trunk} {gy + 22} H{x + 56}")
            self.text(x + 60, gy + 28, sname, size=18, weight=800)
            p_trunk = x + 76
            self.path(f"M{p_trunk} {gy + 34} V{gy + 36 + 32 * (len(leaves) - 1) + 14}", w=2.2)
            for i, leaf in enumerate(leaves):
                py = gy + 36 + 32 * i
                self.path(f"M{p_trunk} {py + 14} H{x + 102}", w=2.2)
                self.rect(x + 102, py, leaf_w, 28, PEACH, PEACH_S, r=7, sw=1.6)
                self.text(x + 114, py + 19.5, leaf, size=15.5)
                mids[leaf] = py + 14
        return y + h, mids

    def tree_collapsed(self, y, label, trunk_x=40, x=56, w=372):
        """Grey collapsed section row ticked off the trunk. Returns the next y."""
        self.rect(x, y, w, 28, "#E6E8EC", "#B9BEC6", r=8)
        self.path(f"M{trunk_x} {y + 14} H{x}")
        self.text(x + 12, y + 19.5, label, size=15, weight=700, fill="#6E7580")
        return y + 36

    def tree_trunk(self, top, last_tick_y, trunk_x=40):
        """Draw the trunk last. Start it above the first tick so the list implies a parent."""
        self.path(f"M{trunk_x} {top} V{last_tick_y}")

    # ---------- output ----------
    def svg(self):
        c = self.top_crop
        head = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 {c} {self.W} {self.H - c}" '
                f'width="{self.W}" height="{self.H - c}" font-family="{FONT}">'
                f'<title>{esc(self.title)}</title>')
        return head + "\n" + "\n".join(self.out) + "\n</svg>\n"

    def save(self, path):
        with open(path, "w") as f:
            f.write(self.svg())


def esc(s):
    """Escape text for SVG. Pass plain text; & < > are handled here."""
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
