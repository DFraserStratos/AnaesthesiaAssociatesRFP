"""User-facing view: finding a procedure, then choosing its contract."""
import sys

W, H = 1890, 1241
out = []
def a(s): out.append(s)

def rect(x, y, w, h, fill, stroke=None, r=10, sw=1.2, dash=None):
    st = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    d = f' stroke-dasharray="{dash}"' if dash else ""
    a(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"{st}{d}/>')

def text(x, y, s, size=14, weight=400, fill="#1B1B1F", anchor="start", style=""):
    fs = f' font-style="{style}"' if style else ""
    a(f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}"{fs}>{s}</text>')

def lines(x, y, rows, size=12, lh=15, **kw):
    for i, s in enumerate(rows):
        text(x, y + i * lh, s, size=size, **kw)

def pill(cx, y, w, label, fill, color, size=12, dash=None, stroke=None, h=24, weight=500):
    rect(cx - w / 2, y, w, h, fill, stroke, r=h / 2, dash=dash)
    text(cx, y + h / 2 + size * 0.36, label, size=size, weight=weight, fill=color, anchor="middle")

def path(d, color="#2E2E31", w=2.5):
    a(f'<path d="{d}" stroke="{color}" stroke-width="{w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')

INK, MUTED, LIGHT = "#1B1B1F", "#55555E", "#D7D7DE"
PEACH, PEACH_S = "#FFE9C2", "#E9AE45"
LAV, LAV_S, LAV_SHADOW = "#EEE9FC", "#C7BAF0", "#DCD3F7"
ROW, ROW_S = "#FCFBFF", "#DAD1F5"
CHIP, CHIP_T = "#E6E5EC", "#3C3C46"
YEL, YEL_S = "#FFF5C4", "#EFD46A"
BLUE, BLUE_S = "#E1F0FB", "#A9C3DA"
GRN, GRN_S, GRN_T = "#E9F5EC", "#9FD0AE", "#1D6B3B"
SUB, SUB_S = "#F3F7FB", "#A9BCD0"
CHAR = "#2E2E31"
TREE = "#2E2E31"

a(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 52 {W} {H - 52}" width="{W}" height="{H - 52}" '
  'font-family="\'Schibsted Grotesk\', \'Helvetica Neue\', Helvetica, Arial, sans-serif">')
a('<title>Finding a procedure and choosing its contract</title>')
rect(0, 0, W, H, "#F3F6FA", r=0)

# ================= Left: Procedure Master List =================
LX, LW = 20, 420
rect(LX, 72, LW, 1106, BLUE, BLUE_S, r=12)
text(38, 110, "Procedure Master List", size=29, weight=800)
lines(38, 136, ["A clean flat list of known NZ procedures, grouped", "by body section, linked to RVG codes."],
      size=14, lh=18, fill=MUTED)

TRUNK = 40
face_lift_mid = None
def section(y, title, subgroups):
    global face_lift_mid
    sec_x, sec_w = 56, 372
    sy = y + 44
    subs = []
    for sname, procs in subgroups:
        sh = 36 + 32 * len(procs) + 6
        subs.append((sy, sh, sname, procs))
        sy += sh + 8
    sec_h = sy - y + 2
    rect(sec_x, y, sec_w, sec_h, GRN, GRN_S, r=10)
    path(f"M{TRUNK} {y + 26} H{sec_x + 14}")
    text(sec_x + 20, y + 33, title, size=21, weight=800)
    sub_trunk = sec_x + 26
    path(f"M{sub_trunk} {y + 42} V{subs[-1][0] + 22} ")
    for gy, gh, sname, procs in subs:
        rect(96, gy, 320, gh, SUB, SUB_S, r=8)
        path(f"M{sub_trunk} {gy + 22} H{112}")
        text(116, gy + 28, sname, size=18, weight=800)
        p_trunk = 132
        last = gy + 36 + 32 * (len(procs) - 1) + 14
        path(f"M{p_trunk} {gy + 34} V{last}", w=2.2)
        for i, p in enumerate(procs):
            py = gy + 36 + 32 * i
            path(f"M{p_trunk} {py + 14} H158", w=2.2)
            rect(158, py, 244, 28, PEACH, PEACH_S, r=7, sw=1.6)
            text(170, py + 19.5, p, size=15.5)
            if p.startswith("Face Lift"):
                face_lift_mid = py + 14
    return y + sec_h

def collapsed(y, label):
    rect(56, y, 372, 28, "#E6E8EC", "#B9BEC6", r=8)
    path(f"M{TRUNK} {y + 14} H56")
    text(68, y + 19.5, label, size=15, weight=700, fill="#6E7580")
    return y + 36

y = 168
trunk_top = 160          # starts above the first section: the list's parent is off-screen
y = section(y, "01 - Head", [("00 - General", ["Face Lift - H3", "Myringoplasty - H2", "Septoplasty - H2"]),
                             ("01 - Dental", ["Dental Extraction - H5", "TMJ Arthroscopy - H2"])]) + 10
y = section(y, "02 - Neck", [("00 - General", ["Laryngectomy - N4", "Thyroidectomy - N3"])]) + 10
y = collapsed(y, "03 - Upper Limb")
y = section(y, "04 - Thorax", [("01 - Breast", ["Breast Augmentation - T2", "Breast Reduction - T2"])]) + 10
for label in ["05 - Spine", "06 - Abdomen", "07 - Perineum", "08 - Pelvic", "09 - Vascular", "10 - Lower Limb",
              "11 - Anaesthesia in Remote Locations"]:
    y = collapsed(y, label)
last_y = y
y = collapsed(y, "12 - Pain Consultations and Procedures")
path(f"M{TRUNK} {trunk_top} V{last_y + 14}")

# ================= Centre: Contract Master List =================
CX0, CW = 455, 1010
rect(CX0, 72, CW, 1106, CHAR, r=12)
text(CX0 + 20, 110, "Contract Master List", size=29, weight=800, fill="#FFFFFF")
text(CX0 + 20, 136, "Every contract AA holds, in three kinds. A user only sees the contracts for the procedure "
     "they picked, narrowed to the booking. Example: Face Lift - H3.", size=14, fill=LIGHT)

# selected procedure chip, linked from the tree
rect(CX0 + 20, 168, 250, 40, PEACH, PEACH_S, r=9, sw=1.6)
text(CX0 + 36, 194, "Face Lift - H3", size=19, weight=700)
text(CX0 + 286, 194, "Selected procedure", size=13, fill=LIGHT, style="italic")
a(f'<path d="M402 {face_lift_mid} C430 {face_lift_mid} 440 188 475 188" stroke="{PEACH_S}" '
  'stroke-width="2.5" fill="none" stroke-dasharray="6 4"/>')
a(f'<circle cx="402" cy="{face_lift_mid}" r="4" fill="{PEACH_S}"/>')

GX, GW = CX0 + 20, 970
RX, RW = GX + 18, GW - 32          # rows sit right of the type stripe
# table columns: (left edge, right edge) inside a row
C_NAME = (RX, RX + 408)
C_PRICING = (C_NAME[1], C_NAME[1] + 150)
C_PRICE = (C_PRICING[1], C_PRICING[1] + 120)
C_CHANGE = (C_PRICE[1], C_PRICE[1] + 150)
C_BILL = (C_CHANGE[1], RX + RW)
def mid(c): return (c[0] + c[1]) / 2
DIVIDERS = [C_PRICING[0], C_PRICE[0], C_CHANGE[0], C_BILL[0]]

# contract types: fill, stroke, shadow, tag fill, tag text
TYPES = {
    "rvg":   ("#E9F5EC", "#8FCBA2", "#D2EBDA", "#C4EDD2", "#1D6B3B"),
    "third": ("#EEE9FC", "#B9AAEE", "#DCD3F7", "#DDD4FA", "#4B3A8C"),
    "first": ("#FCEAF2", "#E2A3C4", "#F3D3E3", "#F8D4E6", "#93305F"),
}

legend = [("rvg", "RVG-style", ["One generated for every procedure,", "plus any AA authors. Adjustable."]),
          ("third", "Third-party fixed price", ["Price list submitted by an insurer,", "hospital or surgeon. Price locked."]),
          ("first", "First-party fixed price", ["Price list supplied by an anaesthetist", "for their own work. Adjustable."])]
LW_ = (GW - 2 * 14) / 3
for i, (k, title, body) in enumerate(legend):
    fill, stroke, _, tf, tt = TYPES[k]
    lx = GX + i * (LW_ + 14)
    rect(lx, 222, LW_, 68, fill, stroke, r=9, sw=1.4)
    rect(lx + 16, 237, 12, 12, stroke, r=3)
    text(lx + 36, 248, title, size=14.5, weight=700, fill=tt)
    lines(lx + 16, 268, body, size=12.5, lh=15, fill=MUTED)

# table header band, aligned to the row columns
rect(GX, 304, GW, 32, "#3D3D42", "#55555C", r=8)
for c, label, anchor in [(C_NAME, "Contract", "start"), (C_PRICING, "Pricing", "middle"),
                         (C_PRICE, "Price", "middle"), (C_CHANGE, "Change price?", "middle"),
                         (C_BILL, "Invoice to", "middle")]:
    x = c[0] + 14 if anchor == "start" else (c[1] - 16 if anchor == "end" else mid(c))
    text(x, 325, label, size=12.5, weight=700, fill="#E4E4EA", anchor=anchor)
for d in DIVIDERS:
    path(f"M{d} 311 V329", color="#66666E", w=1)

def group(top, kind, title, tagspec, caption, n_rows=1):
    fill, stroke, shadow, tf, tt = TYPES[kind]
    h = 46 + 42 * n_rows + 18 * len(caption) + 8
    rect(GX + 5, top + 5, GW, h, shadow, r=10)
    rect(GX, top, GW, h, fill, stroke, r=10, sw=1.4)
    rect(GX, top + 10, 6, h - 20, stroke, r=3)
    text(GX + 20, top + 29, title, size=18, weight=700)
    if tagspec:   # when the group is shown: plain text, right-aligned
        label, w = tagspec
        text(GX + GW - 18, top + 29, label, size=13.5, weight=500, fill="#2E2E36", anchor="end")
    lines(GX + 20, top + 46 + 42 * n_rows + 15, caption, size=12.5, lh=17, fill=MUTED)
    return top, top + h + 12

def row(y, kind, name, chip, value, adjustable, billed, tag=None):
    stroke = TYPES[kind][1]
    rect(RX, y, RW, 36, "#FFFFFF", stroke, r=7)
    for d in DIVIDERS:
        path(f"M{d} {y + 7} V{y + 29}", color="#E3E0EC", w=1)
    text(C_NAME[0] + 14, y + 23, name, size=15)
    if tag:
        label, w = tag
        tf, tt = TYPES[kind][3], TYPES[kind][4]
        pill(C_NAME[1] - 14 - w / 2, y + 8, w, label, tf, tt, size=11, h=20)
    if "units" in chip:   # RVG pricing: units × the anaesthetist's rate
        pill(mid(C_PRICING), y + 8, 112, chip, "#C4EDD2", "#1D6B3B", size=11.5, h=20, stroke="#8FCBA2")
    else:
        pill(mid(C_PRICING), y + 8, 112, chip, CHIP, CHIP_T, size=11.5, h=20)
    text(mid(C_PRICE), y + 23, value, size=15, weight=700, anchor="middle")
    if adjustable:
        pill(mid(C_CHANGE), y + 8, 112, "Yes, with reason", "#CDE8FA", "#1B5C8A", size=11.5, h=20)
    else:
        pill(mid(C_CHANGE), y + 8, 112, "No, locked", "#D9D9E0", "#3C3C46", size=11.5, h=20)
    payer = {"Patient": ("#FFE1C4", "#9A4A0B", "#F0A868"),    # a person
             "Insurer": ("#DDE3F4", "#2E3F7A", "#9AA9D6"),    # indigo
             "Hospital": ("#D3EFEC", "#0D5F57", "#7CC6BE")}   # teal
    pf, pt, ps = payer[billed]
    pill(mid(C_BILL), y + 7, 84, billed, pf, pt, size=12, h=22, stroke=ps, weight=600)

y = 348
t, y = group(y, "rvg", "RVG-style", None,
             ["The system generates No contract (RVG) for every procedure, from its RVG code. AA authors extra RVG-style",
              "contracts where complexity changes the base units, as the RVG guide does (T2 lists both 4 and 5 units)."],
             n_rows=2)
row(t + 44, "rvg", "No contract (RVG)", "6 units × rate", "$1,150", True, "Patient", ("System generated · always first", 196))
row(t + 86, "rvg", "Face Lift · Complex", "10 units × rate", "$1,600", True, "Patient", ("Authored by AA", 104))
t, y = group(y, "third", "Third party · Insurer", ("Shown when an insurer pays", 200),
             ["An insurer that pays AA directly at an agreed price."])
row(t + 44, "third", "Southern Cross Health Society", "Fixed price", "$1,980", False, "Insurer", ("Submitted by insurer", 134))
t, y = group(y, "third", "Third party · Hospital", ("Shown for the List's hospital", 210),
             ["A hospital that pays AA at an agreed price."])
row(t + 44, "third", "Southern Cross Hospital", "Fixed price", "$2,250", False, "Hospital", ("Submitted by hospital", 138))
t, y = group(y, "third", "Third party · Surgeon", ("Shown for the List's surgeon", 202),
             ["The surgeon's rooms agree a price for each level of work with AA, but the patient pays."], n_rows=3)
row(t + 44, "third", "Merivale · Face lift", "Fixed price", "$3,565", False, "Patient", ("Submitted by surgeon", 136))
row(t + 86, "third", "Merivale · Facelift + 1 add on", "Fixed price", "$3,910", False, "Patient", ("Submitted by surgeon", 136))
row(t + 128, "third", "Merivale · Facelift + 2 add ons", "Fixed price", "$4,255", False, "Patient", ("Submitted by surgeon", 136))
t, y = group(y, "first", "First party · Anaesthetist", ("Their own bookings only", 176),
             ["An anaesthetist's own price list, for example for prepaid cosmetic work."], n_rows=2)
row(t + 44, "first", "Dr B. Smith · Face lift", "Fixed price", "$3,200", True, "Patient", ("Supplied by anaesthetist", 152))
row(t + 86, "first", "Dr B. Smith · Face lift, complex", "Fixed price", "$3,900", True, "Patient", ("Supplied by anaesthetist", 152))


# ================= Right: the steps a user takes =================
RX0, RWID = CX0 + CW + 15, 390
rect(RX0, 72, RWID, 1106, "#F1EDFD", LAV_S, r=12)
text(RX0 + 18, 110, "How a user chooses", size=27, weight=800)
lines(RX0 + 18, 136, ["Office at booking setup; the anaesthetist", "can change it later on the card."],
      size=14, lh=18, fill=MUTED)

def step(y, n, title, body, chip=None, chip_fill=None, chip_stroke=None, h=None):
    h = h or (50 if not body else 40 + 17 * len(body))
    rect(RX0 + 16, y, RWID - 32, h, "#FFFFFF", "#DCD3F5", r=9)
    a(f'<circle cx="{RX0 + 40}" cy="{y + 24}" r="12" fill="#3B8FD6"/>')
    text(RX0 + 40, y + 29, str(n), size=13.5, weight=700, fill="#FFFFFF", anchor="middle")
    text(RX0 + 62, y + 29, title, size=15.5, weight=700)
    if chip:
        cw = 9 * len(chip) + 18
        rect(RX0 + RWID - 30 - cw, y + 11, cw, 26, chip_fill, chip_stroke, r=6, sw=1.4)
        text(RX0 + RWID - 30 - cw / 2, y + 29, chip, size=14, weight=600, anchor="middle")
    if body:
        lines(RX0 + 62, y + 50, body, size=12.5, lh=17, fill=MUTED)
    return y + h + 10

def type_key(y, x):
    for k, label in [("rvg", "RVG-style"), ("third", "Third party"), ("first", "First party")]:
        fill, stroke, _, tf, tt = TYPES[k]
        w = 7 * len(label) + 18
        rect(x, y, w, 22, fill, stroke, r=11, sw=1.2)
        text(x + w / 2, y + 15, label, size=11.5, weight=600, fill=tt, anchor="middle")
        x += w + 6

y = 162
y = step(y, 1, "Body section", None, "01 - Head", GRN, GRN_S)
y = step(y, 2, "Subgroup", None, "00 - General", SUB, SUB_S)
y = step(y, 3, "Procedure", None, "Face Lift - H3", PEACH, PEACH_S)
s4 = y
y = step(y, 4, "Contract", ["No contract (RVG) is always first. Below it,",
                            "only the contracts that fit this booking."], h=110)
type_key(s4 + 80, RX0 + 62)
y = step(y, 5, "Who pays", ["If the patient pays, their name and email fill",
                            "in automatically. Change them to a parent or",
                            "guardian if needed."], h=96)
y = step(y, 6, "Price", ["Locked on third-party contracts. On RVG-style",
                         "and first-party contracts the anaesthetist can",
                         "set a price or discount, with a reason."], h=96)

rect(RX0 + 16, y + 6, RWID - 32, 164, YEL, YEL_S, r=9)
text(RX0 + 32, y + 32, "Good to know", size=15.5, weight=700)
notes = ["Changing the contract never changes the procedure.",
         "Either can change until the List is submitted;",
         "the office sees the change at review.",
         "Pre-approval fell through on the day? Switch to",
         "No contract (RVG) and the patient is billed.",
         "A $0 price gives a no-charge invoice."]
bullets = {0, 1, 3, 5}
for i, s_ in enumerate(notes):
    if i in bullets:
        text(RX0 + 32, y + 56 + 19 * i, "•", size=13)
    text(RX0 + 44, y + 56 + 19 * i, s_, size=13)

# ================= Bottom bar =================
rect(20, 1191, W - 40, 40, YEL, YEL_S, r=10)
a(f'<text x="{W / 2}" y="1218" font-size="19" fill="#1B1B1F" text-anchor="middle">'
  '<tspan font-weight="800">Find a procedure:</tspan> Body section → Subgroup → Procedure'
  '<tspan dx="14">·</tspan><tspan dx="14" font-weight="800">Then pick its contract:</tspan> '
  'No contract (RVG) first, then other contracts that fit the booking</text>')

a('</svg>')
open(sys.argv[1], "w").write("\n".join(out))
