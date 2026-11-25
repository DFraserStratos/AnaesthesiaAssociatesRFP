# Donald's decisions: the Finances section of the Admin app, 2026-11-26

- **Who:** Donald Fraser (Stratos, product owner), designing with Claude how the office does its
  money work: watching billing, finding invoices, paying the anaesthetists, keeping the ledger,
  the link to Xero and AA's own fees. Greg and AA have not seen it yet.
- **Covered:** one Finances section of the Admin app in place of Invoices, the Billing monitor and the
  Ledger; its six tabs and what sits on each; how the Billing tab lists Bookings; where Lists are
  approved; one anaesthetist's account as a page; what the tab and nav numbers count; the name; and
  what was considered and left out.
- **Standing:** Donald's decisions, made for the build. They change where the office does its money
  work and how it is laid out; the billing engine, the ledger, the payment cycle, Xero and AA fees work
  as already modelled. Items they change go to Verify, not Agreed.
- **Inputs gathered here:** a review of the three screens in the prototype and of the catalogue's
  stories under EP-06, EP-08, EP-09, EP-10, FT-11.3, FT-13.2 and FT-13.3; a design worked through in
  four passes (`docs/explorations/finances-section.html`, commit 25ba036f); and Donald's answers on
  its decisions page (`docs/explorations/finances-decisions.html`). The wording below is Donald's
  where quoted and a summary of the design he approved otherwise.

Cite a point as `"Notes 2026-11-26 · Donald finances section #n"`. Points are numbered once across
the whole note.

## Donald's decisions

1. **Finances is one section of the Admin app.** One side-nav entry, Finances, replaces three:
   Invoices, the Billing monitor and the Ledger. It has six tabs, each its own page with its own
   address: Billing, Invoices, Payments, Ledger, Xero and AA fees. Donald chose "Six tabs: add Xero and
   AA fees as their own tabs" and the name "Finances". Bears on US-13.3.1, US-13.2.1, FT-08.4, FT-09.2,
   FT-10.2 and FT-10.3.
2. **No summary page.** Finances opens on the Billing tab. Whether the books are square, and what is
   still unresolved, stays on the Day view. Donald chose "No summary: open straight on the Billing tab".
   Bears on US-13.2.4.
3. **Lists are approved in the Review queue only.** The Billing tab shows the Lists awaiting approval
   as a short list whose rows open the Review queue; it never approves a List itself. Donald chose
   "Review queue only; Billing just links to it", and added: "I might make a more unified lists page in
   the future." Bears on US-13.3.1.
4. **The Billing tab lists Bookings under each List.** One table across the whole practice, grouped by
   anaesthetist; under each anaesthetist, each List is a heading carrying its date, session, hospital,
   status, counts (sent, in Xero, paid in) and billing run; the rows are that List's Bookings, each
   showing its status, invoices, sent, Xero, paid in and disbursed. It opens on Problems, where a List
   shows only the Bookings that need something, each with its reason under the patient's name and its
   fix beside it (retry, fix the payer, resolve), and a way to show the rest. Filters: Problems, In
   progress, Done and All, with a search and an anaesthetist filter. Donald, on the three versions
   drawn: "my heart tells me that option C is the easiest to read ... So let's go with that for now,
   and we can tweak it as we go." Bears on US-13.3.1, US-13.3.2, US-08.5.1 and US-08.5.2.
5. **One anaesthetist's money has its own page.** The Ledger tab lists the anaesthetists with what has
   been billed for them, paid into AA, disbursed, what AA owes them and what they owe AA; a row opens
   that anaesthetist's account page, with a way back to the Ledger, what AA owes them and what they owe
   AA, their invoice pairs, payment runs and credit trails. It replaces choosing "one anaesthetist" at
   the top of the Ledger. Donald chose "Their own page". Bears on US-13.2.1 and US-08.3.4.
6. **A tab's number counts what needs doing.** Billing: Lists with a billing problem. Invoices:
   prepayment invoices awaiting approval. Ledger: ledger checks that failed (a receipt to place among
   them). Xero: hand-offs that raised an alert and invoices changed directly in Xero. Payments and AA
   fees show no number until something there is due. This is Finances' own rule; the Contracts and
   People tabs keep counting what they list. Donald chose "The number counts only what needs doing".
   Bears on US-13.3.1, US-13.2.1, US-13.3.2, US-09.2.2, US-06.3.1, FT-10.2 and FT-10.3.
7. **One badge on the Finances entry.** It counts billing problems (on the Billing and Xero tabs) and
   ledger checks together, in the amber warning colour both badges use today.
   Donald chose "One badge for both". Bears on US-13.3.1 and US-13.2.1.

## What sits on each tab

The design Donald approved places today's content as follows. Nothing is dropped; each action keeps
working as it does today.

8. **Invoices.** Every invoice and prepayment invoice AA raises on a payer, and the credit notes
   against them, searched by invoice number, the payable's number, case reference, patient, payer or
   anaesthetist. Each row shows its kind, payer, patient and Booking, anaesthetist, date raised, total,
   what is still owed, its state (Unpaid, Part paid, Paid, with the age of an unpaid one) and how it was
   delivered. It opens on Unpaid; Awaiting approval is one of its filters, where each prepayment invoice
   is approved and sent, and the approval step's switch sits beside the list. Bears on US-08.4.3,
   US-06.3.1, US-06.3.2 and US-09.1.1.
9. **Payments.** The week's payment cycle (its steps, what is waiting for the run, Close the week and
   the steps after it), the events awaiting the run, and every payment run before it; a run opens its
   page, and its remittance advice per anaesthetist sits under it. Bears on US-10.2.5, US-10.2.6 and
   US-10.2.7.
10. **Ledger.** Whether the books are square, in one sentence naming what is wrong, with four figures:
    owed to AA, owed to the anaesthetists, the AA Holding account and receipts to place. Its list shows
    the anaesthetists (point 5), the invoice pairs, or the AA Holding account's entries, which move here
    from the Billing monitor. A receipt that matches no invoice is placed or marked refunded here.
    Bears on US-13.2.1, US-08.3.1, US-06.5.1 and US-06.5.2.
11. **Xero.** The link to AA's Xero: the hand-offs waiting or failing, with their attempts, next try,
    last error and Retry now, and the invoices changed directly in Xero, each resolved as today. It
    opens on what needs action. A Booking stuck at Xero still shows on the Billing tab too. Bears on
    US-13.3.2 and US-09.2.2.
12. **AA fees.** AA's monthly fee invoices to the anaesthetists, opening on the unpaid ones, with the
    month's run, its preview and the fee settings beside them. AA fee invoices are not on the Invoices
    tab. Bears on US-10.3.1, US-10.3.2 and US-10.3.3.
13. **Records open on their own pages under their tab.** An invoice and a credit note under Invoices,
    a payment run and its remittances under Payments, an anaesthetist's account under Ledger. Each
    follows the record page pattern of the Contract and People pages. Every old address for these
    screens still opens the same thing. Bears on US-08.4.3, US-08.6.3 and US-10.2.5.
14. **What stays where it is.** Credit notes and additional invoices are still started from the
    Procedure or the invoice. A patient's balance and follow-up stay on their page in People. Approving
    Lists stays in the Review queue. The books' status stays on the Day view. Bears on US-08.6.3,
    US-08.6.5, US-13.2.2 and US-13.2.4.
15. **Considered and not built.** Four tabs (Xero inside Billing, AA fees inside Invoices and Payments);
    an Overview tab of headline figures; approving Lists from Billing; keeping the whole-ledger and
    one-anaesthetist switch; tab numbers that count what the tab lists; a badge for billing problems
    only; the name "Billing"; and two other layouts for the Billing table (Lists that unfold into their
    Bookings, and a List cell spanning its Bookings). Bears on Notes only.
