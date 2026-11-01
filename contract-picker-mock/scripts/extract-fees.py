#!/usr/bin/env python3
"""
Extract the mock's seed data from the real AA fee files.

Reads docs/discovery-reference/Data files/ (Group 1, Group 2, Master Fee List)
and writes src/data/generated/{procedures,rvgCodes,lines}.json. Standard
library only (openpyxl is not installed): an .xlsx is a zip of XML sheets.

The output is committed, so the app never parses spreadsheets at runtime and
the same input always gives the same seed. Re-run after the source files
change:  npm run extract

Each line is one priced row: the ANAESTHETIST's fee only (surgeon and hospital
components are dropped), held ex GST, with its code if it has one and its band
(time or size). `printed` keeps the fee as the source printed it. `contract` is the key of the
Contract it hangs under in src/data/contracts.ts.
"""

import json
import os
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
DATA = os.path.join(ROOT, 'docs', 'discovery-reference', 'Contract Files')
OUT = os.path.join(HERE, '..', 'src', 'data', 'generated')

NS = {
    'a': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
}


def read_workbook(path):
    """{sheet name: [{column letter: text}]} for every row with a value."""
    z = zipfile.ZipFile(path)
    names = z.namelist()
    shared = []
    if 'xl/sharedStrings.xml' in names:
        root = ET.fromstring(z.read('xl/sharedStrings.xml'))
        shared = [''.join(si.itertext()) for si in root.findall('a:si', NS)]
    rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    targets = {r.get('Id'): r.get('Target').lstrip('/') for r in rels}
    book = {}
    for sheet in ET.fromstring(z.read('xl/workbook.xml')).find('a:sheets', NS):
        target = targets[sheet.get('{%s}id' % NS['r'])]
        target = target if target.startswith('xl/') else 'xl/' + target
        rows = []
        for row in ET.fromstring(z.read(target)).iter('{%s}row' % NS['a']):
            cells = {}
            for c in row.findall('a:c', NS):
                v = c.find('a:v', NS)
                kind = c.get('t')
                if kind == 'inlineStr':
                    val = ''.join(c.itertext())
                elif v is None:
                    continue
                elif kind == 's':
                    val = shared[int(v.text)]
                else:
                    val = v.text
                val = (val or '').strip()
                if val and val != 'None':
                    cells[re.sub(r'\d', '', c.get('r'))] = val
            if cells:
                rows.append(cells)
        book[sheet.get('name').strip()] = rows
    return book


def clean(text):
    """One line, single spaces, en/em dashes as a plain hyphen (UI copy rule)."""
    text = re.sub(r'\s+', ' ', text or '').strip()
    return text.replace('–', '-').replace('—', '-').replace('’', "'")


def money(text):
    try:
        return round(float(str(text).replace('$', '').replace(',', '')), 2)
    except ValueError:
        return None


LINES = []
SEEN = set()


def add(contract, description, fee, gst, code=None, band=None, add_on=False, approx=False, source=''):
    if fee is None or fee <= 0:
        return
    # Every price is held ex GST. A GST-inclusive figure is divided by 1.15 (NZ GST)
    # and rounded to the cent; `printed` keeps the figure as the source shows it.
    printed = f'{fee:g} {gst} GST' if gst != 'unstated' else f'{fee:g}, GST not stated'
    if gst == 'incl':
        fee, gst = round(fee / 1.15, 2), 'excl'
    description = clean(description)
    code = clean(code) or None
    band = clean(band) or None
    key = (contract, code, description, band, fee)
    if key in SEEN:  # sources repeat rows (HNZ squint, the GA add-on); keep one
        return
    SEEN.add(key)
    add_on = add_on or bool(re.search(r'\badd[ -]?on\b|\badd to\b|\badded to\b|\badd \$|\baddn\b', description, re.I))
    LINES.append({
        'id': f'{contract}:{len([l for l in LINES if l["contract"] == contract]) + 1}',
        'contract': contract,
        'code': code,
        'description': description,
        'fee': fee,
        'gst': gst,
        'band': band,
        'addOn': add_on,
        'approx': approx,
        'source': source,
        'printed': printed,
    })


def path(*parts):
    return os.path.join(DATA, *parts)


# ── Procedures (approach 1's medium list) and RVG groups ─────────────────────
master = read_workbook(path('Master Fee List.xlsx'))
procedures = []
for row in master['Procedures'][1:]:
    if not row.get('C'):
        continue
    units = row.get('E')
    procedures.append({
        'id': f'p{len(procedures) + 1}',
        'section': clean(row.get('A')),
        'subgroup': clean(row.get('B')),
        'name': clean(row.get('C')),
        'rvg': clean(row.get('D')) or None,
        'baseUnits': clean(units) or None,
    })

old = read_workbook(path('Master Fee List OLD.xlsx'))
rvg_codes = []
for row in old['RVG Codes']:
    if row.get('B') != 'Base units' or not row.get('A'):
        continue
    rvg_codes.append({
        'code': row['A'],
        'region': clean(row.get('C')),
        'sub': clean(row.get('D')) or None,
        'description': clean(row.get('E')),
        'baseUnits': int(float(row['F'])) if row.get('F') else None,
        'maxUnits': int(float(row['G'])) if row.get('G') else None,
    })

# ── Southern Cross Affiliated Provider: the four SXAP PDF schedules ──────────
# The OLD master holds faithful transcriptions of the PDFs (SRC-03, 05, 06, 07).
# Each SXAP PDF is its own Contract (schedule), all held by Southern Cross.
SXAP_TABS = {
    'SRC-03 SXAP MIGS': 'sxap-migs',
    'SRC-05 SXAP Ectropion': 'sxap-ectropion',
    'SRC-06 SXAP Pterygium': 'sxap-pterygium',
    'SRC-07 SXAP Ptosis Bleph': 'sxap-ptosis-bleph',
}
for tab, key in SXAP_TABS.items():
    for row in old[tab]:
        if row.get('G') == 'Fee':
            add(key, row.get('D'), money(row.get('E')), 'incl', code=row.get('C'), source=f'SXAP schedule ({tab[7:]})')

# ── Christchurch Eye Surgery workbook (CESL "SKINS" file) ────────────────────
cesl = read_workbook(path('Group 2', 'ALL CESL Fixed Fee Pricing 2026 effective 1 July 2026 - SKINS.xlsx'))

# Skin lesions: the edited right-hand table carries the minutes band and the
# anaesthetist fee incl GST. Rows with a $0 anaesthetist fee have no anaesthetist.
for row in cesl['SX SKIN LESIONS 1 April 26']:
    code = row.get('N', '')
    if not re.match(r'\s*AP\d', code):
        continue
    # The short description repeats the band and a WITH/NO ANAESTHETIST tag; drop both.
    desc = re.sub(r'\s*(WITH|NO) ANAESTHETIST.*', '', clean(row.get('L')), flags=re.S)
    desc = re.sub(r'\s*Price includes.*', '', desc)
    desc = re.sub(r'\s+[<>]?\d+\s*(-\s*\d+)?\+?\s*(mins)?$', '', desc)
    add('sxap-skin-lesions', desc, money(row.get('Q')), 'incl', code=re.sub(r'\s+', '', code), band=f'{row.get("O")} mins' if row.get('O') else None, source='CESL SX skin lesions')

# Lids, entropion/ectropion and pterygium, as CES prices them for Southern Cross.
for row in cesl['SX LIDS 1 March 26']:
    if re.match(r'(AP)?\d{4}', row.get('A', '')) and row.get('E'):
        add('sx-eyes', row.get('B'), money(row.get('E')), 'incl', code=row['A'], source='CESL SX lids')

# The MIGS tab is skipped: its anaesthetist column does not line up with the
# printed SXAP MIGS schedule ($956/$545 against $950/$510), and the schedule
# itself is already under sx-affiliated.

# Cataract and vitrectomy for Southern Cross: the left table's anaesthetist
# column, then the vitrectomy time bands (Table A, "AP0163 VR Time Bracket").
# Table A steps every 5 minutes because the HOSPITAL fee does; the anaesthetist
# fee only steps per level. Runs of brackets at one anaesthetist fee become one
# band ("0-60 mins"), so 27 brackets give 9 lines. AP0163 is printed once, in the
# table's heading, and applies to every bracket.
vr_bands = []  # [first minute, last minute, anaesthetist fee]
for row in cesl['SX CAT and VR Fees 1 March 2026']:
    if re.match(r'(AP)?\d{4}', row.get('A', '')) and money(row.get('G')):
        add('chch-eyes-sxap', row.get('B'), money(row.get('G')), 'incl', code=row['A'], source='CESL SX cataract and vitrectomy')
    m = re.match(r'(\d+)-(\d+)$', row.get('S', '').strip())
    if m and money(row.get('U')):
        lo, hi, fee = int(m.group(1)), int(m.group(2)), money(row.get('U'))
        if vr_bands and vr_bands[-1][2] == fee and vr_bands[-1][1] + 1 == lo:
            vr_bands[-1][1] = hi
        else:
            vr_bands.append([lo, hi, fee])
for lo, hi, fee in vr_bands:
    add('chch-eyes-sxap', 'Vitrectomy (time band)', fee, 'incl', code='AP0163', band=f'{lo}-{hi} mins', source='CESL vitrectomy time table')

# ACC elective ophthalmology (OPT codes): anaesthetist fee incl GST.
for row in cesl['ALL ACC FEES 1 July 2026']:
    if row.get('A', '').startswith('OPT') and money(row.get('J')):
        # Column I is the anaesthetist fee the sheet itself prints ex GST.
        add('chch-eye-acc', row.get('B'), money(row.get('I')), 'excl', code=row['A'], source='CESL ACC fees')

# The CESL one-page anaesthetist guide (PDF), via its faithful transcription.
for row in old['SRC-02 CESL']:
    if row.get('G') != 'Fee':
        continue
    section = row.get('B', '')
    target = 'chch-eyes-sxap' if section.startswith('SX AP') else 'chch-eye-wcdhb' if section.startswith('HNZ') else 'chch-eye-acc'
    band = None
    m = re.match(r'(Up to 60|\d+-\d+) minutes', row.get('D', ''))
    if m:
        band = m.group(1).replace('Up to ', '<') + ' mins'
    # Its vitrectomy bands (<60, 61-90, 90-120 minutes) repeat Table A's at the
    # same fees: Table A, above, is the one kept.
    if band and target == 'chch-eyes-sxap':
        continue
    # The guide prints both; column E is its own ex-GST figure.
    add(target, ('Vitrectomy' if band else row.get('D')), money(row.get('E')), 'excl', code=row.get('C'), band=band, source='CESL anaesthetist fixed fee guide')

# ── CES to Health NZ: commitment and panel anaesthetist fees (excl GST) ──────
hnz = read_workbook(path('Group 2', 'CES HNZ Anaesthetist Fees for Commitment and Panel Contracts July 2026.xlsx'))
for row in next(iter(hnz.values())):
    if re.match(r'HNZ', row.get('A', '')) and row.get('B'):
        add('chch-eye-cdhb', row['B'], money(row.get('D')), 'excl', code=row['A'], source='CES HNZ commitment')
        add('outplaced-ces', row['B'], money(row.get('F')), 'excl', code=row['A'], source='CES HNZ panel')

# ── Surgeon arrangements ─────────────────────────────────────────────────────
for row in old['SRC-04 Merivale PS']:
    if row.get('G') == 'Fee':
        add('merivale', row.get('D'), money(row.get('E')), 'incl', source='Merivale agreed set fees')

gyn = read_workbook(path('Group 2', 'Anaesthesia Cost Estimates 20-7.xlsx'))
for row in next(iter(gyn.values())):
    if row.get('A') and money(row.get('C')):
        add('gynae-estimates', row['A'], money(row['C']), 'incl', band=f'{row.get("B")} mins', approx=True, source='Gynaecology cost estimates')

# The plastic surgeon's approximate fee card is a two-page PDF; transcribed here
# (procedure, minutes, fee), filling the procedure down as the table does.
FEE_CARD = [
    ('Lesion excision +/- flap & skin graft', [(45, 1200), (60, 1350), (75, 1450), (90, 1700)]),
    ('Carpal tunnel release', [(45, 1200), (60, 1350)]),
    ('Cubital tunnel', [(60, 1400)]),
    ('Ganglion removal', [(45, 1000), (60, 1150)]),
    ('Dupuytrens release', [(60, 1200), (75, 1350), (90, 1450), (120, 1700), (150, 2200), (180, 2600)]),
    ('4 lid blepharoplasty', [(60, 1350), (75, 1435), (90, 1650)]),
    ('Upper eyelid blepharoplasty', [(60, 1200)]),
    ('Lower eyelid blepharoplasty', [(60, 1200), (75, 1450)]),
    ('Brow & 4 lid blepharoplasty', [(180, 2800)]),
    ('Brow lift', [(90, 1850)]),
    ('Otoplasty', [(60, 1600)]),
    ('Rhinoplasty', [(90, 1850), (75, 1950), (120, 2050)]),  # 75 after 90, as printed
    ('Breast augmentation', [(90, 1950), (120, 2100)]),
    ('Breast aug & abdominoplasty', [(240, 3750), (270, 4250)]),
    ('Mastopexy', [(120, 2100), (150, 2350)]),
    ('Breast reduction', [(120, 2150), (150, 2300)]),
    ('Abdominoplasty', [(120, 2150), (150, 2650)]),
    ('Face & neck', [(240, 3400)]),
    ('Face & other facial surgery', [(270, 3800), (300, 4200), (330, 4600), (360, 4830)]),
    ('Breast reconstruction & implant', [(120, 2100)]),
    ('Breast reconstruction & lat dorsi', [(180, 2850), (210, 3150), (240, 3550), (270, 3850)]),
    ('Breast reconstruction & TRAM', [(240, 3500), (270, 3850), (300, 4300)]),
    ('Body lift', [(300, 4600)]),
    ('Thigh lift', [(90, 2050), (120, 2250)]),
    ('Brachioplasty', [(120, 2200)]),
    ('Labiaplasty', [(60, 1400)]),
    ('Fat transfer', [(60, 1450)]),
    ('Sentinel node biopsy', [(120, 1950)]),
]
for name, bands in FEE_CARD:
    for minutes, fee in bands:
        add('plastics-fee-card', name, fee, 'unstated', band=f'{minutes} mins', approx=True, source='Plastic surgeon approximate fee card')

# ── Write ────────────────────────────────────────────────────────────────────
os.makedirs(OUT, exist_ok=True)
for name, data in (('procedures', procedures), ('rvgCodes', rvg_codes), ('lines', LINES)):
    with open(os.path.join(OUT, f'{name}.json'), 'w') as f:
        json.dump(data, f, indent=1, ensure_ascii=False)
        f.write('\n')

counts = {}
for line in LINES:
    counts[line['contract']] = counts.get(line['contract'], 0) + 1
print(f'procedures {len(procedures)}, RVG groups {len(rvg_codes)}, lines {len(LINES)}')
for key, n in sorted(counts.items()):
    print(f'  {key:20} {n}')
sys.exit(0)
