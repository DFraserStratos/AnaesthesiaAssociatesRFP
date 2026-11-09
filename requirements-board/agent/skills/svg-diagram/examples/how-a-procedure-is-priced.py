"""System view: how the system works out a price, on the flat Contract model (5 November 2026).
Four stage cards joined by chevrons, then a worked-examples table and a summary bar.
The generator of AR-01. Usage: python3 examples/how-a-procedure-is-priced.py <out.svg>"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from svgkit import *

# ---------- layout constants ----------
CW, GAP = 410, 40                       # stage card width, gap between cards (chevron sits in it)
XS = [20 + i * (CW + GAP) for i in range(4)]
IW = CW - 32                            # inner content width
TOP = 20
BOT = 960                               # stage cards' bottom edge
BOX_TOP = 124                           # first box inside a stage card
TY = BOT + 20                           # worked-examples panel top
ROW_PITCH, ROW_H = 54, 46
EXAMPLES_N = 9
TH = 80 + EXAMPLES_N * ROW_PITCH + 12   # worked-examples panel height
BAR_Y = TY + TH + 16
W = XS[3] + CW + 20
H = BAR_Y + 40 + 20

d = Diagram(W, H, title="How the system works out a price")

PAYER = {"Payer": (PERSON_F, PERSON_T, PERSON_S),
         "Insurer": (INSURER_F, INSURER_T, INSURER_S),
         "Hospital": (HOSPITAL_F, HOSPITAL_T, HOSPITAL_S)}

def payer_pill(cx, y, label, w=84, h=22):
    f_, t_, s_ = PAYER[label]
    d.pill(cx, y, w, label, f_, t_, size=12, h=h, stroke=s_)

def stage(i, title, sub, id):
    x0 = XS[i]
    d.card(x0, TOP, CW, BOT - TOP, title=title, number=i + 1, id=id)
    d.lines(x0 + 18, TOP + 74, sub, size=13, lh=17, fill=MUTED)
    return x0 + 16

def input_box(x, y, h, title, value, body, fill="#FFFFFF", stroke=CARD_S, value_fill=INK, dash=None, id=None):
    d.rect(x, y, IW, h, fill, stroke, r=9, dash=dash, id=id)
    d.text(x + PAD, y + 25, title, size=15, weight=700)
    if value:
        d.text(x + IW - PAD, y + 25, value, size=13, weight=600, fill=value_fill, anchor="end")
    d.lines(x + PAD, y + 47, body, size=12.5, lh=16, fill=MUTED)

for i in range(3):
    d.chevron(XS[i] + CW + GAP / 2, (TOP + BOT) / 2)

# ---------- 1 What goes in ----------
ix = stage(0, "What goes in", ["Each Procedure on a Booking is priced on its own",
                               "Contract, from these inputs."], id="stage-1")
boxes = [
    dict(title="Contract", value="St George's · HNZ, RVG less 10%", fill=LAV, stroke=LAV_S, value_fill="#4B3A8C",
         id="contract-input",
         body=["One Contract per priced item, picked by the office",
               "at booking setup and changeable by the",
               "anaesthetist until the List is authorised. Its own",
               "settings give its pricing kind and who it bills.",
               "No contract · RVG is always offered first."]),
    dict(title="RVG code", value="H3 · 6 base units", fill=GRN, stroke=GRN_S, value_fill=GRN_T, id="rvg-code",
         body=["Sets the base units. Required on an RVG price; on a",
               "fixed or open price it is for reference only. The",
               "Contract's default RVG code may fill it in."]),
    dict(title="Time units", value="1 h 45 min · 7 units",
         body=["RVG price only. From start and finish: 1 per 15 min",
               "for the first 2 h, then 1 per 10 min, part interval",
               "rounded up."]),
    dict(title="Modifier units", value="BMI 35 to 40 · 1 unit",
         body=["RVG price only. Picked one by one by the",
               "anaesthetist, each with a short note, because",
               "insurers ask for it."]),
    dict(title="Anaesthetist's own unit value", value="$40", id="unit-value",
         body=["Each anaesthetist sets their own dollar value per",
               "unit, used on an RVG price at their rate or less a",
               "discount. Never a shared price list."]),
    dict(title="Procedure date", value="21 Jul 2026", stroke="#9C9CA8", dash="5 4",
         body=["The List's date. On a fixed price it picks the price",
               "range in force on that day."]),
]
heights = [47 + 16 * (len(b["body"]) - 1) + 18 for b in boxes]
spare = (BOT - 20 - BOX_TOP) - sum(heights)
gap = spare / (len(boxes) - 1)
y = BOX_TOP
for b, h in zip(boxes, heights):
    input_box(ix, y, h, b["title"], b["value"], b["body"], fill=b.get("fill", "#FFFFFF"),
              stroke=b.get("stroke", CARD_S), value_fill=b.get("value_fill", INK), dash=b.get("dash"), id=b.get("id"))
    y += h + gap

# ---------- 2 Values on the Procedure ----------
ix = stage(1, "Values on the Procedure", ["The Procedure holds its units and any typed price;",
                                          "rate and discount come from the pricing kind."], id="stage-2")
VAL_X, EX_CX, FROM_X = ix + PAD, ix + 152, ix + 194
TABLE_H = 24 + 4 * 42 + 26 + 42 + 50 + 10
d.rect(ix, BOX_TOP, IW, TABLE_H, "#FFFFFF", CARD_S, r=9, id="procedure-values")
d.text(VAL_X, BOX_TOP + 24, "Value", size=11.5, weight=700, fill="#8A8A96")
d.text(EX_CX, BOX_TOP + 24, "Example", size=11.5, weight=700, fill="#8A8A96", anchor="middle")
d.text(FROM_X, BOX_TOP + 24, "Comes from", size=11.5, weight=700, fill="#8A8A96")

def value_row(y, name, ex, src, win=True, h=36):
    d.rect(ix + 8, y, IW - 16, h, "#F7F9FC", "#E3E8EF", r=7)
    d.text(ix + 18, y + 23, name, size=14, weight=700)
    d.rect(EX_CX - 30, y + 6, 60, 24, "#FFFFFF", GRN_S if win else "#E2E2EA", r=6)
    d.text(EX_CX, y + 23, ex, size=13, weight=800 if win else 400, fill=GRN_T if win else "#A8A8B2", anchor="middle")
    d.lines(FROM_X, y + 23, src, size=12.5, lh=16, fill=MUTED)
    return y + h + 6

y = BOX_TOP + 34
y = value_row(y, "Price", "none", ["typed by someone permitted"], win=False)
y = value_row(y, "Base units", "6", ["the RVG code, editable"])
y = value_row(y, "Time units", "7", ["start and finish times"])
y = value_row(y, "Modifier units", "1", ["0, plus each one claimed"])
d.text(ix + 18, y + 16, "Not held on the Procedure, never edited here", size=11.5, weight=700, fill="#8A8A96")
y += 24
y = value_row(y, "Rate", "$40", ["the anaesthetist's value,", "as the pricing kind says"], h=50)
y = value_row(y, "Discount", "10%", ["the Contract, undated"])

WY = BOX_TOP + TABLE_H + 20
WH = 238
d.rect(ix, WY, IW, WH, LAV, LAV_S, r=9, id="who-can-change")
d.text(ix + PAD, WY + 26, "Who can type a price", size=15, weight=700)
for k, (who, where) in enumerate([("Anaesthetist", "where the Contract allows it"),
                                  ("Office", "on any Contract, until authorised")]):
    ry = WY + 40 + 44 * k
    d.rect(ix + PAD, ry, IW - 2 * PAD, 36, "#FFFFFF", "#DAD1F5", r=7)
    d.text(ix + PAD + 12, ry + 23, who, size=14, weight=700)
    d.text(ix + IW - PAD - 12, ry + 23, where, size=13, fill=MUTED, anchor="end")
d.lines(ix + PAD, WY + 150, ["No reason needed · audited and flagged at review ·",
                             "the last change stands. The anaesthetist may also",
                             "type the amount on No contract · Fixed price.",
                             "St George's does not allow the override: the",
                             "anaesthetist sees the 10% applied, read-only."], size=12.5, lh=17)
# notes
ny = d.aside(ix, WY + WH + 20, ["A price nobody typed is worked out, not stored: a new",
                                "price range, or a rate or discount edited on the",
                                "Contract, reaches every Procedure on it not yet",
                                "authorised, unless its prepayment invoice holds it."], w=IW, title="The price follows the Contract", id="price-follows")
d.aside(ix, ny + 14, ["Changing the Contract clears a typed price; the",
                      "recorded RVG detail is kept. Only the office moves",
                      "a Procedure onto or off a prepaid Contract."], w=IW, title="Contract changed", id="contract-reset")

# ---------- 3 Work out the price ----------
ix = stage(2, "Work out the price", ["First match wins: a price the Procedure holds,",
                                     "else the Contract's pricing kind."], id="stage-3")
HY, HH = BOX_TOP, 104
d.rect(ix, HY, IW, HH, "#FFFFFF", CARD_S, r=9, id="holds-a-price")
d.pill(ix + PAD + 22, HY + 13, 44, "Yes", GOOD_F, GOOD_T, size=12.5)
d.text(ix + PAD + 56, HY + 30, "The Procedure holds a price", size=15, weight=700)
d.lines(ix + PAD, HY + 56, ["Frozen in the snapshot at AUTHORISED; the prepaid",
                            "amount once its prepayment invoice is raised; or a",
                            "price typed by someone permitted."], size=12.5, lh=16, fill=MUTED)

CY = HY + HH + 16
KINDS = [("RVG at the anaesthetist's rate", "BTM x their value", False),
         ("RVG at the Contract's rate", "BTM x its rate", False),
         ("RVG less a discount", "BTM x value, less %", True),
         ("Fixed price", "the range in force", False),
         ("Open price", "none of its own", False)]
KT = CY + 44
KH = 12 + 30 * len(KINDS)
CH = (KT - CY) + KH + 176
d.rect(ix, CY, IW, CH, "#F4FBF6", WIN, r=9, sw=2, id="calculate")
d.pill(ix + PAD + 22, CY + 13, 44, "No", LOCK_F, LOCK_T, size=12.5)
d.text(ix + PAD + 56, CY + 30, "Use the pricing kind", size=15, weight=700)
d.text(ix + IW - PAD, CY + 30, "St George's", size=13.5, weight=700, fill=GRN_T, anchor="end")
d.rect(ix + PAD, KT, IW - 2 * PAD, KH, "#FFFFFF", "#CFE6D6", r=7)
for k, (kind, how, hit) in enumerate(KINDS):
    ky = KT + 6 + 30 * k
    if hit:
        d.rect(ix + PAD + 5, ky, IW - 2 * PAD - 10, 28, "#FFFFFF", WIN, r=6, sw=1.6)
    d.text(ix + PAD + 14, ky + 19, kind, size=13, weight=700, fill=GRN_T if hit else INK)
    d.text(ix + IW - PAD - 14, ky + 19, how, size=12.5, fill=GRN_T if hit else MUTED, anchor="end",
           weight=700 if hit else 400)
FY = KT + KH + 14
d.lines(ix + PAD, FY + 12, ["BTM: base, time and modifier units. A discount is",
                            "a fraction (10% is 0.1), shown as its own invoice line."],
        size=12.5, lh=16, fill=MUTED)
SY = FY + 54
d.text(ix + 18, SY, "(6 + 7 + 1) units x $40", size=14)
d.text(ix + IW - 18, SY, "$560", size=14, weight=600, anchor="end")
d.text(ix + 18, SY + 30, "Discount 10%", size=14)
d.text(ix + IW - 18, SY + 30, "less $56", size=14, weight=600, anchor="end")
d.path(f"M{ix + PAD} {SY + 40} H{ix + IW - PAD}", color=GRN_S, w=1.2)
d.text(ix + 18, SY + 62, "Price", size=14, weight=800)
d.text(ix + IW - 18, SY + 62, "$504", size=14.5, weight=800, fill=GRN_T, anchor="end")
d.text(ix + 18, SY + 92, "A price of $0 gives a no-charge invoice.", size=12.5, fill=MUTED, style="italic")

ny = d.aside(ix, CY + CH + 16, ["An open price with no amount, or a fixed price",
                                "with no range in force on the date. It stops the",
                                "anaesthetist completing (they can send it on to",
                                "the office) and stops the List being authorised."],
             w=IW, title="Needs a price", id="checks")
d.aside(ix, ny + 14, ["Base units go on the primary Procedure only.",
                      "Time units go on every Procedure, from its own",
                      "times. Modifier units go on the primary when",
                      "four or fewer; above four they are spread as",
                      "evenly as possible, the remainder to the primary",
                      "(7 over 3 = 3, 2, 2). Only RVG-priced Procedures",
                      "carry units, and no Contract changes this."],
        w=IW, title="More than one Procedure on a Booking", id="multi-procedure")

# ---------- 4 Bill it, keep a record ----------
ix = stage(3, "Bill it, keep a record", ["Each Contract bills its holder or the payer on",
                                         "the Booking; that sets the invoice destination."], id="stage-4")
DESTS = [("Patient", ["Payer"], False, ["Bills the payer: No contract · RVG, prepay price",
                                        "lists, surgeons' fixed fees such as Merivale."]),
         ("Hospital", ["Hospital"], True, ["Bills the List's hospital, with a funding tag",
                                           "(SXAP, HNZ, ACC): St George's HNZ."]),
         ("Special", ["Insurer", "Hospital"], False, ["Bills any other holder: an insurer or funder,",
                                                      "a surgeon group, an untagged hospital."])]
DH = 76
for k, (dest, to, hit, body) in enumerate(DESTS):
    by = BOX_TOP + (DH + 8) * k
    d.rect(ix, by, IW, DH, "#F4FBF6" if hit else "#FFFFFF", WIN if hit else CARD_S, r=9, sw=2 if hit else 1.2)
    d.text(ix + PAD, by + 25, dest, size=14.5, weight=700)
    for j, label in enumerate(reversed(to)):
        payer_pill(ix + IW - PAD - 42 - j * 92, by + 10, label)
    d.lines(ix + PAD, by + 47, body, size=12, lh=16, fill=MUTED)
dy = BOX_TOP + (DH + 8) * 3 - 8

ny = d.aside(ix, dy + 22, ["Prefilled from the patient; can be changed to a",
                           "parent, guardian or another party who pays."],
             w=IW, title="Payer: the person named on the Booking", id="payer")

IY = ny + 22
IH = 132
d.rect(ix, IY, IW, IH, "#FFFFFF", CARD_S, r=9, id="invoice")
d.text(ix + PAD, IY + 25, "Invoice to St George's Hospital", size=15, weight=700)
d.text(ix + PAD, IY + 52, "H3 anaesthetic · 14 units x $40", size=13)
d.text(ix + IW - PAD, IY + 52, "$560.00", size=13, anchor="end")
d.text(ix + PAD, IY + 77, "Discount 10%", size=13)
d.text(ix + IW - PAD, IY + 77, "less $56.00", size=13, anchor="end")
d.path(f"M{ix + PAD} {IY + 91} H{ix + IW - PAD}", color="#E3E8EF", w=1.2)
d.text(ix + PAD, IY + 108, "Total, ex GST", size=13, weight=800)
d.text(ix + IW - PAD, IY + 108, "$504.00", size=13, weight=800, anchor="end")
d.text(ix + PAD, IY + IH + 20, "One invoice per billable party per Booking.", size=12.5, fill=MUTED, style="italic")

SNY = IY + IH + 44
SNH = BOT - 16 - SNY
d.rect(ix, SNY, IW, SNH, LAV, LAV_S, r=9, id="snapshot")
d.text(ix + PAD, SNY + 26, "Snapshot when the List is authorised", size=15, weight=700)
snap = ["The Contract's settings as they then were", "The values on the Procedure",
        "Recorded BTM units and the rate used", "The price", "Who was billed"]
for k, s in enumerate(snap):
    d.text(ix + PAD, SNY + 52 + 19 * k, "•", size=12.5)
    d.text(ix + PAD + 12, SNY + 52 + 19 * k, s, size=12.5)
d.lines(ix + PAD, SNY + 52 + 19 * len(snap) + 14,
        ["Contracts are edited in place, so it copies them.",
         "Later changes to the RVG or a Contract never",
         "change an invoice that has been issued."], size=12.5, lh=17, fill=MUTED, weight=600)

# ---------- Worked examples ----------
d.rect(20, TY, W - 40, TH, "#FFFFFF", CARD_S, r=14, id="worked-examples")
d.text(40, TY + 36, "Same procedure, different Contracts", size=21, weight=800)
d.text(418, TY + 36, "One H3 anaesthetic on 21 Jul 2026: 6 base + 7 time + 1 modifier = 14 units, "
       "anaesthetist's own value $40", size=14, fill=MUTED)
COLS = [(48, "Situation"), (330, "Contract on the Procedure"), (700, "Pricing kind and values"),
        (1210, "Price"), (1648, "Invoice to")]
for x, label in COLS:
    d.text(x, TY + 68, label, size=12, weight=700, fill="#8A8A96")
examples = [
    ("No special arrangement", "No contract · RVG", "RVG at the anaesthetist's rate, 14 units",
     "14 x $40 = $560", "Payer", None),
    ("Hospital at RVG less 10%", "St George's · HNZ, RVG less 10%", "RVG less a discount, 10% set on the Contract",
     "$560 less $56 = $504", "Hospital", None),
    ("Insurer sets its own rate", "Southern Cross", "RVG at the Contract's rate, $42 a unit",
     "14 x $42 = $588", "Insurer", None),
    ("Surgeon's fixed fees", "Merivale · Face lift", "Fixed price, range from 1 Jun 2026: $3,100; RVG code for reference",
     "$3,100", "Payer", None),
    ("New price, backdated", "Merivale · Face lift", "Range from 1 Jul 2026 added later: $3,200, before authorising",
     "$3,200, follows the range", "Payer", None),
    ("Prepaid cosmetic procedure", "Dr B. Smith · Face lift, prepaid", "Fixed price $1,200, held by the prepayment invoice",
     "$1,200, paid ahead", "Payer", None),
    ("Price on no list", "Prepaid · Fixed price, via Other price", "Open price: $2,000 typed by the office",
     "$2,000, paid ahead", "Payer", None),
    ("Pre-approval falls through", "Changed to No contract · RVG", "Any typed price cleared, RVG detail kept, 14 units",
     "14 x $40 = $560", "Payer", None),
    ("Colleague's family, no charge", "No contract · RVG", "Price overridden to $0 by the anaesthetist",
     "$0, no-charge invoice", "Payer", "no-charge"),
]
assert len(examples) == EXAMPLES_N
for k, (sit, con, vals, price, to, rid) in enumerate(examples):
    ey = TY + 80 + ROW_PITCH * k
    d.rect(36, ey, W - 72, ROW_H, "#F7F9FC" if k % 2 == 0 else "#FFFFFF", "#E3E8EF", r=8, id=rid)
    d.text(52, ey + 29, sit, size=14.5, weight=700)
    d.text(330, ey + 29, con, size=14.5)
    d.text(700, ey + 29, vals, size=13.5, fill=MUTED)
    d.text(1210, ey + 29, price, size=14.5, weight=700)
    payer_pill(1696, ey + 11, to, w=96, h=24)

# ---------- Bottom bar ----------
d.bottom_bar(BAR_Y, [("Flow:", "Contract and RVG detail → a held price, else the pricing kind → holder or payer billed → snapshot"),
                     ("Still open:", "mixed-Booking base units (OQ-132), modifiers (OQ-95)")])

d.save(sys.argv[1])
