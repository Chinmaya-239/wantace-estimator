# AI_LOG.md

## Tools used

Claude (Sonnet, via claude.ai) for the entire first pass of this build:
architecture, backend, frontend, and this documentation. No Cursor/Copilot/
ChatGPT were used alongside it for this pass.

## What it was used for

Claude scaffolded the whole project in one sitting from the task brief: the
Express API (models, routes, auth middleware, the pricing engine and its
validation), the seed data transcription and normalization, the React/Vite/
Tailwind frontend (the dynamic question renderer, the wizard, the owner
panel's config editor and leads table), and the first drafts of this file,
`README.md`, and `DECISIONS.md`.

## A specific instance where it was wrong

While writing the pricing-engine unit tests, Claude hand-computed the
expected low/high figures for a "zero tear-off, new build" test case to
assert against. The first draft had `estimate_low: 11111.28`. Running the
test suite against the actual implementation immediately failed that
assertion — the real output was `11110.88`. Redoing the arithmetic by hand
(`12626 × 0.88`) confirmed `11110.88` was correct and the original figure
was a manual multiplication slip, not a bug in `pricingEngine.js` itself.
The test was corrected and the suite re-run to confirm all seven cases
pass. This is exactly the kind of error the task brief warns about
("wrong formula calculation") — it happened in a hand-written test
expectation rather than the formula code, and the fix was to trust the
failing test and re-derive the number rather than adjust the code to
match a wrong expectation.

A second, smaller issue: an early draft of the owner-panel option-update
handler did a redundant `findIndex` lookup to map a table row back to its
position in the options array, when the row index already *was* that
position (the table renders directly from the same array reference). It
wasn't wrong, just needless indirection that made the data flow harder to
follow — simplified to pass the index straight through.

## What still needs a human pass before this is submitted

This file, along with the code itself, was produced by Claude in a single
session rather than accumulated by a person coding over several hours —
which is exactly the pattern the brief's commit-history check (Section 9)
is designed to catch, and exactly why honesty matters more here than
anywhere else in the assignment. Before submitting:

- **Run it yourself, end to end** — seed the database, complete the public
  estimator, change a rate in the owner panel, confirm the change reflects
  live. Don't take the passing test suite's word for the whole system.
- **Read every file at least once.** Round 2 is a live walkthrough of your
  own submission with a small live change requested on the spot — that's
  only survivable if you actually understand what's here, not just that it
  runs.
- **Commit as you go**, in the order you actually review/adjust things,
  rather than pushing this as a single commit. A bulk import with one
  timestamp is an automatic rejection per the brief, and — separately from
  the rejection rule — a spread-out history is also just a more honest
  record of a human review having happened.
- **Rewrite this file in your own words** once you've done that pass,
  describing what you actually found, questioned, or changed — not what
  Claude reports about itself.
