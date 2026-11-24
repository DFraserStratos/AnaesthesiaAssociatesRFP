/**
 * The seed load's sample sheets (catch-up Phase 42; US-13.4.3): one per
 * sheet, in load order, for the demo's Seed load view. Each is a small CSV in
 * the template's exact headers with a few rows that load and a few that are
 * refused, each refused row for a different rule, so a presenter can show
 * both outcomes. Every sample checks on its own against the seeded masters
 * (it names only seeded records). Names are invented; emails use `.example`.
 * Pure data: it ships into the PWA closure, so it imports only types.
 */

import type { LoadEntity } from './types'

export interface SampleSheet {
  id: string
  entity: LoadEntity
  fileName: string
  label: string
  csv: string
}

/** One CSV line (a cell with a comma, quote or line break is quoted), as `csvLine` writes it. */
function line(cells: readonly string[]): string {
  return cells.map((c) => (/[",\r\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(',')
}

function sheet(rows: readonly (readonly string[])[]): string {
  return rows.map(line).join('\n') + '\n'
}

export const SAMPLE_SHEETS: readonly SampleSheet[] = [
  {
    id: 'sample-specialties',
    entity: 'specialties',
    fileName: 'specialties.csv',
    label: 'Specialties',
    csv: sheet([
      ['Name'],
      ['Paediatric surgery'],
      ['Breast surgery'],
      // Refused: a name already held, a row with a stray second cell, a repeated row.
      ['Vascular surgery'],
      ['Colorectal surgery', 'Lower GI'],
      ['Breast surgery'],
    ]),
  },
  {
    id: 'sample-surgeons',
    entity: 'surgeons',
    fileName: 'surgeons.csv',
    label: 'Surgeons',
    csv: sheet([
      ['Name', 'Specialty', 'Practice names', 'Practice emails', 'PA names', 'HPI CPN', 'NZ registration number'],
      ['Mr Daniel Okoro', 'Orthopaedics', 'Riverside Orthopaedics', 'reception@riversideortho.example', 'Lena Hart', '31OKOD', '60123'],
      [
        'Ms Fiona Strachan',
        'General surgery; Urology',
        'Hagley Surgical; Papanui Day Clinic',
        'office@hagleysurgical.example; desk@papanuiday.example',
        'Marie Dunstan; Tui Henare',
        '32STRF',
        '60124',
      ],
      ['Dr Matthew Corrigan', 'Gynaecology', 'Avon Womens Health', 'admin@avonwomens.example', 'Grace Pike', '', '60125'],
      ['Dr Aroha', 'ENT', 'Cashmere ENT', 'hello@cashmereent.example', '', '33AROH', ''],
      ['Jane Mercer', 'Plastic surgery', 'Mercer Plastics', 'rooms@mercerplastics.example', 'Owen Blake', '34MERJ', '60127'],
      // Refused: no specialty, a specialty not on the list, a malformed HPI CPN, a held HPI CPN, a practice email that does not look right.
      ['Mr Peter Lawry', '', 'Lawry Surgical', 'office@lawrysurgical.example', '', '35LAWP', ''],
      ['Dr Nina Sorensen', 'Cardiac', 'Heartland Surgical', 'office@heartland.example', '', '36SORN', ''],
      ['Mr Callum Reeve', 'Urology', 'Reeve Urology', 'office@reeveuro.example', '', 'ABC123', ''],
      ['Ms Harriet Vane', 'Orthopaedics', 'Vane Orthopaedics', 'office@vaneortho.example', '', '40HALT', ''],
      ['Dr Simon Toleafoa', 'General surgery', 'Toleafoa Surgical', 'rooms at toleafoa', '', '38TOLS', ''],
    ]),
  },
  {
    id: 'sample-anaesthetists',
    entity: 'anaesthetists',
    fileName: 'anaesthetists.csv',
    label: 'Anaesthetists',
    csv: sheet([
      ['Registration number', 'Name', 'Email', 'Phone', 'HPI CPN', 'Rate per unit', 'Bank account name', 'Bank account number', 'Start date'],
      ['51234', 'Dr Laura Finlay', 'laura.finlay@anaesthesia.example', '021 555 0101', '36FINL', '38', 'L Finlay', '12-3456-7654321-00', '2026-09-01'],
      ['52345', 'Dr Michael Okeke', 'michael.okeke@anaesthesia.example', '021 555 0102', '37OKEM', '36.5', 'M Okeke', '02-1234-0567890-01', '2026-10-05'],
      // Refused: a held HPI CPN, a start date that is not a date, a unit value that is not a number.
      ['53456', 'Dr Rachel Ames', 'rachel.ames@anaesthesia.example', '', '20MORK', '38', 'R Ames', '12-3456-7654322-00', '2026-09-01'],
      ['54567', 'Dr Paul Whitmore', 'paul.whitmore@anaesthesia.example', '', '38WHIP', '38', 'P Whitmore', '12-3456-7654323-00', 'next month'],
      ['55678', 'Dr Sina Faleolo', 'sina.faleolo@anaesthesia.example', '', '39FALS', 'forty', 'S Faleolo', '12-3456-7654324-00', '2026-09-01'],
    ]),
  },
  {
    id: 'sample-hospitals',
    entity: 'hospitals',
    fileName: 'hospitals.csv',
    label: 'Hospitals',
    csv: sheet([
      ['Hospital name', 'Contact email'],
      ['Rangiora Day Surgery', 'bookings@rangioraday.example'],
      ['Ashburton Hospital', 'theatre@ashburton.example'],
      // Refused: already in master data, a blank name, an email that does not look right, a repeated row.
      ["St George's", 'bookings@stgeorges.example'],
      ['', 'bookings@unnamed.example'],
      ['Timaru Surgical', 'not-an-email'],
      ['Rangiora Day Surgery', 'theatre@rangioraday.example'],
    ]),
  },
  {
    id: 'sample-hospital-holidays',
    entity: 'hospitalHolidays',
    fileName: 'hospital-holidays.csv',
    label: 'Hospital holidays',
    csv: sheet([
      ['Hospital', 'Date', 'Name'],
      ['Forte Health', '2026-09-14', 'Theatre refurbishment'],
      ['Christchurch Eye Surgery', '2026-10-02', 'Staff training day'],
      // Refused: an unknown hospital, a second closure on a hospital's date, a date that is not a date.
      ['Timaru Surgical', '2026-09-21', 'Theatre maintenance'],
      ['Southern Cross', '2026-07-22', 'Second closure'],
      ["St George's", '2026-13-40', 'Sterilising upgrade'],
    ]),
  },
  {
    id: 'sample-public-holidays-2027',
    entity: 'publicHolidays',
    fileName: 'public-holidays-2027.csv',
    label: 'Public holidays 2027',
    csv: sheet([
      ['Date', 'Name', 'Kind', 'Region', 'Open hospitals'],
      ['2027-03-26', 'Good Friday', 'National', '', ''],
      ['2027-03-29', 'Easter Monday', 'National', '', ''],
      ['2027-04-26', 'ANZAC Day (observed)', 'National', '', ''],
      ['2027-06-07', "King's Birthday", 'National', '', ''],
      // Refused: a date already a public holiday, an impossible date, an unknown open hospital, a blank name.
      ['2026-12-25', 'Christmas Day', 'National', '', ''],
      ['31/02/2027', 'Mystery Day', 'National', '', ''],
      ['2027-10-25', 'Labour Day', 'National', '', 'Timaru Surgical'],
      ['2027-12-27', '', 'National', '', ''],
    ]),
  },
  {
    id: 'sample-rvg-groups',
    entity: 'rvgGroups',
    fileName: 'rvg-groups.csv',
    label: 'RVG groups',
    csv: sheet([
      ['Code', 'Description', 'Anatomy heading', 'Base units', 'Range from', 'Range to', 'Modifier units'],
      ['AA1', 'Extended monitoring in the AA rooms', 'AA own', '4', '', '', ''],
      ['AA2', 'Complex airway review, theatre', 'AA own', '8', '8', '10', ''],
      ['H1', 'Minor procedures under topical anaesthesia', 'Head', '3', '', '', ''],
      // Refused: base units 0, a range not holding the figure, a blank description, a code and description already held.
      ['AA3', 'Sedation review', 'AA own', '0', '', '', ''],
      ['AA4', 'Prolonged recovery review', 'AA own', '5', '8', '10', ''],
      ['AA5', '', 'AA own', '4', '', '', ''],
      ['SP1', 'Provision of IV sedation and/or monitoring', 'Supervision', '4', '', '', ''],
    ]),
  },
  {
    id: 'sample-modifiers',
    entity: 'modifiers',
    fileName: 'modifiers.csv',
    label: "AA's own modifiers",
    csv: sheet([
      ['Code', 'Factor', 'Units'],
      ['AAW', 'Weekend loading', '2'],
      ['AAS', 'Sitting position loading', '1'],
      ['AAD', 'Demo units', '3'],
      // Refused: a code clashing with an earlier row, a unit that is not a number, a blank factor.
      ['AAW', 'Weekend loading, public holiday', '3'],
      ['AAN', 'Night loading', 'two'],
      ['AAB', '', '1'],
    ]),
  },
  {
    id: 'sample-parties',
    entity: 'parties',
    fileName: 'parties.csv',
    label: 'Parties',
    csv: sheet([
      ['Name', 'Kind', 'Hospital', 'Billing name', 'Delivery', 'Email', 'Postal address'],
      ['Tasman Health Cover', 'Insurer', '', 'Tasman Health Cover Limited', 'Post', '', 'PO Box 1234, Christchurch 8140'],
      ['Harbour Surgical Partners', 'Surgeon group', '', 'Harbour Surgical Partners Limited', 'Email', 'accounts@harbourpartners.example', ''],
      ['Dr Kate Morrison', 'Anaesthetist', '', 'Dr Kate Morrison', 'Email', 'kate.morrison@anaesthesia.example', ''],
      // Refused: a hospital Party naming no hospital, one naming the AA rooms, the AA kind, an unknown delivery, a name already held.
      ['Rolleston Surgical Centre', 'Hospital', '', 'Rolleston Surgical Centre Limited', 'Email', 'accounts@rollestonsurgical.example', ''],
      ['AA rooms', 'Hospital', 'AA rooms', 'Anaesthesia Associates rooms', 'Email', 'rooms@aa.example', ''],
      ['AA head office', 'AA', '', 'Anaesthesia Associates Limited', 'Email', 'office@aa.example', ''],
      ['Kiwi Cover', 'Insurer', '', 'Kiwi Cover Limited', 'Courier', '', ''],
      ['nib', 'Insurer', '', 'nib nz limited', 'Email', 'claims@nib.example', ''],
    ]),
  },
  {
    id: 'sample-funding-tags',
    entity: 'fundingTags',
    fileName: 'funding-tags.csv',
    label: 'Funding tags',
    csv: sheet([
      ['Code', 'Funder'],
      ['NIBFC', 'nib'],
      ['PRIV', ''],
      // Refused: a code already held, a blank code, an unknown funder Party.
      ['SXAP', 'Southern Cross Health Society'],
      ['', 'nib'],
      ['ZZZ', 'Acme Insurance'],
    ]),
  },
  {
    id: 'sample-contracts',
    entity: 'contracts',
    fileName: 'contracts.csv',
    label: 'Contracts',
    csv: sheet([
      [
        'AA code',
        'Name',
        'Party',
        'Holder reference code',
        'Invoice description',
        'Default RVG code',
        'Bills',
        'Payment type',
        'Pricing kind',
        'Unit rate',
        'Discount (%)',
        'Fixed price',
        'Price from',
        'Anaesthetist may override',
        'Funding tag',
        'Specialties',
        'Surgeons',
        'Anaesthetist',
      ],
      ['SX-101', 'Hip arthroscopy fixed fee', 'Southern Cross', 'SXHA1', 'Anaesthesia for hip arthroscopy', '', 'Holder', 'Standard', 'Fixed price', '', '', '1850', '2026-08-01', 'No', 'SXAP', 'Orthopaedics', '', ''],
      ['STG-101', "St George's ACC elective rate", "St George's", '', '', '', 'Holder', 'Standard', "RVG at the Contract's rate", '32.50', '', '', '', 'Yes', 'ACC', '', '', ''],
      ['NIB-101', 'nib RVG less 5%', 'nib', '', '', '', 'Holder', 'Standard', 'RVG less a discount', '', '5', '', '', 'No', '', '', '', ''],
      ['SOUTER-101', 'Otoplasty', 'Dr Melanie Souter', '', 'Anaesthesia for otoplasty', '', 'Payer', 'Prepaid', 'Fixed price', '', '', '800', '2026-08-01', 'No', '', '', '', '10SOUM'],
      // Refused: a prepaid Contract priced from RVG units, an open price, an AA code already held, a prepaid Contract billing its holder, a Party with no billing details billed.
      ['SOUTER-102', 'Septoplasty', 'Dr Melanie Souter', '', '', '', 'Payer', 'Prepaid', "RVG at the anaesthetist's rate", '', '', '', '', 'No', '', '', '', '10SOUM'],
      ['CES-101', 'Cataract, open price', 'Christchurch Eye Surgery', '', '', '', 'Holder', 'Standard', 'Open price', '', '', '', '', 'No', '', '', '', ''],
      ['STG-001', "St George's RVG", "St George's", '', '', '', 'Holder', 'Standard', "RVG at the anaesthetist's rate", '', '', '', '', 'No', '', '', '', ''],
      ['SOUTER-103', 'Blepharoplasty, lower lids', 'Dr Melanie Souter', '', '', '', 'Holder', 'Prepaid', 'Fixed price', '', '', '950', '2026-08-01', 'No', '', '', '', '10SOUM'],
      ['AIA-101', 'AIA Health RVG', 'AIA Health', '', '', '', 'Holder', 'Standard', "RVG at the anaesthetist's rate", '', '', '', '', 'No', '', '', '', ''],
    ]),
  },
  {
    id: 'sample-price-ranges',
    entity: 'priceRanges',
    fileName: 'price-ranges.csv',
    label: 'Price ranges',
    csv: sheet([
      ['AA code', 'Start date', 'Price (ex GST)'],
      ['COS-002', '2027-01-01', '1300'],
      ['COS-002', '2026-03-01', '1200'],
      // Refused: a start already on the Contract, a rate Contract, an impossible date, an unknown AA code, a blank price.
      ['COS-002', '2026-08-01', '1275'],
      ['SX-002', '2027-01-01', '40'],
      ['COS-002', '2026-02-30', '1000'],
      ['ZZ-999', '2027-01-01', '100'],
      ['CES-002', '2027-01-01', ''],
    ]),
  },
]

/** The sample sheet for a sheet. */
export function sampleFor(entity: LoadEntity): SampleSheet {
  const s = SAMPLE_SHEETS.find((x) => x.entity === entity)
  if (s === undefined) throw new Error(`No sample for ${entity}`)
  return s
}
