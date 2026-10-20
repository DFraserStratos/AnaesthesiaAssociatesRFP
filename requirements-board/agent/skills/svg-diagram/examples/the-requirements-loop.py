"""Process view: how a team iterates its requirements with the board and the Claude Code skills,
as a loop of six numbered steps round a charcoal hero panel (the catalogue they all read and write).

Neutral: no project content, so it doubles as the kit's style example and the starter catalogue's
AR-01. Usage: python3 examples/the-requirements-loop.py <out.svg>
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from svgkit import *  # noqa: E402,F403

# ---------- layout ----------
M = 20                      # outer margin
CW, CH = 300, 150           # step card size
HGAP = 60                   # gap between cards in a row (room for a chevron)
XS = [M + i * (CW + HGAP) for i in range(3)]
TOOL_Y, TOOL_H = M, 78      # side-input cards above the top row
TOP = TOOL_Y + TOOL_H + 32  # top row of steps
VGAP = 210                  # gap between the rows: holds the hero panel
BOT = TOP + CH + VGAP       # bottom row of steps
W = XS[2] + CW + M
NOTE_Y = BOT + CH + 22
BAR_Y = NOTE_Y + 3 * 18 + 22 + 20
H = BAR_Y + 40 + M

d = Diagram(W, H, title="The requirements loop")


# ---------- local helpers (svgkit has no rotated chevron or tool card) ----------
def chevron_dir(cx, cy, direction):
    """svgkit's chevron, pointing right, left, up or down."""
    d.raw(f'<circle cx="{cx}" cy="{cy}" r="15" fill="{ACCENT}"/>')
    pts = {"right": [(-4, -7), (4, 0), (-4, 7)], "left": [(4, -7), (-4, 0), (4, 7)],
           "down": [(-7, -4), (0, 4), (7, -4)], "up": [(-7, 4), (0, -4), (7, 4)]}[direction]
    (x1, y1), (x2, y2), (x3, y3) = pts
    d.path(f"M{cx + x1} {cy + y1} L{cx + x2} {cy + y2} L{cx + x3} {cy + y3}", color="#FFFFFF", w=2.5)


def tool_card(x, y, w, name, body, id=None):
    """A side input: a dashed white card naming a skill, with a short arrow into the step below."""
    d.rect(x, y, w, TOOL_H, "#FFFFFF", "#9C9CA8", r=9, dash="5 4", id=id)
    d.text(x + PAD, y + 22, "Side input", size=11.5, weight=700, fill="#8A8A96")
    d.text(x + PAD, y + 43, name, size=15, weight=700)
    d.text(x + PAD, y + 63, body, size=12.5, fill=MUTED)
    d.down_arrow(x + w / 2, y + TOOL_H + 2, TOP - 2)


def step_card(i, x, y, title, body):
    d.card(x, y, CW, CH, title=title, number=i, id=f"step-{i}")
    d.lines(x + 18, y + 76, body, size=13, lh=18, fill=MUTED)


# ---------- the loop track (drawn first, so the cards cover it and it shows in the gaps) ----------
cx = [x + CW / 2 for x in XS]
ty, by = TOP + CH / 2, BOT + CH / 2
R = 26
d.path(f"M{cx[0] + R} {ty} H{cx[2] - R} Q{cx[2]} {ty} {cx[2]} {ty + R} V{by - R} "
       f"Q{cx[2]} {by} {cx[2] - R} {by} H{cx[0] + R} Q{cx[0]} {by} {cx[0]} {by - R} "
       f"V{ty + R} Q{cx[0]} {ty} {cx[0] + R} {ty}", color=ACCENT, w=2.5)

# ---------- side inputs ----------
d.raw('<g id="side-tools">')
tool_card(XS[0] + 10, TOOL_Y, CW - 20, "transcript-reconciler", "merges duplicate transcripts of a meeting",
          id="tool-transcript-reconciler")
tool_card(XS[2] + 10, TOOL_Y, CW - 20, "add-artifact · svg-diagram", "add diagrams and documents to link to",
          id="tool-artifacts")
d.raw("</g>")

# ---------- the six steps: clockwise from the top left ----------
step_card(1, XS[0], TOP, "Evidence", [
    "A meeting, a transcript, an email or a",
    "decision someone has made: anything",
    "that changes what the system should do."])
step_card(2, XS[1], TOP, "/update-requirements", [
    "Files the evidence as a note, answers the",
    "questions it settles, updates epics,",
    "features and stories, writes a change log."])
step_card(3, XS[2], TOP, "Review on the board", [
    "Check statuses, answer outstanding",
    "questions and arrange the swimlanes.",
    "New answers go in the next update."])
step_card(4, XS[2], BOT, "Commit", [
    "The team commits the catalogue to git.",
    "The commit is the baseline the build",
    "plan is updated from."])
step_card(5, XS[1], BOT, "/update-build-plan", [
    "Pass it the commit. It re-grades the",
    "changed requirements against the app",
    "and updates the build plan."])
step_card(6, XS[0], BOT, "Build", [
    "The team builds the next phases of the",
    "plan. What they learn comes to the",
    "next meeting as new evidence."])

# chevrons on the visible parts of the track
chevron_dir(XS[0] + CW + HGAP / 2, ty, "right")
chevron_dir(XS[1] + CW + HGAP / 2, ty, "right")
chevron_dir(cx[2], (TOP + CH + BOT) / 2, "down")
chevron_dir(XS[1] + CW + HGAP / 2, by, "left")
chevron_dir(XS[0] + CW + HGAP / 2, by, "left")
chevron_dir(cx[0], (TOP + CH + BOT) / 2, "up")
d.lines(cx[0] - 26, (TOP + CH + BOT) / 2 - 4, ["Next meeting,", "round again"],
        size=13.5, lh=18, fill=MUTED, anchor="end", style="italic")

# ---------- hero: the catalogue every step reads and writes ----------
HX, HW = cx[0] + 34, cx[2] - cx[0] - 68
HY, HH = TOP + CH + 30, VGAP - 60
d.panel(HX, HY, HW, HH, CHAR, CHAR_S, r=14, id="catalogue")
d.heading(HX + 24, HY + 44, "The catalogue", size=27, fill="#FFFFFF",
          sub=["Markdown files in git, one per epic, feature, story and question, plus notes,",
               "change logs and artifacts. The board and every skill read and edit the same files."],
          sub_fill=LIGHT)
kinds = ["Epics", "Features", "Stories", "Questions", "Notes", "Change logs", "Artifacts"]
widths = [22 + 6.6 * len(k) for k in kinds]
gap = 8
px = HX + 24
for k, w in zip(kinds, widths):
    d.pill(px + w / 2, HY + HH - 24 - 14, w, k, "#3D3D42", LIGHT, size=12, stroke=CHAR_S)
    px += w + gap

# ---------- now and then ----------
d.aside(XS[0], NOTE_Y, [
    "link-requirements: links each item to the items its text names, after items are added or reworded.",
    "consistency-review: catches drift across the whole catalogue (stale wording, contradicted decisions)."],
    w=W - 2 * M, title="Now and then", id="now-and-then")

# ---------- summary bar ----------
d.bottom_bar(BAR_Y, [("Each round:", "evidence → update requirements → review → commit → update the plan → build")])

d.save(sys.argv[1])
