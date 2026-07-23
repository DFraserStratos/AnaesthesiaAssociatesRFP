# AA Prototype Demo Guide

This folder translates the Anaesthesia Associates RFP into a practical guide for understanding,
building and demonstrating the prototype.

It is written for Donald and assumes the reader has not read the full RFP.

## Start here

Open the [interactive master demo guide](master-demo-guide.html) for a visual, single-page version of
the personas, workflows, presenter storyboard and cheat sheet. It includes an interactive mental
model, persona and workflow explorers, a rehearsal checklist, readiness guardrails and a one-click
demo rescue panel.

## Read these in order

1. [Personas and responsibilities](01-personas-and-responsibilities.md) explains who uses each app,
   what they are trying to achieve and what they are allowed to do.
2. [Workflows and handoffs](02-workflows-and-handoffs.md) explains the business process from
   schedule setup through booking, procedure capture, authorisation, billing and payment.
3. [Demo storyboard](03-demo-storyboard.md) gives a presenter-facing sequence, exact prototype
   click paths and optional shorter scenarios.
4. [Presenter cheat sheet](04-presenter-cheat-sheet.md) contains the vocabulary, key rules,
   permissions, talking points and RFP ambiguities worth memorising.

## The one-sentence product description

Anaesthesia Associates coordinates anaesthetists' half-day operating Lists, keeps the patient Cards
within those Lists current, captures the clinical inputs needed for billing, checks and authorises
completed Lists, then calculates invoices and manages collection and disbursement through Xero.

## The mental model

```text
Schedule
  -> Day
    -> Anaesthetist
      -> AM List and PM List
        -> Card (one patient appointment)
          -> Procedure(s)
            -> Billing line(s)
```

- The system creates a rolling four-month canvas containing exactly two Lists, AM and PM, for every
  active anaesthetist on every day.
- Permanent arrangements, availability, hospital, surgeon, status and Cards are applied to that
  canvas.
- A List is not an employment shift and a Card is not a shift application.
- The anaesthetist completes Cards and submits the whole List.
- The office checks and authorises the whole List.
- Authorisation locks its Cards and hands the List to the Billing Engine.

## Important terminology correction

The RFP does not define an "SSA" user or a self-service shift marketplace.

The field user is an **anaesthetist**. The scheduling unit is a half-day **List**. Anaesthetists can:

- maintain their availability;
- see their assigned Lists;
- find Free sessions and request or offer cover; and
- help arrange locum cover.

The RFP does not say an anaesthetist browses open shifts and claims one. Office staff coordinate
assignment and reassignment. If the demo presents "sign up for a shift", it will be promising a
workflow that is not in the source material.

## Source priority

When documents differ, use this priority:

1. [The RFP](../rfp-reference/RFP.md) is the source of truth for business needs.
2. [Prototype requirements](../prototype-build/REQUIREMENTS.md) record the chosen demo readings of
   RFP ambiguities.
3. [Prototype progress](../prototype-build/PROGRESS.md) records what is formally complete.
4. The current code shows work in progress that may not yet have passed the phase completion checks.

The RFP calls its proposed architecture a **candidate architecture**. It is a strong starting point,
not a final specification. Where this guide says "prototype reading", present it as a design proposal
to confirm during discovery.

## Prototype readiness snapshot

Snapshot date: **23 July 2026**

| Area | Status | Safe demo position |
|---|---|---|
| Mobile Lists, Cards, BTM capture, completion and submit | Ready | Strong primary workflow |
| Anaesthetist web dashboard, Lists, availability and seeded accounts views | Ready | Strong supporting workflow |
| Admin day view, changes, cover, review, authorisation, masters and audit | Ready | Strong primary workflow |
| Billing run and invoice documents | Ready | Phase 08 is recorded complete, including build, tests and Playwright walkthrough |
| Pre-payment, post-op addendum and billing monitor | Planned | Phase 09 |
| Xero pairs, payments, payables, live balances and GST activity | Planned | Phase 10 |
| HL7/FHIR/PDF ingestion and integration monitoring | Planned | Phase 11 |
| Scenario jump buttons and final guided script | Planned | Phase 12 |

Phases 00 to 08 are recorded complete. Phases 09 to 12 remain planned.

## Best demo shape

Use one continuous business object rather than touring unrelated screens:

> Dr Melanie Souter's Tuesday 21 July PM List at Southern Cross.

It contains patient Cards using the three main billing routes and one unfinished Card, Margaret
Ellison, that is designed for live BTM capture.

The core story is:

```text
Office schedule
  -> Anaesthetist web overview
  -> Mobile procedure capture
  -> List submitted
  -> Office review
  -> List authorised
  -> Invoices generated
  -> Xero collection and payable pair
  -> Payment into AA
  -> Disbursement to anaesthetist
```

The assured interactive story now runs through office authorisation, invoice generation and List
disappearance. Narrate Xero, payments and integrations instead of clicking into their placeholders.

## Primary source sections

- RFP overview and applications: `Project Overview`
- Scheduling model: `Schedule Management - Candidate Architecture`
- Lifecycle: `Card Immutability and the List Approval Process`
- Billing capture: `The Big Picture: What Are We Actually Calculating?`
- Billing routes and recipients: `Billing Route Resolution` and `Who Receives the Invoice?`
- Billing handoff: `Billing Engine Integration Point`
- Xero/payment model: `Xero Integration - Candidate Design`
- Integrations: `Health Systems Integration` and `Integration Requirements`
- Legacy screen references: Appendices 3 to 5
