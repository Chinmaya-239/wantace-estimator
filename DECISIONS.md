# DECISIONS.md

## Stack

**Node/Express + MongoDB (Mongoose) on the backend, React (Vite) + Tailwind
on the frontend.** Mongo over Postgres because the config document is
naturally nested and shape-shifting — questions carry different numeric
fields depending on type (`rate_per_sqft` for material, `multiplier` for
pitch/stories, `tear_off_per_sqft` for layers), and the historical leads in
the seed data already prove the answer shape isn't stable across config
versions (see "Seed data oddities" below). Modeling that in relational
tables would mean either a wide sparse table or an EAV pattern, both worse
than just storing the document as it naturally occurs. A single owner/one
bookkeeper doesn't need relational integrity across users, roles, or
tenants — Mongo's flexibility costs nothing here and saves a migration
step every time a question's shape changes. Auth is JWT rather than
session cookies so the API can be deployed independently of the frontend's
domain (Vercel + Render, different origins) without fighting cookie
`SameSite` rules for a two-week take-home window.

## The pricing formula, in plain language

A homeowner's price has two cost components — materials and tear-off —
that both scale with roof size, then the whole thing gets multiplied up
for how steep and how tall the house is, then a flat permit fee is added
on top, then we quote a range instead of one number:

1. **Material cost** = roof size × the selected material's price per
   square foot, bumped up 10% to cover waste (offcuts, damaged shingles).
2. **Tear-off cost** = roof size × a per-square-foot rate that depends on
   how many old layers have to come off first (free for a new build).
3. Add those two together, then multiply by a **pitch multiplier** (steeper
   = more dangerous = more expensive) and a **stories multiplier** (taller
   = more scaffolding/labor).
4. Add a flat **$350 permit fee**.
5. That total is the **mid-point**. We quote **±12%** around it as the
   low–high range, since a phone-submitted estimate can't account for
   everything a real inspection would catch.

This lives entirely in `backend/src/lib/pricingEngine.js`, is covered by
seven unit tests in `backend/tests/`, and never runs in the browser.

## What I deliberately did not build

- **Adding brand-new questions from the owner panel.** The brief lists
  this as an optional stretch goal, not a core requirement. Supporting
  arbitrary new pricing-relevant questions would mean either a generic
  formula DSL (real scope creep for 24 hours) or a new question type that
  silently doesn't affect price (misleading for Dale). The owner panel
  *does* fully support editing labels, rates, multipliers, and toggling
  the active state of every existing question.
- **Letting the owner deactivate roof_area, material, pitch, layers, or
  stories.** All five are direct inputs to the formula — turning one off
  would make the calculation undefined. The config editor disables that
  toggle for those five specifically (`lockedForPricing: true` in the
  schema) with an inline explanation, rather than silently breaking the
  public estimator or making up a default value that would misprice a
  real job.
- **Full configuration version history / diffing.** `config_version`
  still increments on every save and gets stamped onto every lead, so
  Dale can already tell which pricing era a lead was quoted under — but a
  browsable history of *what changed* is scoped out. Low risk to leave
  for later since the version number alone answers "was this lead priced
  under the old or new rates."
- **Multi-tenancy / per-user roles.** One shared owner-panel login for
  Dale and Marcus. A real production system would want separate accounts
  (if only to know who last touched a rate), but that's a meaningfully
  bigger auth surface than a 24-hour brief calling for "basic auth is
  fine" warrants.
- **Outbound webhooks.** Listed as a stretch goal; genuinely lower value
  than making sure the core flow and the config editor are solid, so I
  left it out rather than ship it half-tested.
- I did finish two smaller stretch items since they were cheap relative
  to their value: **CSV export** of leads (Marcus asked for "nothing
  fancy," but a spreadsheet-native export is the kind of nothing-fancy
  bookkeepers actually want), and **unit tests around the calculation
  layer**, since that's the one piece of this system a pricing mistake
  would be expensive in.

## Seed data oddities I found, and how I handled them

- `pitch.medium.multiplier` was the **string** `"1.12"` while every other
  multiplier in the file is a number. Left as-is in the arithmetic, this
  turns `*` into implicit string coercion in some languages or silent
  `NaN`s in others. I cast every option's numeric fields to `Number(...)`
  both when seeding and again defensively inside `pricingEngine.js`
  (`toFinitePositiveNumber`), so a future config edit that reintroduces a
  stringy number doesn't quietly break a homeowner's estimate.
- The seed export has **no `order` field**, but the brief requires
  `GET /api/config` to return questions "sorted by order." I assigned
  `order` from each question's position in the original array (0–4) at
  seed time — documented in `seed/seedData.js` rather than invented
  silently.
- One historical lead (`ld_0917`) is stamped `config_version: 1` and its
  `answers` object has **keys that don't exist in the current config at
  all** — `chimney_count`, `gutter_replace` — plus a `material` value
  (`slate_natural`) that isn't one of today's four options. This is
  exactly what you'd expect from real production data surviving a schema
  change, so I didn't try to normalize, drop, or backfill it. The `Lead`
  model stores `answers` as a schema-less `Mixed` field for this reason,
  and the leads table renders whatever keys are actually present per lead
  instead of a fixed column set — so this legacy lead displays correctly
  without special-casing it.
- The brief is explicit that the seed leads' `estimate_low`/`estimate_high`
  are historical figures from the client's *old* system and shouldn't be
  expected to match this formula. I stored them verbatim rather than
  recomputing — recalculating history against a new formula would rewrite
  what actually happened, which is worse than leaving an admitted
  inconsistency.

## Questions I'd ask Dale before a real production launch

1. Should tear-off cost, waste factor, or the permit fee vary by city/zip
   within his service area, or is one flat set of rates fine everywhere
   he works?
2. What should happen to a lead if he changes rates *after* it was
   quoted but *before* he's called the homeowner back — does the quoted
   number need to be honored, and for how long?
3. Does he want any lead notification (email/SMS) the moment one comes
   in, or is checking the panel periodically enough at his current
   volume?
4. Who besides him and Marcus should ever have owner-panel access, and
   does he care about a per-person audit trail of who changed a rate?
5. Is $350 really a flat permit fee everywhere, or does it vary by
   township/municipality in the Columbus area?

## What I'd do next with another week

Real database-backed multi-version config history with a diff view;
per-user owner accounts with an audit log of who changed what rate and
when; server-side rate limiting and basic bot protection on the public
`/api/estimate` endpoint (nothing stops a script from hammering it right
now); email/SMS notification on new lead capture; and letting the owner
add genuinely new questions with a constrained set of "does/doesn't
affect price" behaviors instead of a full formula DSL.
