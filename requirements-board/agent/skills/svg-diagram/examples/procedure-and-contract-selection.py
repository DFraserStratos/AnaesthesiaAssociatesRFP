"""User view: the procedure, its Contract and how the office chooses on the step rail, on the flat
Contract model (5 November 2026; domain-model.md, AR-58). Three columns: a blue procedure panel, a
charcoal Contracts panel of stacked cards, a lavender step rail; then a summary bar.
The generator of AR-02. Usage: python3 examples/procedure-and-contract-selection.py <out.svg>"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from svgkit import *

# ---------------- layout constants ----------------
TOP = 20
LX, LW = 20, 390                 # left panel
CX0, CW = LX + LW + 16, 900      # centre (hero) panel
RX0, RWID = CX0 + CW + 16, 420   # right panel
W = RX0 + RWID + 20
PANEL_H = 1205
BAR_Y = TOP + PANEL_H + 16
H = BAR_Y + 40 + 20

d = Diagram(W, H, title="Contract selection and who pays")

# ================= Left: the procedure =================
d.panel(LX, TOP, LW, PANEL_H, BLUE, BLUE_S, r=13, id="procedure-text")
d.heading(38, 60, "The procedure", size=28,
          sub=["No procedure master list. The procedure", "arrives as text on the Booking and is kept",
               "as received, never edited."])

BX, BW = 36, LW - 32

def white(y, h, id, title):
    d.rect(BX, y, BW, h, "#FFFFFF", CARD_S, r=10, id=id)
    d.text(BX + PAD, y + 27, title, size=15.5, weight=700)

def leaf(y, s, dash=None):
    d.rect(BX + PAD, y, BW - 2 * PAD, 32, PEACH, PEACH_S, r=7, sw=1.6, dash=dash)
    d.text(BX + PAD + 12, y + 21, s, size=15.5)

y = 146
white(y, 111, "as-received", "As received from the surgeon's rooms")
leaf(y + 40, "F/L + upper bleph")
d.text(BX + PAD, y + 92, "Short codes and snippets, exactly as sent.", size=12.5, fill=MUTED)

y = 278
white(y, 128, "hospital-wording", "Fuller wording from the hospital")
leaf(y + 40, "Facelift and upper blepharoplasty")
d.lines(BX + PAD, y + 92, ["Replaces the rooms' text when it arrives;", "the Booking's change history keeps the original."],
        size=12.5, lh=17, fill=MUTED)

y = 427
white(y, 145, "invoice-description", "Invoice description")
leaf(y + 40, "Facelift plus 1 add on (eg bleph)", dash="5 4")
d.lines(BX + PAD, y + 92, ["The wording the invoice prints, its own field:",
                           "the rooms', replaced by the hospital's, then",
                           "by the Contract's invoice description."], size=12.5, lh=17, fill=MUTED)
inv_bottom = y + 145
d.aside(BX + 40, inv_bottom + 14, ["Admins can edit it as free text, and", "their edit always wins (OQ-130)."],
        w=300, lead=(BX + 22, inv_bottom))

# Each Procedure gets
y = 668
SLOT_H = 46
slots = [("Contract", "exactly one", "Facelift plus 1 add on"),
         ("RVG code", "for reference on a fixed price", "H3, if known"),
         ("Price", "follows the Contract", "$3,400")]
white(y, 42 + len(slots) * (SLOT_H + 6) + 52, "procedure-slots", "Each Procedure on the Booking gets")
for i, (name, sub, val) in enumerate(slots):
    sy = y + 42 + i * (SLOT_H + 6)
    d.rect(BX + PAD, sy, BW - 2 * PAD, SLOT_H, SUB, SUB_S, r=7)
    d.text(BX + PAD + 12, sy + 20, name, size=14.5, weight=700)
    d.text(BX + PAD + 12, sy + 37, sub, size=12, fill=MUTED)
    cw = 7.6 * len(val) + 22
    cx = BX + BW - PAD - 10 - cw
    d.rect(cx, sy + 11, cw, 24, PEACH, PEACH_S, r=6, sw=1.4)
    d.text(cx + cw / 2, sy + 28, val, size=13, weight=600, anchor="middle")
cap_y = y + 42 + len(slots) * (SLOT_H + 6) + 16
d.lines(BX + PAD, cap_y, ["No Contract yet? The Booking shows", "“Needs an invoice destination”."],
        size=12.5, lh=17, fill=MUTED)
slots_bottom = y + 42 + len(slots) * (SLOT_H + 6) + 52

# Also on the Booking
y = slots_bottom + 22
ctx_h = 193
white(y, ctx_h, "booking-context", "Also on the Booking")
for i, (name, sub) in enumerate([("Payer", "the patient, or a parent or guardian"),
                                 ("Insurer or funder, approval number", "when the Booking is insured")]):
    sy = y + 40 + i * 44
    d.rect(BX + PAD, sy, BW - 2 * PAD, 38, SUB, SUB_S, r=7)
    d.text(BX + PAD + 12, sy + 17, name, size=14, weight=700)
    d.text(BX + PAD + 12, sy + 32, sub, size=12, fill=MUTED)
d.lines(BX + PAD, y + 140, ["The payer is billed when the Contract bills", "the payer. The insurer or funder only",
                            "suggests a path; it never narrows the list."], size=12.5, lh=17, fill=MUTED)
ctx_bottom = y + ctx_h

d.aside(BX, TOP + PANEL_H - 80, ["Changing the Contract never changes", "the text received."], w=300)

# ================= Centre: Contracts =================
d.panel(CX0, TOP, CW, PANEL_H, CHAR, r=14, id="contract-master")
d.heading(CX0 + 20, 60, "Contracts", size=28, fill="#FFFFFF",
          sub=["Every Procedure has exactly one Contract: it sets how the work is priced and who gets the invoice.",
               "Each Contract is one priced item with its own settings. A holder's schedule becomes many Contracts."],
          sub_fill=LIGHT)

GX, GW = CX0 + 20, CW - 40
BOX_GAP = 36
BOX_W = (GW - 2 * BOX_GAP) / 3
BOX_Y, BOX_H = 122, 176
boxes = [
    ("party", "Party", ["A hospital, an insurer or funder, a", "surgeon or surgeon group, an",
                        "anaesthetist, or AA. Holds the billing", "name and details and how invoices",
                        "are delivered. Holds many Contracts."]),
    ("contract-settings", "Contract settings", ["Bills its holder, or the payer?", "Funding tag · specialties",
                                                "Linked surgeons, anaesthetist", "Prepaid · Override allowed",
                                                "AA code · holder reference code",
                                                "Invoice description", "Default RVG code · Active or Disabled"]),
    ("pricing-kind", "Pricing kind", ["RVG at the anaesthetist's rate", "RVG at the Contract's rate",
                                      "RVG less the Contract's discount", "Fixed price, in dated price ranges",
                                      "Open price, typed (fallbacks only)", "All prices ex GST."]),
]
for i, (bid, title, body) in enumerate(boxes):
    bx = GX + i * (BOX_W + BOX_GAP)
    d.rect(bx, BOX_Y, BOX_W, BOX_H, "#3D3D42", CHAR_S, r=10, sw=1.4, id=bid)
    d.text(bx + PAD + 2, BOX_Y + 28, title, size=18, weight=800, fill="#FFFFFF")
    d.lines(bx + PAD + 2, BOX_Y + 52, body, size=12.5, lh=17, fill=LIGHT)
    if i:
        d.chevron(bx - BOX_GAP / 2, BOX_Y + BOX_H / 2)
d.text(GX, BOX_Y + BOX_H + 26, "No setting is dated: a change is an audited edit, and a change from a date "
       "means a new Contract. Only a fixed price has dates.", size=13, fill=LIGHT, style="italic")

# table columns, inside a card's rows
RX, RW = GX + 18, GW - 32
C_NAME = (RX, RX + RW - 476)
C_BILL = (C_NAME[1], C_NAME[1] + 130)
C_PRICING = (C_BILL[1], C_BILL[1] + 170)
C_PRICE = (C_PRICING[1], C_PRICING[1] + 96)
C_OVR = (C_PRICE[1], RX + RW)
def mid(c): return (c[0] + c[1]) / 2
DIVS = [C_BILL[0], C_PRICING[0], C_PRICE[0], C_OVR[0]]

TH_Y = BOX_Y + BOX_H + 44
d.table_header(GX, TH_Y, GW, [(C_NAME[0] + PAD, "Contract", "start"), (mid(C_BILL), "Bills", "middle"),
                              (mid(C_PRICING), "Pricing kind", "middle"), (mid(C_PRICE), "Price", "middle"),
                              (mid(C_OVR), "Override?", "middle")], DIVS)

# card colour = invoice destination
DEST = {"patient": "green", "hospital": "lavender", "special": "rose"}
BILL = {"payer": ("The payer", PERSON_F, PERSON_T, PERSON_S),
        "hospital": ("The hospital", HOSPITAL_F, HOSPITAL_T, HOSPITAL_S),
        "insurer": ("The insurer", INSURER_F, INSURER_T, INSURER_S)}
ROW_H, ROW_P = 36, 42

def group(top, dest, title, tag, rows, caption, id):
    kind = DEST[dest]
    h = 44 + ROW_P * len(rows) + 17 * len(caption) + 10
    d.stacked_group(GX, top, GW, h, kind, title, tag=tag, id=id)
    _, stroke, _, tf, tt = KIND[kind]
    for i, (name, badge, bills, pricing, price, ovr) in enumerate(rows):
        ry = top + 44 + ROW_P * i
        d.table_row(RX, ry, RW, DIVS, stroke=stroke, h=ROW_H)
        d.text(C_NAME[0] + PAD, ry + 23, name, size=15)
        if badge:
            bw = 7.0 * len(badge) + 20
            d.pill(C_NAME[1] - PAD - bw / 2, ry + 8, bw, badge, tf, tt, size=11, h=20)
        lab, bf, bt, bs = BILL[bills]
        d.pill(mid(C_BILL), ry + 7, 104, lab, bf, bt, size=12, h=22, stroke=bs)
        if pricing.startswith("RVG"):
            d.pill(mid(C_PRICING), ry + 8, 156, pricing, UNITS_F, UNITS_T, size=11.5, h=20, stroke=UNITS_S)
        elif pricing == "Open price":
            d.pill(mid(C_PRICING), ry + 8, 118, pricing, "#FFFFFF", CHIP_T, size=11.5, h=20, stroke="#9C9CA8", dash="4 3")
        else:
            d.pill(mid(C_PRICING), ry + 8, 118, pricing, CHIP, CHIP_T, size=11.5, h=20)
        if price.startswith("$"):
            d.text(mid(C_PRICE), ry + 23, price, size=15, weight=700, anchor="middle")
        else:
            d.text(mid(C_PRICE), ry + 23, price, size=13, fill=MUTED, anchor="middle", style="italic")
        if ovr == "Yes":
            d.pill(mid(C_OVR), ry + 8, 56, "Yes", GOOD_F, GOOD_T, size=11.5, h=20)
        elif ovr == "No":
            d.pill(mid(C_OVR), ry + 8, 56, "No", LOCK_F, LOCK_T, size=11.5, h=20)
    d.lines(GX + 20, top + 44 + ROW_P * len(rows) + 14, caption, size=12.5, lh=17, fill=MUTED)
    return top + h + 14

y = TH_Y + 46
y = group(y, "patient", "AA", "Patient › Standard · every specialty",
          [("No contract · RVG", "Built-in · first", "payer", "RVG · anaesthetist's rate", "from units", "Yes"),
           ("No contract · Fixed price", "Fallback", "payer", "Open price", "typed", "")],
          ["No contract · RVG is offered first on every List and never expires. Every destination has one open-price",
           "fallback, made by the system and picked with Other price, such as Prepaid · Fixed price or Forte · SXAP · Fixed price."],
          id="no-contract-rvg")
y = group(y, "patient", "Merivale Plastic Surgery", "Patient › Standard · Plastic surgery",
          [("Face lift", None, "payer", "Fixed price", "$3,200", "No"),
           ("Facelift plus 1 add on (eg bleph)", None, "payer", "Fixed price", "$3,400", "No")],
          ["A surgeon group's fixed fees bill the payer, so they sit under Patient, linked to the surgeons they cover (OQ-105).",
           "New prices from 1 Oct, sent 5 Nov: Face lift gains a price range from 1 Oct at $3,200 ($3,100 from 1 Jun before)."],
          id="surgeon-arrangement")
y = group(y, "patient", "Dr Fairbairn's own price list", "Patient › Prepaid · Plastic surgery",
          [("Face lift", "Prepaid", "payer", "Fixed price", "$3,100", "No")],
          ["Kept by the office from her list, offered only on her Lists. Picking it starts the prepayment letter and invoice.",
           "A prepaid Contract is never priced from RVG units, and the anaesthetist never overrides its price (OQ-96)."],
          id="anaesthetist-price-list")
y = group(y, "hospital", "Christchurch Eye Surgery", "Hospital › SXAP · Ophthalmology",
          [("Cataract IOL (LA by Anaesthetist)", "8268", "hospital", "Fixed price", "$357.39", "No"),
           ("Blepharoplasty & ptosis bilateral", "AP0135", "hospital", "Fixed price", "$1,152.17", "No")],
          ["Each item of the hospital's SXAP schedule is a Contract tagged SXAP, its code kept as the holder reference code.",
           "Offered only on CES Lists. Forte's plain RVG Contract, Forte' SXAP, sits the same way under Forte › SXAP."],
          id="hospital-contract")
y = group(y, "special", "NIB", "Special · every specialty",
          [("NIB", None, "insurer", "RVG · anaesthetist's rate", "from units", "No")],
          ["An insurer billed directly at plain RVG, offered on every List. Many insurance jobs look like this."],
          id="insurer-contract")
centre_bottom = y - 14

# ================= Right: how the office chooses =================
d.panel(RX0, TOP, RWID, PANEL_H, "#F1EDFD", LAV_S, r=13, id="how-the-office-chooses")
d.heading(RX0 + 18, 60, "How the office chooses", size=27,
          sub=["At booking setup the office says where the", "invoice goes, then picks the Contract.",
               "Example: a facelift on Lowe's List at St George's."])
SX, SW = RX0 + 16, RWID - 32

def chips(x, y, items):
    """items = [(label, fill, stroke, text)] laid left to right; returns right x."""
    for label, f, s, t in items:
        w = 7.4 * len(label) + 22
        d.rect(x, y, w, 26, f, s, r=13, sw=1.3)
        d.text(x + w / 2, y + 17.5, label, size=12.5, weight=700, fill=t, anchor="middle")
        x += w + 8
    return x

def plain_card(y, h, title, body, id):
    d.rect(SX, y, SW, h, "#FFFFFF", "#DCD3F5", r=9, id=id)
    d.text(SX + PAD + 2, y + 29, title, size=15.5, weight=700)
    d.lines(SX + PAD + 2, y + 51, body, size=12.5, lh=17, fill=MUTED)
    return y + h

def num_card(y, h, n, title, id):
    d.rect(SX, y, SW, h, "#FFFFFF", "#DCD3F5", r=9, id=id)
    d.badge_number(SX + 24, y + 24, n)
    d.text(SX + 46, y + 29, title, size=15.5, weight=700)

GAP = 40
y = 162
body = ["Active Contracts that fit the List: held by its", "hospital, linked to its surgeon or anaesthetist,",
        "or an insurer's or funder's with no links; and", "only where their specialties include the",
        "surgeon's. There is no “show all”."]
y = plain_card(y, 50 + 17 * len(body), "Contracts offered on this List", body, "contract-list") + GAP

G, L, R = KIND["green"], KIND["lavender"], KIND["rose"]
s1 = y
num_card(y, 132, 1, "Where does the invoice go?", "who-pays")
chips(SX + 46, y + 44, [("Patient 21", G[0], G[1], G[4]), ("St George's 5", L[0], L[1], L[4]),
                        ("Special 5", R[0], R[1], R[4])])
d.lines(SX + 46, y + 92, ["Worked out from each Contract's settings.", "Patient means the payer on the Booking."],
        size=12.5, lh=17, fill=MUTED)
s1_bottom = y + 132
y = s1_bottom + 78     # room for the Suggested note

num_card(y, 132, 2, "Payment type, or funding tag", "prepay")
chips(SX + 46, y + 44, [("Standard 16", G[0], G[1], G[4]), ("Prepaid 5", G[0], G[1], G[4])])
d.lines(SX + 46, y + 92, ["Prepaid starts the prepayment. Under the", "hospital, its tags; under Special, the Contract."],
        size=12.5, lh=17, fill=MUTED)
y += 132 + GAP

num_card(y, 176, 3, "Pick the Contract", "choose-contract")
d.rect(SX + 46, y + 44, SW - 46 - PAD, 28, "#FFFFFF", "#B9AAEE", r=7, sw=1.3)
d.text(SX + 58, y + 63, "face", size=13.5, weight=600)
d.text(SX + SW - PAD - 12, y + 63, "3 Contracts", size=12, fill=MUTED, anchor="end")
d.lines(SX + 46, y + 92, ["Type to search names, codes, invoice", "descriptions and RVG codes.",
                          "No contract · RVG is pinned first. Or flip", "Other price to pick the fallback, and type",
                          "the amount."],
        size=12.5, lh=17, fill=MUTED)
y += 176 + GAP

body = ["On an RVG price: the RVG code, time and", "modifiers. On a fixed or open price: an RVG",
        "code for reference only, no time or modifiers."]
y = plain_card(y, 50 + 17 * len(body), "Then the anaesthetist", body, "rvg-code") + GAP

# Suggested note hangs off step 1
d.aside(SX + 40, s1_bottom + 10, ["The Booking's insurer or funder marks one", "path Suggested; it never narrows (OQ-93)."],
        w=SW - 40, lead=(SX + 22, s1_bottom), id="suggested", size=13, lh=17)

AS_H = 7 * 17 + 22
d.aside(SX, TOP + PANEL_H - 24 - AS_H, ["Until the List is authorised, from the same",
                    "Contracts, no reason needed. Each change",
                    "is audited, flagged at office review and",
                    "clears a typed price. Pre-approval fell",
                    "through on the day? Change to",
                    "No contract · RVG and the payer is billed."],
        w=SW, title="The anaesthetist can change the Contract", id="anaesthetist-can-change", size=13, lh=17)

# ================= Bottom bar =================
d.bottom_bar(BAR_Y, [("Procedure:", "text as received, no master list"),
                     ("Contract:", "one per Procedure, picked on the step rail"),
                     ("Who pays:", "the Contract's own settings decide")])

d.save(sys.argv[1])
