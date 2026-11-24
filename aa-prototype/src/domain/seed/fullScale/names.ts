/**
 * The full-scale practice's people, chosen by hand (US-15.0.4): the 71
 * anaesthetists who join the demo's 14, the 24 generated surgeons, and the
 * patient name pools, one per ethnicity code the seed uses.
 *
 * Fixed, never drawn, so the practice reads like AA's: common, easy-to-read
 * names, an even split of women and men, and roughly New Zealand's mix (the 85
 * together are about 55% European, 19% Māori, 18% Asian, 6% Pacific, 2% MELAA).
 * Every surname is unique across the cast, the cast and directory surgeons and
 * each other, so "Dr Surname" (`drSurname`) is never ambiguous, and so are the
 * 85's initials, so no two avatars look alike; no surname has a
 * particle, hyphen or apostrophe, so `surnameOf` and `initialsOf` read it.
 *
 * The patient pools leave out the surnames of every patient the demo guide
 * names, so a guide patient stays the only one of that name at full scale.
 * All fictional.
 */

/** NZ Census Level 1 groups, as the roster's balance test counts them. */
export type RosterGroup = 'European' | 'Māori' | 'Asian' | 'Pacific' | 'MELAA'

/**
 * How much an anaesthetist works with AA (`FULL_SCALE.workProfiles`): full time,
 * part time (with whole weekdays off), or a light load (a session or two a week).
 */
export type WorkProfile = 'full' | 'part' | 'light'

export interface RosterAnaesthetist {
  first: string
  last: string
  /** For the roster's balance test only: the Anaesthetist record holds no sex. */
  sex: 'F' | 'M'
  group: RosterGroup
  profile: WorkProfile
  /** A new starter joining inside the scheduling horizon (no Slot, List or invoice before it). */
  startsISO?: string
}

const a = (first: string, last: string, sex: 'F' | 'M', group: RosterGroup, profile: WorkProfile, startsISO?: string): RosterAnaesthetist => ({
  first,
  last,
  sex,
  group,
  profile,
  ...(startsISO !== undefined ? { startsISO } : {}),
})

/**
 * The 71, in registration order (60001 up). The first six keep prepaid price
 * lists with the office (`FULL_SCALE.prepaidPriceListAnaesthetists`), so none
 * of them is a new starter. Profiles: 32 full, 28 part, 11 light.
 */
export const FULL_SCALE_ANAESTHETISTS: readonly RosterAnaesthetist[] = [
  a('Rachel', 'Thompson', 'F', 'European', 'full'),
  a('Ewan', 'Campbell', 'M', 'European', 'full'),
  a('Grace', 'Wong', 'F', 'Asian', 'full'),
  a('Wiremu', 'Karaka', 'M', 'Māori', 'part'),
  a('Sophie', 'Anderson', 'F', 'European', 'part'),
  a('Rohan', 'Gupta', 'M', 'Asian', 'full'),
  a('Claire', 'Robertson', 'F', 'European', 'full'),
  a('Gavin', 'Stewart', 'M', 'European', 'full'),
  a('Mereana', 'Tipene', 'F', 'Māori', 'full'),
  a('David', 'Wilson', 'M', 'European', 'light'),
  a('Jessica', 'Taylor', 'F', 'European', 'part'),
  a('Kevin', 'Zhou', 'M', 'Asian', 'full'),
  a('Leilani', 'Faleolo', 'F', 'Pacific', 'part'),
  a('Nathan', 'Clarke', 'M', 'European', 'full'),
  a('Hayley', 'Murray', 'F', 'European', 'part'),
  a('Tamati', 'Kingi', 'M', 'Māori', 'full'),
  a('Anjali', 'Mehta', 'F', 'Asian', 'part'),
  a('Simon', 'Harris', 'M', 'European', 'full'),
  a('Laura', 'Mackenzie', 'F', 'European', 'light'),
  a('Peter', 'Johnston', 'M', 'European', 'part'),
  a('Ana', 'Tamihana', 'F', 'Māori', 'part'),
  a('Omar', 'Haddad', 'M', 'MELAA', 'full'),
  a('Fiona', 'McLeod', 'F', 'European', 'full'),
  a('Richard', 'Allan', 'M', 'European', 'light'),
  a('Michelle', 'Liang', 'F', 'Asian', 'full'),
  a('Tevita', 'Fifita', 'M', 'Pacific', 'full'),
  a('Amy', 'Watson', 'F', 'European', 'part'),
  a('Hamish', 'Grant', 'M', 'European', 'full'),
  a('Kiri', 'Pomare', 'F', 'Māori', 'part'),
  a('Jason', 'Yang', 'M', 'Asian', 'part'),
  a('Olivia', 'Bryant', 'F', 'European', 'full'),
  a('Dean', 'Fletcher', 'M', 'European', 'part'),
  a('Kavya', 'Reddy', 'F', 'Asian', 'part', '2026-09-01'),
  a('Shane', 'Waaka', 'M', 'Māori', 'full'),
  a('Lucy', 'Henderson', 'F', 'European', 'part'),
  a('Chris', 'Macdonald', 'M', 'European', 'full'),
  a('Malia', 'Aumua', 'F', 'Pacific', 'light'),
  a('Arjun', 'Prasad', 'M', 'Asian', 'full'),
  a('Megan', 'Wallace', 'F', 'European', 'full'),
  a('Daniel', 'Hunter', 'M', 'European', 'part'),
  a('Huia', 'Tawhiri', 'F', 'Māori', 'full'),
  a('Matthew', 'Kelly', 'M', 'European', 'light'),
  a('Anna', 'Visser', 'F', 'European', 'part'),
  a('Joon', 'Choi', 'M', 'Asian', 'full'),
  a('Emily', 'Parsons', 'F', 'European', 'full'),
  a('Greg', 'Lawson', 'M', 'European', 'part'),
  a('Thandi', 'Mokoena', 'F', 'MELAA', 'part'),
  a('Matiu', 'Herewini', 'M', 'Māori', 'part'),
  a('Zoe', 'Hall', 'F', 'European', 'light'),
  a('Scott', 'Duncan', 'M', 'European', 'full'),
  a('Joy', 'Santos', 'F', 'Asian', 'part'),
  a('Nuwan', 'Perera', 'M', 'Asian', 'full'),
  a('Charlotte', 'Ward', 'F', 'European', 'part'),
  a('Ian', 'Baxter', 'M', 'European', 'light'),
  a('Jade', 'Poutama', 'F', 'Māori', 'full'),
  a('Teina', 'Tangaroa', 'M', 'Pacific', 'part'),
  a('Natasha', 'Kowalski', 'F', 'European', 'full'),
  a('Erik', 'Jensen', 'M', 'European', 'part'),
  a('Yuki', 'Tanaka', 'F', 'Asian', 'light'),
  a('Manu', 'Rihari', 'M', 'Māori', 'full'),
  a('Helen', 'Shaw', 'F', 'European', 'part'),
  a('Craig', 'Donaldson', 'M', 'European', 'full'),
  a('Vika', 'Havili', 'F', 'Pacific', 'part'),
  a('Minh', 'Nguyen', 'M', 'Asian', 'part', '2026-10-05'),
  a('Georgia', 'Burns', 'F', 'European', 'light'),
  a('Liam', 'Pearce', 'M', 'European', 'full'),
  a('Ngaio', 'Tahana', 'F', 'Māori', 'light'),
  a('Piripi', 'Hohaia', 'M', 'Māori', 'part'),
  a('Nicola', 'Barrett', 'F', 'European', 'full'),
  a('Oscar', 'Reeves', 'M', 'European', 'light'),
  a('Bridget', 'Morgan', 'F', 'European', 'part'),
]

export interface RosterSurgeon {
  title: 'Mr' | 'Ms'
  first: string
  last: string
  /** The first three are eye surgeons (Christchurch Eye Surgery's Lists). */
  eye?: true
}

/** The 24 generated surgeons, shown as "Ms R. Hollis" like the cast. */
export const FULL_SCALE_SURGEONS: readonly RosterSurgeon[] = [
  { title: 'Ms', first: 'Rose', last: 'Hollis', eye: true },
  { title: 'Mr', first: 'Daniel', last: 'Kwan', eye: true },
  { title: 'Ms', first: 'Sunita', last: 'Bhatia', eye: true },
  { title: 'Mr', first: 'Graham', last: 'Cartwright' },
  { title: 'Ms', first: 'Louise', last: 'Ferguson' },
  { title: 'Mr', first: 'Hone', last: 'Paku' },
  { title: 'Ms', first: 'Jane', last: 'Whitmore' },
  { title: 'Mr', first: 'Aperahama', last: 'Rangihuna' },
  { title: 'Ms', first: 'Erin', last: 'Lambert' },
  { title: 'Mr', first: 'Keli', last: 'Leota' },
  { title: 'Ms', first: 'Clare', last: 'Gallagher' },
  { title: 'Mr', first: 'Raj', last: 'Desai' },
  { title: 'Ms', first: 'Heather', last: 'Kerr' },
  { title: 'Mr', first: 'Nathaniel', last: 'Tuhiwai' },
  { title: 'Ms', first: 'May', last: 'Fung' },
  { title: 'Mr', first: 'Bruce', last: 'Howell' },
  { title: 'Ms', first: 'Tupou', last: 'Kaufusi' },
  { title: 'Mr', first: 'James', last: 'Oakley' },
  { title: 'Ms', first: 'Azadeh', last: 'Rahimi' },
  { title: 'Mr', first: 'William', last: 'Brooke' },
  { title: 'Ms', first: 'Nina', last: 'Paterson' },
  { title: 'Mr', first: 'Satoshi', last: 'Ito' },
  { title: 'Ms', first: 'Frances', last: 'Holmes' },
  { title: 'Mr', first: 'Liam', last: 'Moore' },
]

// ---------------------------------------------------------------------------
// Patient name pools, one per ethnicity code (`ETHNICITY_DEMO_SUBSET`)
// ---------------------------------------------------------------------------

export interface NamePool {
  /** The NZHIS Level 4 code a patient drawn from this pool carries. */
  code: string
  /** Relative share of patients (about the 2023 Census mix, prioritised). */
  weight: number
  female: readonly string[]
  male: readonly string[]
  surnames: readonly string[]
  /** Share of first names taken from the European pool (common English names). */
  englishFirstShare?: number
  /** Share of surnames taken from the European pool. */
  englishSurnameShare?: number
}

const EUROPEAN_FEMALE = [
  'Sarah', 'Emma', 'Olivia', 'Charlotte', 'Sophie', 'Jessica', 'Hannah', 'Emily', 'Rebecca', 'Laura',
  'Megan', 'Rachel', 'Nicola', 'Kate', 'Amy', 'Lucy', 'Claire', 'Anna', 'Helen', 'Susan',
  'Karen', 'Julie', 'Michelle', 'Jennifer', 'Linda', 'Margaret', 'Barbara', 'Judith', 'Christine', 'Janet',
  'Gillian', 'Joanne', 'Lisa', 'Amanda', 'Rose', 'Ella', 'Isla', 'Ruby', 'Zoe', 'Holly',
  'Georgia', 'Brooke', 'Kim', 'Tracey', 'Heather', 'Alison', 'Pauline', 'Wendy', 'Jill', 'Ann',
] as const

const EUROPEAN_MALE = [
  'James', 'John', 'David', 'Michael', 'Peter', 'Andrew', 'Mark', 'Paul', 'Richard', 'Stephen',
  'Robert', 'Chris', 'Daniel', 'Matthew', 'Thomas', 'Benjamin', 'Samuel', 'Jack', 'Oliver', 'William',
  'Liam', 'Noah', 'Ethan', 'Lucas', 'Jacob', 'Ryan', 'Luke', 'Nathan', 'Adam', 'Scott',
  'Craig', 'Grant', 'Wayne', 'Brian', 'Kevin', 'Murray', 'Neil', 'Ian', 'Graham', 'Keith',
  'Bruce', 'Colin', 'Gary', 'Glenn', 'Shane', 'Tony', 'Dean', 'Brett', 'Hamish', 'Angus',
] as const

const EUROPEAN_SURNAMES = [
  'Smith', 'Jones', 'Williams', 'Brown', 'Wilson', 'Taylor', 'Johnson', 'White', 'Martin', 'Anderson',
  'Thompson', 'Robinson', 'Harris', 'Clark', 'Lewis', 'Young', 'King', 'Wright', 'Scott', 'Green',
  'Baker', 'Adams', 'Hill', 'Campbell', 'Stewart', 'Murray', 'Macdonald', 'Robertson', 'Reid', 'Ross',
  'Wood', 'Hughes', 'Edwards', 'Cooper', 'Morris', 'Ward', 'Turner', 'Collins', 'Hall', 'Allen',
  'Mason', 'Watson', 'Kelly', 'Murphy', 'Ryan', 'Sullivan', 'Gordon', 'Grant', 'Hamilton', 'Johnston',
  'Russell', 'Henderson', 'Burns', 'Shaw', 'Duncan', 'McKenzie', 'Cameron', 'Chapman', 'Marshall', 'Simpson',
  'Barker', 'Fisher', 'Harvey', 'Knight', 'Lane', 'Payne', 'Riddell', 'Stevens', 'Webb', 'Wells',
  'Jansen', 'Dekker', 'Bakker', 'Visser', 'Muller', 'Novak', 'Nielsen', 'Larsen', 'Olsen', 'Kowalski',
] as const

export const PATIENT_NAME_POOLS: readonly NamePool[] = [
  { code: '11111', weight: 110, female: EUROPEAN_FEMALE, male: EUROPEAN_MALE, surnames: EUROPEAN_SURNAMES },
  { code: '61118', weight: 14, female: EUROPEAN_FEMALE, male: EUROPEAN_MALE, surnames: EUROPEAN_SURNAMES },
  {
    code: '21111',
    weight: 34,
    female: ['Aroha', 'Mere', 'Hine', 'Moana', 'Ngaire', 'Kiri', 'Huia', 'Anahera', 'Marama', 'Kahurangi', 'Ataahua', 'Manaia', 'Tui', 'Awhina', 'Maia', 'Ngaio', 'Hana', 'Waimarie', 'Ariana', 'Kaia'],
    male: ['Wiremu', 'Hemi', 'Rawiri', 'Tama', 'Nikau', 'Rangi', 'Tamati', 'Matiu', 'Piripi', 'Hone', 'Manaia', 'Ihaia', 'Rewiti', 'Eru', 'Kauri', 'Mikaere', 'Tane', 'Rewi', 'Hohepa', 'Kahu'],
    surnames: ['Henare', 'Parata', 'Ratima', 'Tipene', 'Karaka', 'Kingi', 'Pomare', 'Tawhiri', 'Herewini', 'Poutama', 'Rihari', 'Tahana', 'Hohaia', 'Waaka', 'Tamihana', 'Manihera', 'Rapana', 'Hetaraka', 'Tomoana', 'Pene', 'Rakena', 'Waititi', 'Kawana', 'Horomona', 'Tautahi', 'Mataira', 'Moke', 'Paora', 'Wihongi', 'Hika'],
    englishFirstShare: 0.35,
    englishSurnameShare: 0.35,
  },
  {
    code: '31111',
    weight: 8,
    female: ['Sina', 'Malia', 'Leilani', 'Lagi', 'Tasi', 'Fetu', 'Alofa', 'Mele', 'Lusia', 'Ana', 'Tina', 'Masina'],
    male: ['Sione', 'Iosefa', 'Tavita', 'Pita', 'Ioane', 'Falani', 'Lui', 'Sefo', 'Fili', 'Mikaele', 'Simi', 'Aleki'],
    surnames: ['Faleolo', 'Aumua', 'Ioane', 'Mete', 'Leota', 'Fonoti', 'Sapolu', 'Tuala', 'Faamausili', 'Lemalu', 'Toleafoa', 'Pele', 'Afamasaga', 'Sua', 'Vaai'],
    englishFirstShare: 0.3,
  },
  {
    code: '32111',
    weight: 4,
    female: ['Tiare', 'Mii', 'Ngaire', 'Teina', 'Mata', 'Poko', 'Tepaeru', 'Rima'],
    male: ['Teina', 'Tangi', 'Tauraki', 'Ruatoka', 'Turua', 'Mana', 'Tuaine', 'Tere'],
    surnames: ['Tangaroa', 'Marsters', 'Tuara', 'Pokoati', 'Tupa', 'Teariki', 'Napa', 'Tutai', 'Raea', 'Mataio'],
    englishFirstShare: 0.35,
  },
  {
    code: '33111',
    weight: 4,
    female: ['Mele', 'Salote', 'Losana', 'Ana', 'Lesieli', 'Seini', 'Vika', 'Ofa'],
    male: ['Tevita', 'Sione', 'Viliami', 'Siosaia', 'Sitani', 'Feleti', 'Semisi', 'Kepu'],
    surnames: ['Fifita', 'Havili', 'Taufa', 'Kaufusi', 'Vea', 'Lolohea', 'Tonga', 'Moala', 'Fonua', 'Latu', 'Maka', 'Pulu'],
    englishFirstShare: 0.25,
  },
  {
    code: '41111',
    weight: 6,
    female: ['Maria', 'Angelica', 'Rowena', 'Kristine', 'Joy', 'Marites', 'Cristina', 'Jasmine', 'Grace', 'Rosalie'],
    male: ['Jose', 'Mark', 'Ramon', 'Paolo', 'Rodel', 'Jun', 'Christian', 'Arnel', 'Rommel', 'Marlon'],
    surnames: ['Santos', 'Reyes', 'Cruz', 'Bautista', 'Garcia', 'Mendoza', 'Pascual', 'Villanueva', 'Ramos', 'Aquino', 'Castillo', 'Navarro'],
  },
  {
    code: '42111',
    weight: 12,
    female: ['Mei', 'Ling', 'Xiu', 'Yan', 'Hui', 'Jing', 'Fang', 'Li', 'Ying', 'Qian'],
    male: ['Wei', 'Jun', 'Hao', 'Ming', 'Jian', 'Bo', 'Lei', 'Tao', 'Yong', 'Zhen'],
    surnames: ['Wong', 'Zhou', 'Liang', 'Yang', 'Wang', 'Zhang', 'Liu', 'Huang', 'Wu', 'Lin', 'Zhao', 'Ho', 'Lau', 'Chan', 'Ma', 'Sun', 'Guo', 'He'],
    englishFirstShare: 0.4,
  },
  {
    code: '43111',
    weight: 12,
    female: ['Anjali', 'Kavya', 'Pooja', 'Sunita', 'Neha', 'Divya', 'Meera', 'Asha', 'Shreya', 'Ritu', 'Anita', 'Kiran'],
    male: ['Rohan', 'Arjun', 'Vikram', 'Rahul', 'Sanjay', 'Amit', 'Ravi', 'Anil', 'Deepak', 'Suresh', 'Harpreet', 'Karan'],
    surnames: ['Mehta', 'Gupta', 'Reddy', 'Prasad', 'Singh', 'Kaur', 'Kumar', 'Desai', 'Shah', 'Joshi', 'Pillai', 'Rao', 'Naidu', 'Chand', 'Lal', 'Verma'],
    englishFirstShare: 0.1,
  },
  {
    code: '51111',
    weight: 2,
    female: ['Leila', 'Mariam', 'Yasmin', 'Noor', 'Sara', 'Fatima'],
    male: ['Omar', 'Ali', 'Hassan', 'Karim', 'Sami', 'Yusuf'],
    surnames: ['Haddad', 'Khalil', 'Nasser', 'Rahimi', 'Hosseini', 'Saleh', 'Mansour', 'Farah'],
  },
  {
    code: '52111',
    weight: 1,
    female: ['Lucia', 'Camila', 'Valentina', 'Sofia', 'Daniela', 'Gabriela'],
    male: ['Diego', 'Mateo', 'Carlos', 'Andres', 'Javier', 'Felipe'],
    surnames: ['Rodriguez', 'Gonzalez', 'Fernandez', 'Lopez', 'Martinez', 'Silva', 'Torres', 'Rojas'],
  },
  {
    code: '53111',
    weight: 1,
    female: ['Thandi', 'Amara', 'Ngozi', 'Zanele', 'Abena', 'Faith'],
    male: ['Sipho', 'Kwame', 'Tendai', 'Chidi', 'Thabo', 'Samuel'],
    surnames: ['Mokoena', 'Ndlovu', 'Mensah', 'Dube', 'Banda', 'Moyo', 'Nkosi', 'Adeyemi'],
  },
]

/** The European pool a borrowed English first name or surname comes from. */
export const ENGLISH_NAMES = { female: EUROPEAN_FEMALE, male: EUROPEAN_MALE, surnames: EUROPEAN_SURNAMES } as const

/**
 * Surnames of the patients the demo guide names: kept out of every pool, so a
 * guide patient is the only one of that name at full scale too.
 */
export const GUIDE_PATIENT_SURNAMES: ReadonlySet<string> = new Set([
  'Prentice', 'Mitchell', 'Riley', 'Chen', 'Walker', 'Nair', 'Holt', 'Ellison', 'Gray', 'Brennan',
  'Tuilagi', 'Tullett', 'Foster', 'Rewiri', 'Paewai', 'Pulley', 'Lattimer', 'Bennett', 'Petrie', 'Davies',
  'Graham', 'Kim', 'Walsh', 'Park', 'Tane',
])

export interface DrawnName {
  name: string
  first: string
  surname: string
  sex: 'F' | 'M'
  code: string
}

type Rng = () => number

function pickFrom<T>(rng: Rng, items: readonly T[]): T {
  const item = items[Math.floor(rng() * items.length)]
  if (item === undefined) throw new Error('pick from an empty pool')
  return item
}

const POOL_TOTAL = PATIENT_NAME_POOLS.reduce((s, p) => s + p.weight, 0)
const POOL_BY_CODE: ReadonlyMap<string, NamePool> = new Map(PATIENT_NAME_POOLS.map((p) => [p.code, p]))

/** The pool for an ethnicity code (European for any code outside the pools). */
export function poolFor(code: string | undefined): NamePool {
  return (code !== undefined ? POOL_BY_CODE.get(code) : undefined) ?? PATIENT_NAME_POOLS[0]!
}

/** A pool by the census weights. */
export function drawPool(rng: Rng): NamePool {
  let r = rng() * POOL_TOTAL
  for (const pool of PATIENT_NAME_POOLS) {
    if ((r -= pool.weight) < 0) return pool
  }
  return PATIENT_NAME_POOLS[0]!
}

/** A first name of the given sex from the pool (or, at the pool's share, a common English one). */
export function drawFirstName(rng: Rng, pool: NamePool, sex: 'F' | 'M'): string {
  const english = pool.englishFirstShare !== undefined && rng() < pool.englishFirstShare
  const source = english ? (sex === 'F' ? ENGLISH_NAMES.female : ENGLISH_NAMES.male) : sex === 'F' ? pool.female : pool.male
  return pickFrom(rng, source)
}

/** A surname from the pool (or, at the pool's share, a common English one). */
export function drawSurname(rng: Rng, pool: NamePool): string {
  const english = pool.englishSurnameShare !== undefined && rng() < pool.englishSurnameShare
  return pickFrom(rng, english ? ENGLISH_NAMES.surnames : pool.surnames)
}

/** A whole person: a pool by the census weights, a sex, a first name and a surname from that pool. */
export function drawPerson(rng: Rng, pool: NamePool = drawPool(rng)): DrawnName {
  const sex = rng() < 0.5 ? 'F' : 'M'
  const first = drawFirstName(rng, pool, sex)
  const surname = drawSurname(rng, pool)
  return { name: `${first} ${surname}`, first, surname, sex, code: pool.code }
}
