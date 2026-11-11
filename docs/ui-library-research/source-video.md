# Source: "UI Libraries for Claude Code (Ban the AI Look)"

Griffin Wooldridge, YouTube: https://www.youtube.com/watch?v=zsCGS-Yzjnw

This video prompted the research. Its framing (three kinds of library) is useful; its emphasis on visual
flourish is mostly **not** what this project wants (see `README.md`, principle 1).

## The argument

Left alone, an AI builds every component from scratch with default styling, and skips the details that make
a product feel finished: how toasts stack, how a drawer drags, how a command menu works with the keyboard.
Component libraries give the model "someone else's taste".

## The three kinds

1. **Foundations** (behaviour and accessibility): shadcn/ui, Base UI, Radix. Keyboard navigation, focus,
   accessibility for buttons, inputs, dialogs, dropdowns, tabs. Default shadcn has become "an AI look" of its
   own (same radius, grey, fonts): change radius, colours and typography so it looks like your product.
   Because shadcn copies code into the project, Claude can read and change all of it.
2. **Specialists** (one component done well): Sonner (toasts: stacking, hover expand, animate in/out), Vaul
   (drag-up, flick-to-close mobile drawers), cmdk (⌘K command menus), NumberFlow (numbers tick over instead
   of jumping). Sonner and Vaul are by Emil Kowalski, who also publishes a `pick-ui-library` skill that tells
   Claude which library to use for a need.
3. **Designed components** (finished, styled, often animated): Beautiful UI (AI interfaces: streaming text,
   approval cards, diff views), RareUI (flashy buttons, text effects), Magic UI (150+ animated components on
   top of shadcn), Aceternity (landing-page effects: 3D cards, beams, marquees), 21st.dev (marketplace). Rule:
   **one standout moment per page**.

## How to get Claude to use them

Name the library in the prompt ("use shadcn for base components and Sonner for toasts"); install through the
library CLI or registry so the code lives in the project; or install the `pick-ui-library` skill.

## Links from the video description

- shadcn/ui https://ui.shadcn.com · Base UI https://base-ui.com · Radix https://www.radix-ui.com
- Sonner https://sonner.emilkowal.ski · Vaul https://vaul.emilkowal.ski · cmdk https://cmdk.paco.me ·
  NumberFlow https://number-flow.barvian.me
- pick-ui-library skill https://github.com/emilkowalski/skills
- Beautiful UI https://beautifului.dev · RareUI https://rareui.in · Magic UI https://magicui.design ·
  Aceternity UI https://ui.aceternity.com · 21st.dev https://21st.dev
- His "AI for Designers" guide https://griffinwooldridge.com/ai-for-designers was "coming soon" (waitlist
  only) on 11 Nov 2026. Its planned outline: CLAUDE.md/AGENTS.md templates, design-review and ui-critic
  subagents, Mobbin and Figma MCP servers. Nothing on these libraries.

## What we took from it

- The three-tier framing, and the advice to re-skin the foundation rather than accept its defaults.
- Specialists for jobs the prototype currently hand-builds (toasts, drawers, type-aheads).
- The idea of a design-review subagent that checks output against our design system.

## What we set aside

- The designed-components tier and "standout moments": the prototype is for unification ahead of a real
  build, not for added flourish.
- Vaul: unmaintained since Oct 2025; Base UI Drawer does the same job.
