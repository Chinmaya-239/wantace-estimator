/**
 * Seed data transcribed from the brief's "Current configuration" export.
 *
 * Normalizations applied here (documented again in DECISIONS.md):
 *  - pitch's "medium" option had multiplier as the string "1.12" — cast to
 *    a Number so the pricing engine's arithmetic never silently does
 *    string concatenation instead of multiplication.
 *  - Added an explicit `order` per question (its position in the original
 *    array) since the brief requires GET /api/config to sort by order but
 *    the seed export has no such field.
 *  - Added `lockedForPricing: true` to all 5 questions — every one of them
 *    feeds calculateEstimate(), so none can be safely deactivated from the
 *    owner panel. See DECISIONS.md.
 */
export const seedConfig = {
  config_version: 3,
  business: {
    name: "Northline Roofing & Exteriors",
    region: "Columbus, OH",
    currency: "USD",
  },
  questions: [
    {
      key: "roof_area",
      label: "Roughly how big is your roof?",
      type: "number",
      unit: "sq ft",
      required: true,
      active: true,
      order: 0,
      min: 300,
      max: 12000,
      lockedForPricing: true,
    },
    {
      key: "material",
      label: "What material do you want?",
      type: "select",
      required: true,
      active: true,
      order: 1,
      lockedForPricing: true,
      options: [
        { value: "asphalt_3tab", label: "Asphalt shingle - 3-tab", rate_per_sqft: 4.25 },
        { value: "asphalt_arch", label: "Asphalt shingle - architectural", rate_per_sqft: 5.9 },
        { value: "metal_standing", label: "Standing seam metal", rate_per_sqft: 12.4 },
        { value: "cedar_shake", label: "Cedar shake", rate_per_sqft: 11.1 },
      ],
    },
    {
      key: "pitch",
      label: "How steep is the roof?",
      type: "select",
      required: true,
      active: true,
      order: 2,
      lockedForPricing: true,
      options: [
        { value: "low", label: "Low - you could walk on it", multiplier: 1.0 },
        { value: "medium", label: "Medium", multiplier: 1.12 },
        { value: "steep", label: "Steep - not walkable", multiplier: 1.3 },
      ],
    },
    {
      key: "layers",
      label: "How many layers of old roofing are on there now?",
      type: "select",
      required: true,
      active: true,
      order: 3,
      lockedForPricing: true,
      options: [
        { value: "0", label: "None - new build", tear_off_per_sqft: 0 },
        { value: "1", label: "One layer", tear_off_per_sqft: 1.15 },
        { value: "2", label: "Two or more layers", tear_off_per_sqft: 2.05 },
      ],
    },
    {
      key: "stories",
      label: "How many stories is the house?",
      type: "select",
      required: true,
      active: true,
      order: 4,
      lockedForPricing: true,
      options: [
        { value: "1", label: "Single storey", multiplier: 1.0 },
        { value: "2", label: "Two storeys", multiplier: 1.08 },
        { value: "3", label: "Three or more", multiplier: 1.18 },
      ],
    },
  ],
  modifiers: {
    waste_factor: 0.1,
    permit_flat_fee: 350,
    range_spread_pct: 12,
  },
};

/**
 * Historical leads exactly as given in the brief. These carry the client's
 * own historical estimate_low/estimate_high — we store them verbatim and
 * do NOT recompute them against today's formula (their config_version 1
 * and 3 don't necessarily reflect the current schema; ld_0917 is from a
 * legacy config version and has answer keys — chimney_count,
 * gutter_replace, material "slate_natural" — that don't exist in the
 * current config at all). See DECISIONS.md "seed data oddities handled".
 */
export const seedLeads = [
  {
    captured_at: new Date("2026-06-02T14:20:11Z"),
    config_version: 3,
    name: "Ana Ruiz",
    phone: "+1-614-555-0148",
    email: "aruiz@example.com",
    answers: {
      roof_area: 2100,
      material: "asphalt_arch",
      pitch: "medium",
      layers: "1",
      stories: "2",
    },
    estimate_low: 21480,
    estimate_high: 27260,
  },
  {
    captured_at: new Date("2026-03-18T09:02:44Z"),
    config_version: 1,
    name: "Bill Tanner",
    phone: "+1-614-555-0192",
    email: "btanner@example.com",
    answers: {
      roof_area: 1450,
      material: "slate_natural",
      pitch: "steep",
      chimney_count: 2,
      gutter_replace: "yes",
    },
    estimate_low: 38900,
    estimate_high: 44100,
  },
  {
    captured_at: new Date("2026-07-11T18:47:03Z"),
    config_version: 3,
    name: "Priya Nair",
    phone: "+1-614-555-0177",
    email: "pnair@example.com",
    answers: {
      roof_area: 900,
      material: "metal_standing",
      pitch: "low",
      layers: "0",
      stories: "1",
    },
    estimate_low: 12240,
    estimate_high: 15530,
  },
];
