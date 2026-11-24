import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'
import { useEffect, type MouseEvent } from 'react'
import Markdown from 'react-markdown'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import changelog from '../../CHANGELOG.md?raw'
import { ARTIFACT_STATUSES, firstLaneName } from '../../shared/types.ts'
import { StatusLabel, TypeIcon } from '../components/bits.tsx'
import { useCatalogue, useConfig } from '../store.ts'
import { ARTIFACT_STATUS_HELP, typeClass } from '../vocab.ts'
import { SNAPSHOT } from '../snapshot.ts'

/**
 * How to use the board: what it is, the loop a team goes round with it and the agent skills, what
 * is on the board, and where the files live. Statuses and lanes are read from this project's own
 * config, so the page always matches the board. `?s=<section>` scrolls to a section, so cards can
 * link straight to the part they explain. A snapshot's reader gets a page of their own: how to read
 * it and how to respond, then what is on the board.
 */
export function AboutView() {
  const [params] = useSearchParams()
  const { key } = useLocation()
  const section = params.get('s')
  // Keyed on the location too: a contents link to the section already in the URL is a new location, so it
  // scrolls there again after the reader has scrolled away (FINDINGS R-127); Back and Forward land as well.
  useEffect(() => {
    if (section) document.getElementById(`about-${section}`)?.scrollIntoView({ block: 'start' })
  }, [section, key])

  if (SNAPSHOT) return <ReaderAbout />
  return (
    <div className="page">
      <div className="page-inner about">
        <div className="page-head">
          <div>
            <h1>How to use this board</h1>
            <p>
              A requirements catalogue you keep in git, a board to read and arrange it, and Claude Code skills that keep it up to date from what your client tells you.{' '}
              <span className="mono about-version">v{__BOARD_VERSION__}</span>
            </p>
          </div>
        </div>
        <nav className="about-toc" aria-label="On this page">
          {SECTIONS.map(([id, label]) => (
            <Link key={id} to={`/about?s=${id}`}>
              {label}
            </Link>
          ))}
        </nav>
        <WhatItIs />
        <Loop />
        <Skills />
        <Anatomy />
        <Files />
        <Snapshot />
        <section id="about-version" className="about-section">
          <h2>Version</h2>
          <p className="about-lede">
            This is version <span className="mono">{__BOARD_VERSION__}</span> of the board.
          </p>
          <div className="prose about-changelog">
            <Markdown>{changelog.replace(/^# .*\n/, '')}</Markdown>
          </div>
        </section>
      </div>
    </div>
  )
}

const SECTIONS = [
  ['what', 'What it is'],
  ['loop', 'The loop'],
  ['skills', 'Skills'],
  ['board', 'On the board'],
  ['files', 'Files and commands'],
  ['snapshot', 'Sharing a snapshot'],
  ['version', 'Version'],
] as const

/** The About page in a snapshot: for someone outside the team reading it, and responding. */
function ReaderAbout() {
  const snap = useCatalogue((s) => s.snapshot)
  const project = snap?.project
  const day = snap ? new Date(snap.takenAt).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' }) : null
  return (
    <div className="page">
      <div className="page-inner about">
        <div className="page-head">
          <div>
            <h1>About this snapshot</h1>
            <p>
              A read-only copy of {project ? `the ${project}` : 'the'} requirements{day ? `, as they stood on ${day}` : ''}. Nothing you do here changes them.
            </p>
          </div>
        </div>
        <section id="about-reader" className="about-section">
          <h2>Reading and responding</h2>
          <div className="about-three">
            <div className="about-tile">
              <h3>Read</h3>
              <p>
                The Board maps every epic, feature and story; Outline lists them; Outstanding items are the questions still open; Artifacts are the diagrams, documents and
                transcripts behind them. Open anything to read it in full.
              </p>
            </div>
            <div className="about-tile">
              <h3>Respond</h3>
              <p>
                Answer an outstanding item, comment on a card or an artifact (on one highlighted spot, if one is open), or suggest an edit to a card's text. Each is kept in this
                browser as you go.
              </p>
            </div>
            <div className="about-tile">
              <h3>Send them back</h3>
              <p>
                Open <strong>Your responses</strong> at the top right, add your name, and download them. Send the file to whoever shared this board with you: your responses are
                read and worked into the requirements.
              </p>
            </div>
          </div>
          <p className="about-note">
            Responses stay only in this browser until you download them: another browser or device starts empty, and clearing your browser's data removes them.
          </p>
        </section>
        <Anatomy />
      </div>
    </div>
  )
}

/** For the team: sharing a read-only snapshot with people outside it, and reading their responses back in. */
function Snapshot() {
  return (
    <section id="about-snapshot" className="about-section">
      <h2>Sharing a snapshot</h2>
      <p className="about-lede">
        For people outside the team (a client, a reviewer): a read-only copy of the board as static files, to host anywhere. Readers answer, comment and suggest edits, and send their responses back as a file.
      </p>
      <div className="about-three">
        <div className="about-tile">
          <h3>Make one</h3>
          <p>
            <code>npm --prefix requirements-board run snapshot -- --out "&lt;folder&gt;"</code> writes the board, the catalogue as it is on disk, every screenshot and every artifact file to a folder of its own.
          </p>
        </div>
        <div className="about-tile">
          <h3>Host it</h3>
          <p>
            Any static host: GitHub Pages, Cloudflare Pages, a shared drive behind a web server. It holds the whole catalogue, so put it behind a sign-in unless it is meant to be public.
          </p>
        </div>
        <div className="about-tile">
          <h3>Read the responses</h3>
          <p>
            Each reader downloads a Markdown file: answers, comments and suggested edits, each citing its record's ID. Give it to <code>/update-requirements</code> as evidence, as you would meeting notes.
          </p>
        </div>
      </div>
      <p className="about-note">The snapshot shows no editing, history or Diff review, and never writes to the catalogue: the responses are proposals, worked in by the skill in the catalogue's own voice.</p>
    </section>
  )
}

function WhatItIs() {
  return (
    <section id="about-what" className="about-section">
      <h2>What it is</h2>
      <div className="about-three">
        <div className="about-tile">
          <h3>Files in git</h3>
          <p>
            Every epic, feature, story and question is one Markdown file in <code>requirements/</code>. Git keeps the history; a commit is a version of the requirements.
          </p>
        </div>
        <div className="about-tile">
          <h3>This board</h3>
          <p>Reads the same files and writes them back as you edit. Arrange cards, change statuses, answer questions and open the artifacts behind a requirement.</p>
        </div>
        <div className="about-tile">
          <h3>Claude's skills</h3>
          <p>Turn meetings, transcripts and decisions into changes to those files, and keep a build plan in step. Every change says where it came from.</p>
        </div>
      </div>
      <p className="about-note">
        Both routes edit the same files, and <code>npm run check</code> keeps them valid: when a file is wrong, a red pill appears in the masthead.
      </p>
    </section>
  )
}

/** A step of the loop: where it sits on the 3 × 2 ring (clockwise from the top left) and the chevron after it. */
const STEPS = [
  { n: 1, title: 'Evidence', text: 'A meeting, a transcript, an email or a decision: anything that changes what the system should do.', skill: null, next: 'right' },
  { n: 2, title: '/update-requirements', text: 'Files the evidence as a note, answers the questions it settles, updates the items and writes a change log.', skill: 'update-requirements', next: 'right' },
  { n: 3, title: 'Review on the board', text: 'Check statuses, answer outstanding questions, arrange the swimlanes. New answers go in the next update.', skill: null, next: 'down' },
  { n: 4, title: 'Commit', text: 'Commit the catalogue to git. The commit is the baseline the build plan is updated from.', skill: null, next: 'left' },
  { n: 5, title: '/update-build-plan', text: 'Pass it the commit. It re-grades the changed requirements against the app and updates the plan.', skill: 'update-build-plan', next: 'left' },
  { n: 6, title: 'Build', text: 'Paste the next phase’s kick-off prompt: /run-build-phase builds and tests it. What you learn goes to the next meeting as new evidence.', skill: 'run-build-phase', next: 'up' },
] as const

const CHEVRON = { right: ChevronRight, down: ChevronDown, left: ChevronLeft, up: ChevronUp }

function Loop() {
  return (
    <section id="about-loop" className="about-section">
      <h2>The loop</h2>
      <p className="about-lede">One turn of the loop for each meeting or decision. The skills do the writing; you review, commit and build.</p>
      <div className="loop">
        <SideInput className="loop-side-a" skill="transcript-reconciler" text="Merges duplicate transcripts of one meeting into one" />
        <SideInput className="loop-side-b" skill="add-artifact · svg-diagram" text="Add diagrams and documents for items to link to" />
        {STEPS.map((s) => {
          const Icon = CHEVRON[s.next]
          return (
            <div key={s.n} className={`loop-step loop-step-${s.n}`}>
              <div className="loop-step-head">
                <span className="loop-n">{s.n}</span>
                {s.skill ? <a href={`#about-skill-${s.skill}`} onClick={jump(`about-skill-${s.skill}`)}>{s.title}</a> : <span>{s.title}</span>}
              </div>
              <p>{s.text}</p>
              {(s.next === 'right' || s.next === 'left') && (
                <span className={`loop-arrow loop-arrow-${s.next}`} aria-hidden>
                  <Icon size={14} strokeWidth={3} />
                </span>
              )}
            </div>
          )
        })}
        <div className="loop-hub">
          <h3>The catalogue</h3>
          <p>Markdown files in git. The board and every skill read and edit the same files.</p>
          <div className="loop-hub-pills">
            {['Epics', 'Features', 'Stories', 'Questions', 'Notes', 'Change logs', 'Artifacts'].map((p) => (
              <span key={p}>{p}</span>
            ))}
          </div>
        </div>
        {/* The ring's two sides run past the catalogue: down from step 3, up from step 6 back to 1. */}
        <span className="loop-rail loop-rail-right" aria-hidden>
          <span className="loop-arrow">
            <ChevronDown size={14} strokeWidth={3} />
          </span>
        </span>
        <span className="loop-rail loop-rail-left" aria-hidden>
          <span className="loop-arrow">
            <ChevronUp size={14} strokeWidth={3} />
          </span>
          <span className="loop-return">Next meeting, round again</span>
        </span>
      </div>
      <div className="about-now-and-then">
        <strong>Now and then</strong>
        <span>
          <code>link-requirements</code> links each item to the items its text names, after many are added or reworded. <code>consistency-review</code> catches drift across the whole catalogue before a sign-off.
        </span>
      </div>
    </section>
  )
}

function SideInput({ className, skill, text }: { className: string; skill: string; text: string }) {
  return (
    <div className={`loop-side ${className}`}>
      <small>Side input</small>
      <strong>{skill}</strong>
      <span>{text}</span>
    </div>
  )
}

/** In-page links can't use the URL hash: the router owns it. */
const jump = (id: string) => (e: MouseEvent) => {
  e.preventDefault()
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

interface Skill {
  name: string
  kind: 'skill' | 'workflow'
  role: string
  when: string
  say: string
  changes: string
  then: string
}

const SKILLS: Skill[] = [
  {
    name: 'update-requirements',
    kind: 'skill',
    role: 'Step 2 of the loop',
    when: 'After a client meeting, after answering questions on the board, or to record a decision or a new feature.',
    say: "/update-requirements Here is the transcript of today's workshop with the client",
    changes: 'Files a note in notes/, fills in the answers the evidence settles, adds, rewords or retires items, raises new questions for anything left open, and writes a change log in changes/.',
    then: 'Review the changes on the board, then commit.',
  },
  {
    name: 'update-build-plan',
    kind: 'skill',
    role: 'Step 5 of the loop',
    when: 'After a requirements update is committed. With no plan yet, it makes the first one: graded in full, or seeded empty at a commit so only later changes get phases.',
    say: '/update-build-plan',
    changes: 'Re-grades the requirements that changed since the plan’s last commit against the app, re-plans the phases they touch, and updates their docs and kick-off prompts. With a phase runner set in the plan’s config, a prompt is a few lines that load /run-build-phase; the phase doc holds the rest. It never rewrites a phase already built: when every phase is built, it adds new ones, numbered on from the last, and a change a built phase left unfinished goes to a new phase.',
    then: 'Build the next phase from its kick-off prompt.',
  },
  {
    name: 'run-build-phase',
    kind: 'skill',
    role: 'Step 6 of the loop',
    when: 'To build a phase of the plan. Its kick-off prompt loads it; you can also name a phase yourself, or resume one half built.',
    say: '/run-build-phase 07',
    changes: 'Builds the phase in the app from its plan doc: reads a context pack of what the phase needs, checks whether its requirements moved since it was planned, plans and builds, runs the plan’s checks, the manual checklist and a review, updates the screenshots on its stories, then writes a progress entry and names the next phase on the plan page.',
    then: 'Read its notes and the “For the owner’s review” list, commit, and start the phase the plan page names.',
  },
  {
    name: 'add-artifact',
    kind: 'skill',
    role: 'Feeds step 3',
    when: 'You have a diagram, mockup, screenshot, transcript, note or PDF that requirements should point to.',
    say: '/add-artifact docs/checkout-flow.png is our checkout flow; link the payment stories to the card step',
    changes: 'Registers the next AR number in artifacts/, keeps the file in artifacts/files/, names highlighted regions in it (and steps, for a stepped diagram), and links the items it illustrates.',
    then: 'Open it on the Artifacts tab; each region shows the items that point at it.',
  },
  {
    name: 'svg-diagram',
    kind: 'skill',
    role: 'Feeds step 3',
    when: 'A rule or flow is easier to agree on as a picture, or a flow that unfolds is easier to follow one step at a time.',
    say: '/svg-diagram Draw how an order moves from basket to delivery, in the house style',
    changes: 'Draws the diagram as an SVG in the board’s house style, with a region per part (and for a stepped diagram, the steps the board plays through), and saves it as an artifact.',
    then: 'Check it on the Artifacts tab, stepping through it if it has steps, and ask for changes in plain words.',
  },
  {
    name: 'transcript-reconciler',
    kind: 'skill',
    role: 'Feeds step 1',
    when: 'You have two or more imperfect transcripts of the same recording (Teams, Zoom, Otter, Word and the like).',
    say: "/transcript-reconciler Merge these two transcripts of Tuesday's workshop",
    changes: 'Writes one speaker-attributed Markdown transcript, the best of each source, with genuine doubt marked and nothing summarised.',
    then: 'Hand it to /update-requirements.',
  },
  {
    name: 'consistency-review',
    kind: 'skill',
    role: 'Now and then',
    when: 'After several updates, or before asking the client to sign off.',
    say: '/consistency-review',
    changes: 'Nothing until you say so. It builds a list of the current rulings for you to check, then proposes exact edits on a local review page; only the edits you accept are applied.',
    then: 'Commit the accepted edits.',
  },
  {
    name: 'link-requirements',
    kind: 'workflow',
    role: 'Now and then',
    when: 'After many items are added or reworded.',
    say: 'Run the link-requirements workflow over the epics I changed today',
    changes: 'Proposes links between items (in their text and as related items), checks each one adversarially, and applies them after a dry run.',
    then: 'Follow the new links on the board.',
  },
]

function Skills() {
  return (
    <section id="about-skills" className="about-section">
      <h2>Skills</h2>
      <p className="about-lede">
        Type the command in Claude Code at the root of your repo. Each skill reads <code>requirements/SCHEMA.md</code> first and leaves committing to you; only <code>/run-build-phase</code> commits, and only when its kick-off prompt allows it.
      </p>
      <div className="skill-cards">
        {SKILLS.map((s) => (
          <article key={s.name} id={`about-skill-${s.name}`} className="skill-card">
            <header>
              <h3 className="mono">{s.kind === 'skill' ? `/${s.name}` : s.name}</h3>
              <span className="skill-role">{s.role}</span>
            </header>
            <dl>
              <dt>When</dt>
              <dd>{s.when}</dd>
              <dt>Say</dt>
              <dd>
                <code className="skill-say">{s.say}</code>
              </dd>
              <dt>Changes</dt>
              <dd>{s.changes}</dd>
              <dt>Then</dt>
              <dd>{s.then}</dd>
            </dl>
          </article>
        ))}
      </div>
    </section>
  )
}

function Anatomy() {
  const config = useConfig()
  const layout = useCatalogue((s) => s.layout)
  const lanes = [firstLaneName(layout), ...layout.lanes]
  return (
    <section id="about-board" className="about-section">
      <h2>On the board</h2>
      <div className="about-two">
        <div className="about-tile">
          <h3>Epics, features and stories</h3>
          <div className="about-tree">
            {(
              [
                ['epic', 'Epic', 'A large area of the system'],
                ['feature', 'Feature', 'Something it does, inside an epic'],
                ['story', 'Story', 'One thing a person can do, inside a feature'],
              ] as const
            ).map(([t, name, text], i) => (
              <div key={t} className={`about-tree-row ${typeClass(t)}`} style={{ marginLeft: i * 20 }}>
                <TypeIcon type={t} />
                <strong>{name}</strong>
                <span>{text}</span>
              </div>
            ))}
          </div>
          <p>Colour says the type, size says the level. Click a card to open it; drag to arrange.</p>
        </div>
        <div className="about-tile">
          <h3>Swimlanes</h3>
          <div className="about-lanes">
            {lanes.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
          <p>Lanes carry scope (now, later, a release) so a status never has to. Rename and add them from the board's lane headers.</p>
        </div>
        <div className="about-tile">
          <h3>Item statuses</h3>
          <ul className="about-statuses">
            {config.statuses.map((s) => (
              <li key={s.code}>
                <StatusLabel status={s.code} kind="item" />
                <span>{s.help}</span>
              </li>
            ))}
          </ul>
          <p>
            Yours to rename, recolour and add to in <Link to="/settings">Settings</Link>.
          </p>
        </div>
        <div className="about-tile">
          <h3>Questions</h3>
          <ul className="about-statuses">
            {config.questionStatuses.map((s) => (
              <li key={s.code}>
                <StatusLabel status={s.code} kind="question" />
                <span>{s.help}</span>
              </li>
            ))}
          </ul>
          <p>
            Anything not yet decided is a question on <Link to="/questions">Outstanding items</Link>. Answer it there, then run <code>/update-requirements</code> to carry the answer into the items.
          </p>
        </div>
        <div className="about-tile">
          <h3>Artifacts</h3>
          <p>
            The diagrams, transcripts, notes and documents behind the requirements, on the <Link to="/artifacts">Artifacts</Link> tab. A region is a named, highlighted spot in one; a requirement can link straight to it.
          </p>
          <p>
            To show one to a room, the full screen button at the end of the view bar, bottom right, hides the panel and the board's header and fills the screen. Esc or the same button comes back, with the panel as you left it.
          </p>
          <p>
            A stepped diagram plays a flow one step at a time. Step through it from the bar on the drawing, its Steps tab or the arrow keys: each step reveals more of the drawing, highlights what it is
            about, flies what moves from where it was to where it lands, and shows a caption and any running balances in the Steps tab. A requirement can link to a step as it can to a region.
          </p>
          <p>
            A diagram that fits on one screen keeps its view still as it steps. A wide flow that does not fit one screen can be set to follow its steps (<code>step_view: follow</code> in its
            sidecar): each step is framed as you arrive at it, close enough to read, unless it is already in view, and its moves fly once the view settles. Pan and zoom freely; Whole drawing fits
            it all again.
          </p>
          <ul className="about-statuses">
            {ARTIFACT_STATUSES.map((s) => (
              <li key={s}>
                <StatusLabel status={s} kind="artifact" />
                <span>{ARTIFACT_STATUS_HELP[s]}</span>
              </li>
            ))}
          </ul>
          <p>An artifact is never deleted. One that is no longer the version to go by is Retired: hidden on the Artifacts tab until Show retired is on, and still opened by a link. When a newer artifact replaced it, Replaced by points at that one, and sources citing the old one open the new.</p>
        </div>
        <div className="about-tile">
          <h3>Diff review</h3>
          <p>
            <Link to="/diff">Diff review</Link> shows what changed in the catalogue between two versions in git: every changed card, outstanding item and artifact, before on the left and after on the right, with
            the changed words marked. It starts on what has changed since the last commit (with nothing uncommitted, on what the last commit changed); pick any two commits that changed the catalogue
            from the bar. Only what changed shows: an edited paragraph is cut to its changed sentences (click the &hellip; for the rest), and
            a status change is one line under the title. A file that does not parse shows as <em>Could not be read</em>, with the parser&rsquo;s message, rather than as removed.
            Tick a card Viewed as you go; the tick lasts in this browser until the card changes again. Compact or Comfortable, from the bar, is kept the same way.
            Keys: <kbd>j</kbd> <kbd>k</kbd> previous or next change, <kbd>Shift</kbd> <kbd>J</kbd> <kbd>K</kbd> previous or next card, <kbd>v</kbd> Viewed and on to the next.
          </p>
        </div>
        <div className="about-tile">
          <h3>Outline and checks</h3>
          <p>
            <Link to="/outline">Outline</Link> lists everything as a document, ready to read top to bottom; a card no epic reaches (its parent missing, or in a parent cycle) is listed in a last group, Not under an epic, so nothing counted is hidden. The masthead stays clear while all is well. A pill appears only when something needs attention: amber <em>Offline</em> when the board has lost its server (card moves are kept and sent when it answers again, and the pill then offers a reload), red when a file is wrong, a card move didn’t save or a part of the page failed to show. Click it to see why. The checks also note when a description carries history that belongs in Notes, by the patterns listed under <code>voice</code> in <code>board.config.json</code>; notes never raise the pill, and Settings lists them under Checks.
          </p>
        </div>
      </div>
    </section>
  )
}

const FOLDERS: [string, string][] = [
  ['stories/', 'One file per epic (EP-01), feature (FT-01.1) and story (US-01.1.1)'],
  ['questions/', 'Open questions and missing sources (OQ-01)'],
  ['notes/', 'What each meeting or decision said, filed by /update-requirements'],
  ['changes/', 'A change log per update: what changed and why'],
  ['artifacts/', 'A sidecar per artifact (AR-01), its file in artifacts/files/'],
  ['VOICE.md', 'How requirements are written; the skills follow it (edit it in Settings), and the check warns on the voice patterns in board.config.json'],
  ['board.config.json', 'Project name and accent colour, components and statuses (Settings edits it); voice patterns for the check (by hand)'],
  ['board-layout.json', 'Swimlanes and any cards you placed by hand'],
  ['SCHEMA.md', 'The file format: read it before editing files by hand'],
  ['domain-model.md', 'The narrative model of the system, once there is one'],
]

const COMMANDS: [string, string][] = [
  ['npm --prefix requirements-board run dev', 'Open the board on localhost:5180 (BOARD_PORT moves it)'],
  ['npm --prefix requirements-board run check', 'Check every file, ID, parent and link'],
  ['npm --prefix requirements-board run verify', 'Typecheck, tests and check: run before sharing a change to the board itself'],
  ['npm --prefix requirements-board run export:csv', 'Export the catalogue as CSV'],
  ['npm --prefix requirements-board run snapshot -- --out <folder>', 'Write a read-only snapshot of the board to host for readers outside the team'],
  ['npm --prefix requirements-board run install-skills', 'Install the skills into .claude/ at the repo root again, after editing one: it keeps the mode in use (copies, or links with -- --link)'],
]

function Files() {
  return (
    <section id="about-files" className="about-section">
      <h2>Files and commands</h2>
      <div className="about-two">
        <div className="about-tile">
          <h3>
            <code>requirements-board/requirements/</code>
          </h3>
          <dl className="about-files">
            {FOLDERS.map(([f, t]) => (
              <div key={f}>
                <dt className="mono">{f}</dt>
                <dd>{t}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="about-tile">
          <h3>From the repo root</h3>
          <dl className="about-files">
            {COMMANDS.map(([c, t]) => (
              <div key={c}>
                <dt>
                  <code>{c}</code>
                </dt>
                <dd>{t}</dd>
              </div>
            ))}
          </dl>
          <p>The skills live in <code>requirements-board/agent/</code>; <code>.claude/skills/</code> holds what <code>install-skills</code> put there, copies or links: edit the source, then run it again (a copy changes only then; a link at once). Each keeps this repo's own facts in its "This repo" section.</p>
        </div>
      </div>
    </section>
  )
}
