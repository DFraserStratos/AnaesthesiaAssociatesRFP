/** Corpora shared by the B04 tests (node and browser). */

/** Heading text as the board renders the heading's words (B04-REQ-02.4): source, then text. */
export const HEADING_CORPUS: [md: string, text: string][] = [
  ['# fee_schedule rules', 'fee_schedule rules'],
  ['# *Emph* and __strong__ and **bold**', 'Emph and strong and bold'],
  ['# Q&amp;A', 'Q&A'],
  ['# C#', 'C#'],
  ['# Title ##', 'Title'],
  ['# ~~old~~ new', 'old new'],
  ['# A [text][ref] here\n\n[ref]: https://example.com', 'A text here'],
  ['# A [text][nope] here', 'A [text][nope] here'],
  ['# See <https://x.y/a_b>', 'See https://x.y/a_b'],
  ['# a \\* b \\_c\\_', 'a * b _c_'],
  ['# The `fee_schedule` code', 'The fee_schedule code'],
  ['# The [rule](https://example.com) link', 'The rule link'],
  ['# 9.1 Catalogue, EP-04 Contracts', '9.1 Catalogue, EP-04 Contracts'],
  ['# snake_case_name and 2 * 3', 'snake_case_name and 2 * 3'],
  ['Setext *heading*\n===', 'Setext heading'],
  ['# *Emphasis across `a_code` span*', 'Emphasis across a_code span'],
]

/** Bodies whose links the board renders (or not) inside code: source, then the record IDs linked outside code. */
export const CODE_CORPUS: [md: string, linked: string[]][] = [
  ['Press the ` key, then see [the other story](US-01.1.2).\n\n```\ncode\n```\n', ['US-01.1.2']],
  ['A stray ` here.\n\nSee [the rule](US-01.1.1).\n\nAnd ` later.', ['US-01.1.1']],
  ['``a ` [x](US-01.1.1) ``', []],
  ['`` a `` [x](US-01.1.1)', ['US-01.1.1']],
  ['````\n```\n[x](US-01.1.1)\n````\n\n[y](US-01.1.2)', ['US-01.1.2']],
  ['~~~\n```\n[x](US-01.1.1)\n~~~\n\n[y](US-01.1.2)', ['US-01.1.2']],
  ['   ```\n[x](US-01.1.1)\n   ```', []],
  ['```\n[x](US-01.1.1)', []],
  ['\\` [x](US-01.1.1) `', ['US-01.1.1']],
  ['`[x](US-01.1.1)` and [y](US-01.1.2)', ['US-01.1.2']],
  ['![x](US-01.1.2) and [y](US-01.1.1)', ['US-01.1.1']],
  ['see [`x`](US-01.1.2) and [the `fee` rule](US-01.1.1)', ['US-01.1.2', 'US-01.1.1']],
  ['a `](US-01.1.2)` b [y](US-01.1.1)', ['US-01.1.1']],
]

/** Flowcharts covering every shape, link form, label, chain, class, comment, styling line and subgraph (B04-REQ-04.1). */
export const MERMAID_CORPUS: string[] = [
  'flowchart LR; A --> B[Label]; C[x] --> D[y]; E --o F; G@{ shape: rect }',
  'flowchart LR\n  A --> B>Flag]\n  C --x D',
  'flowchart TD\n  A@{ shape: circle, label: "Start" } --> B@{ shape: rect }',
  [
    'flowchart TB',
    '  %% a comment, with A2 --> B2 in it',
    '  A[square] --> B(round) --> C{rhombus}',
    '  D((circle)) --- E[[sub]] -.-> F[(db)]',
    '  G{{hex}} ==> H>flag] ~~~ I[/para/]',
    '  J -- yes --> K',
    '  L -->|label| M',
    '  N -. dotted .-> O',
    '  P == thick ==> Q',
    '  R o--o S x--x T <--> U',
    '  V ----> W ====> X -...-> Y',
    '  Z1 & Z2 --> Z3 & Z4',
    '  Z5:::hot --> Z6["A quoted label --> with arrow"]',
    '  subgraph group1 [The group]',
    '    direction LR',
    '    in-1 --> in-2',
    '  end',
    '  style A fill:#fff',
    '  classDef hot fill:#f00',
    '  class A,B hot',
    '  click A callback',
    '  linkStyle 0 stroke:#f00',
  ].join('\n'),
]
