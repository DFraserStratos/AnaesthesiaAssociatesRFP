"""Technical view: how the system works out a price (pricing model v4), as a left-to-right flow."""
import sys

W, H = 1760, 1148
PAD = 14                     # minimum inner padding for every box
out = []
def a(s): out.append(s)

def rect(x, y, w, h, fill, stroke=None, r=10, sw=1.2, dash=None):
    st = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    d = f' stroke-dasharray="{dash}"' if dash else ""
    a(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"{st}{d}/>')

def text(x, y, s, size=14, weight=400, fill="#1B1B1F", anchor="start", style=""):
    fs = f' font-style="{style}"' if style else ""
    a(f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}"{fs}>{s}</text>')

def lines(x, y, rows, size=12.5, lh=16, **kw):
    for i, s in enumerate(rows):
        text(x, y + i * lh, s, size=size, **kw)

def pill(cx, y, w, label, fill, color, size=12, dash=None, stroke=None, h=24, weight=600):
    rect(cx - w / 2, y, w, h, fill, stroke, r=h / 2, dash=dash)
    text(cx, y + h / 2 + size * 0.36, label, size=size, weight=weight, fill=color, anchor="middle")

def down_arrow(x, y0, y1, color):
    a(f'<path d="M{x} {y0} V{y1 - 7}" stroke="{color}" stroke-width="1.8"/>'
      f'<path d="M{x - 6} {y1 - 8} L{x + 6} {y1 - 8} L{x} {y1} z" fill="{color}"/>')

INK, MUTED = "#1B1B1F", "#55555E"
PEACH, PEACH_S = "#FFE9C2", "#E9AE45"
LAV, LAV_S = "#EEE9FC", "#C7BAF0"
YEL, YEL_S = "#FFF5C4", "#EFD46A"
GRN, GRN_S, GRN_T = "#E9F5EC", "#9FD0AE", "#1D6B3B"
BLUE_T, BLUE_F = "#1B5C8A", "#CDE8FA"
LOCK_F, LOCK_T = "#D9D9E0", "#3C3C46"
CARD_S = "#D3DCE6"
WIN = "#2E9E5B"
ACCENT = "#3B8FD6"
# contract kinds (tag fill, tag text, stroke) and payers (fill, text, stroke), as in the selection diagram
KIND_TAG = {"RVG-style": ("#C4EDD2", "#1D6B3B", "#8FCBA2"),
            "Third party": ("#DDD4FA", "#4B3A8C", "#B9AAEE"),
            "First party": ("#F8D4E6", "#93305F", "#E2A3C4")}
PAYER = {"Patient": ("#FFE1C4", "#9A4A0B", "#F0A868"),
         "Insurer": ("#DDE3F4", "#2E3F7A", "#9AA9D6"),
         "Hospital": ("#D3EFEC", "#0D5F57", "#7CC6BE")}
def kind_pill(cx, y, label, w):
    f_, t_, s_ = KIND_TAG[label]
    pill(cx, y, w, label, f_, t_, size=11.5, h=22, stroke=s_)
def payer_pill(cx, y, label, w=84, h=22):
    f_, t_, s_ = PAYER[label]
    pill(cx, y, w, label, f_, t_, size=12, h=h, stroke=s_)

a(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 58 {W} {H - 58}" width="{W}" height="{H - 58}" '
  'font-family="\'Schibsted Grotesk\', \'Helvetica Neue\', Helvetica, Arial, sans-serif">')
a('<title>How the system works out a price</title>')
rect(0, 0, W, H, "#F3F6FA", r=0)

CW, GAP = 400, 40
XS = [20 + i * (CW + GAP) for i in range(4)]
IW = CW - 2 * 16              # inner content width
TOP, BOT = 78, 700

def card(i, title, sub):
    x0 = XS[i]
    rect(x0, TOP, CW, BOT - TOP, "#FFFFFF", CARD_S, r=14)
    a(f'<circle cx="{x0 + 34}" cy="{TOP + 36}" r="16" fill="{ACCENT}"/>')
    text(x0 + 34, TOP + 42, str(i + 1), size=16, weight=800, fill="#FFFFFF", anchor="middle")
    text(x0 + 60, TOP + 44, title, size=21, weight=800)
    lines(x0 + 18, TOP + 74, sub, size=13, lh=17, fill=MUTED)
    return x0 + 16

for i in range(3):
    cx = XS[i] + CW + GAP / 2
    a(f'<circle cx="{cx}" cy="{(TOP + BOT) / 2}" r="15" fill="{ACCENT}"/>')
    my = (TOP + BOT) / 2
    a(f'<path d="M{cx - 4} {my - 7} L{cx + 4} {my} L{cx - 4} {my + 7}" stroke="#FFFFFF" stroke-width="2.5" '
      'fill="none" stroke-linecap="round" stroke-linejoin="round"/>')

# ---------- 1 What goes in ----------
ix = card(0, "What goes in", ["Each procedure on a booking is priced on its own,", "from these inputs."])
rect(ix, 182, IW, 62, GRN, GRN_S, r=9)
text(ix + PAD, 207, "RVG group · H3 Moderate", size=15, weight=700)
text(ix + PAD, 229, "6 base units · 0 modifier units, as published", size=12.5, fill=MUTED)
down_arrow(ix + 34, 248, 276, MUTED)
text(ix + 50, 266, "the procedure inherits from its group", size=12, fill=MUTED, style="italic")
rect(ix, 280, IW, 62, PEACH, PEACH_S, r=9)
text(ix + PAD, 305, "Procedure · Face-lift", size=15, weight=700)
text(ix + PAD, 327, "Its own units are blank, so it inherits 6 and 0", size=12.5, fill=MUTED)
rect(ix, 358, IW, 134, LAV, LAV_S, r=9)
text(ix + PAD, 383, "Contract · Merivale Plastics", size=15, weight=700)
# three equal pills spread evenly across the box's inner width
PW = (IW - 2 * PAD - 2 * 14) / 3
px = [ix + PAD + PW / 2 + k * (PW + 14) for k in range(3)]
kind_pill(px[0], 395, "Third party", PW)
pill(px[1], 395, PW, "No, locked", LOCK_F, LOCK_T, size=11.5, h=22)
payer_pill(px[2], 395, "Patient", w=PW)   # who gets the invoice
lines(ix + PAD, 438, ["Chosen on the booking. Its holder decides who is",
                      "billed and whether the price can change. If none",
                      "applies: No contract (RVG), offered for every procedure."],
      size=12.5, lh=16, fill=MUTED)
rect(ix, 508, IW, 62, "#FFFFFF", "#9C9CA8", r=9, dash="5 4")
text(ix + PAD, 533, "Procedure date", size=15, weight=700)
text(ix + PAD, 555, "Picks the contract version valid on that day", size=12.5, fill=MUTED)
rect(ix, 586, IW, 98, "#FFFFFF", CARD_S, r=9)
text(ix + PAD, 611, "Recorded on the card", size=15, weight=700)
lines(ix + PAD, 633, ["Base, time and modifier units (BTM), plus a note",
                      "when modifiers are claimed. A typed price or",
                      "discount, with a reason, on adjustable contracts."], size=12.5, lh=16, fill=MUTED)

# ---------- 2 Find starting values ----------
ix = card(1, "Find starting values", ["Look down the layers. For each field, the first", "layer with a value wins."])
CELL_W, CELL_GAP = 60, 8
right_cell_cx = ix + IW - PAD - CELL_W / 2
cols = [(label, right_cell_cx - (2 - k) * (CELL_W + CELL_GAP)) for k, label in enumerate(["Base", "Modifier", "Fixed price"])]
for label, cx in cols:
    text(cx, 192, label, size=11.5, weight=700, fill="#8A8A96", anchor="middle")
layers = [("Contract line", "for Face-lift", LAV, LAV_S, ["–", "–", "$3,565"], [False, False, True]),
          ("Contract line", "for group H3", LAV, LAV_S, ["–", "–", "–"], [False, False, False]),
          ("Procedure", "Face-lift", PEACH, PEACH_S, ["–", "–", "n/a"], [False, False, False]),
          ("RVG group", "H3, always set", GRN, GRN_S, ["6", "0", "n/a"], [True, True, False])]
for i, (l1, l2, fill, stroke, vals, wins) in enumerate(layers):
    ly = 202 + 66 * i
    rect(ix, ly, IW, 58, fill, stroke, r=9)
    text(ix + PAD, ly + 25, f"{i + 1}  {l1}", size=13.5, weight=700)
    text(ix + PAD + 17, ly + 44, l2, size=12, fill=MUTED)
    for (label, cx), v, w in zip(cols, vals, wins):
        cy = ly + 13
        if w:
            rect(cx - CELL_W / 2, cy, CELL_W, 32, "#FFFFFF", WIN, r=7, sw=2)
            text(cx, cy + 21, v, size=13.5, weight=800, fill=GRN_T, anchor="middle")
        else:
            rect(cx - CELL_W / 2, cy, CELL_W, 32, "#FFFFFF", "#E2E2EA", r=7)
            text(cx, cy + 21, v, size=12.5, fill="#A8A8B2", anchor="middle")
down_arrow(ix + IW / 2, 470, 494, MUTED)
rect(ix, 500, IW, 60, "#FFFFFF", WIN, r=9, sw=2)
text(ix + PAD, 535, "Starting values", size=14.5, weight=800)
for (label, cx), v in zip(cols, ["6", "0", "$3,565"]):
    text(cx, 535, v, size=15, weight=800, fill=GRN_T, anchor="middle")
lines(ix + 2, 590, ["Blank means inherit; 0 is a value that stops the look.",
                    "Units are only starting values: the anaesthetist",
                    "can change them on the card.",
                    "A fixed price only ever comes from a contract line.",
                    "Dormant for now: contract unit rate, discount %."], size=12.5, lh=17, fill=MUTED)

# ---------- 3 Work out the price ----------
ix = card(2, "Work out the price", ["Top to bottom, the first rule that applies sets", "the price. Merivale stops at rule 2."])
rules = [("0", "Office override at review", ["The office's price, with a reason. Works even", "on a locked contract."], False),
         ("1", "Anaesthetist typed a price", ["Adjustable contracts only: No contract (RVG)", "or an anaesthetist's own price list."], False),
         ("2", "Contract has a fixed price", ["That price. The recorded BTM is kept for", "reference only."], True),
         ("3", "Otherwise, calculate", ["(Base + Time + Modifier) × the anaesthetist's", "own unit rate, less any discount % entered."], False)]
for i, (n, title, body, hit) in enumerate(rules):
    ry = 182 + 92 * i
    rect(ix, ry, IW, 82, "#F4FBF6" if hit else "#FFFFFF", WIN if hit else CARD_S, r=9, sw=2 if hit else 1.2)
    a(f'<circle cx="{ix + PAD + 12}" cy="{ry + 26}" r="12" fill="{WIN if hit else "#8A95A2"}"/>')
    text(ix + PAD + 12, ry + 31, n, size=13, weight=800, fill="#FFFFFF", anchor="middle")
    text(ix + PAD + 34, ry + 31, title, size=15, weight=700)
    lines(ix + PAD + 34, ry + 53, body, size=12.5, lh=16, fill=MUTED)
    if hit:
        text(ix + IW - PAD, ry + 31, "Merivale", size=13.5, weight=700, fill=GRN_T, anchor="end")
rect(ix, 556, IW, 128, YEL, YEL_S, r=9)
text(ix + PAD, 581, "Rejected, never guessed", size=15, weight=700)
lines(ix + PAD, 603, ["The booking is rejected for correction when:",
                      "• a price is typed on a locked contract",
                      "• BTM is missing and no fixed price applies",
                      "• the contract is not valid on the procedure date"], size=12.5, lh=17)

# ---------- 4 Bill it and keep a record ----------
ix = card(3, "Bill it, keep a record", ["The contract decides who gets the invoice."])
bills = [("No contract (RVG)", "the default contract", ["Patient"], False),
         ("Holder pays AA", "insurers, hospitals", ["Insurer", "Hospital"], False),
         ("Holder sets the price", "surgeon rooms, own price lists", ["Patient"], True)]
for i, (t1, t2, to, hit) in enumerate(bills):
    by = 166 + 68 * i
    rect(ix, by, IW, 58, "#F4FBF6" if hit else "#FFFFFF", WIN if hit else CARD_S, r=9, sw=2 if hit else 1.2)
    text(ix + PAD, by + 25, t1, size=14.5, weight=700)
    text(ix + PAD, by + 44, t2, size=12, fill=MUTED)
    for k, label in enumerate(reversed(to)):
        payer_pill(ix + IW - PAD - 42 - k * 92, by + 18, label)
rect(ix, 376, IW, 76, YEL, YEL_S, r=9)
text(ix + PAD, 401, "Patient: the payer on the booking", size=15, weight=700)
lines(ix + PAD, 423, ["Name and email, prefilled from the patient and", "editable to a parent or guardian."],
      size=12.5, lh=16)
rect(ix, 468, IW, 216, LAV, LAV_S, r=9)
text(ix + PAD, 494, "Snapshot when the List is authorised", size=15, weight=700)
snap = ["Procedure and contract version", "Values used, and the layer each came from",
        "Recorded BTM, rate and any discount", "Price, and the rule that set it", "Who was billed"]
for i, s in enumerate(snap):
    text(ix + PAD, 520 + 19 * i, "•", size=12.5)
    text(ix + PAD + 12, 520 + 19 * i, s, size=12.5)
lines(ix + PAD, 638, ["Later changes to the RVG or a contract never", "change an invoice that has been issued."],
      size=12.5, lh=17, fill=MUTED, weight=600)

# ---------- Worked examples ----------
TY = 716
rect(20, TY, W - 40, 364, "#FFFFFF", CARD_S, r=14)
text(40, TY + 36, "Same procedure, different outcomes", size=21, weight=800)
text(436, TY + 36, "Five Face-lifts (H3) through the same four steps", size=14, fill=MUTED)
COLS = [(48, "Situation"), (470, "Contract"), (870, "Starting units"), (1100, "Price rule"),
        (1350, "Price"), (1592, "Invoice to")]
for x, label in COLS:
    text(x, TY + 68, label, size=12, weight=700, fill="#8A8A96")
examples = [
    ("Surgeon has no arrangement", ("No contract (RVG)", "RVG-style"), "6 base, from RVG group H3", "3", "Calculated",
     "(6 + T + M) × own rate", "Patient"),
    ("Surgeon's fixed-fee schedule", ("Merivale Plastics", "Third party"), "6 base, reference only", "2", "Contract fixed price",
     "$3,565", "Patient"),
    ("Insurer pays AA directly", ("Southern Cross Health Society", "Third party"), "6 base, reference only", "2", "Contract fixed price",
     "Agreed price", "Insurer"),
    ("Colleague's family, no charge", ("No contract (RVG)", "RVG-style"), "6 base, from RVG group H3", "1", "Anaesthetist's price",
     "$0, no-charge invoice", "Patient"),
    ("Prepaid cosmetic list (proposed)", ("Dr B. Smith prepaid list", "First party"), "6 base, reference only", "2", "Contract fixed price",
     "Prepaid amount, unless raised", "Patient"),
]
for i, (sit, con, units, rn, rl, price, to) in enumerate(examples):
    ey = TY + 80 + 54 * i
    rect(36, ey, W - 72, 46, "#F7F9FC" if i % 2 == 0 else "#FFFFFF", "#E3E8EF", r=8)
    text(52, ey + 29, sit, size=14.5, weight=700)
    name, kind = con
    text(470, ey + 29, name, size=14.5)
    kind_pill(840 - 48, ey + 12, kind, 96)
    text(870, ey + 29, units, size=13.5, fill=MUTED)
    a(f'<circle cx="{1112}" cy="{ey + 23}" r="11" fill="{WIN if rn == "2" else "#8A95A2"}"/>')
    text(1112, ey + 28, rn, size=12.5, weight=800, fill="#FFFFFF", anchor="middle")
    text(1132, ey + 29, rl, size=14)
    text(1350, ey + 29, price, size=14.5, weight=700)
    payer_pill(1630, ey + 11, to, w=96, h=24)

# ---------- Bottom bar ----------
rect(20, 1094, W - 40, 40, YEL, YEL_S, r=10)
a(f'<text x="{W / 2}" y="1121" font-size="19" fill="#1B1B1F" text-anchor="middle">'
  '<tspan font-weight="800">Flow:</tspan> Procedure + contract + date → starting values → price → invoice and snapshot'
  '<tspan dx="14">·</tspan><tspan dx="14" font-weight="800">Still open:</tspan> multi-procedure rule, prepaid amounts, modifiers</text>')

a('</svg>')
open(sys.argv[1], "w").write("\n".join(out))
