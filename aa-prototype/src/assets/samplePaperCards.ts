/**
 * Two bundled sample "paper anaesthetic card" images for the Phase 03 photo
 * capture demo. They are inline SVG data URLs (self-contained, persist to
 * localStorage, no binary assets) drawn to look like a scanned handwritten
 * theatre card. The canned extraction in `flows/sampleExtractions.ts` mirrors
 * the text drawn here.
 */

function paperCard(lines: { label: string; value: string }[], ink: string): string {
  const rows = lines
    .map(
      (l, i) =>
        `<text x="34" y="${150 + i * 52}" font-family="monospace" font-size="15" fill="#8A9490">${l.label}</text>` +
        `<text x="34" y="${172 + i * 52}" font-family="'Segoe Script','Bradley Hand',cursive" font-size="24" fill="${ink}">${l.value}</text>`,
    )
    .join('')
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="440" height="560" viewBox="0 0 440 560">` +
    `<rect width="440" height="560" fill="#FBFAF6"/>` +
    `<rect x="10" y="10" width="420" height="540" fill="none" stroke="#D9D6CC" stroke-width="2"/>` +
    `<text x="34" y="58" font-family="Georgia,serif" font-size="22" fill="#172320">Anaesthetic Record</text>` +
    `<text x="34" y="84" font-family="monospace" font-size="13" fill="#8A9490">Theatre paper card · scanned</text>` +
    `<line x1="34" y1="104" x2="406" y2="104" stroke="#D9D6CC" stroke-width="1.5"/>` +
    rows +
    `</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const PAPER_CARD_A: string = paperCard(
  [
    { label: 'Patient', value: 'Wiremu Tane' },
    { label: 'NHI', value: 'ZBC1123' },
    { label: 'DOB', value: '22 / 08 / 1979' },
    { label: 'Procedure', value: 'Lap. cholecystectomy' },
    { label: 'Surgeon / list', value: 'Sthn Cross · PM' },
    { label: 'Funding', value: 'Hospital' },
  ],
  '#1F44A3',
)

export const PAPER_CARD_B: string = paperCard(
  [
    { label: 'Patient', value: 'Losa Tuilagi' },
    { label: 'NHI', value: 'JKL1188' },
    { label: 'DOB', value: '27 / 01 / 1992' },
    { label: 'Procedure', value: 'R. knee arthroscopy' },
    { label: 'Surgeon / list', value: 'Sthn Cross · PM' },
    { label: 'Funding', value: 'Insurer (nib)' },
  ],
  '#157A49',
)
