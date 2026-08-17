/**
 * Server-side pricing engine.
 *
 * This is the only place the estimate is calculated. The frontend never
 * sees rates, multipliers, or this formula — it only sends raw answers and
 * receives back a low/high range (see routes/estimate.js).
 *
 * Formula (documented in plain language in DECISIONS.md):
 *   baseMaterialCost = roofArea * ratePerSqft * (1 + wasteFactor)
 *   tearOffCost      = roofArea * tearOffPerSqft
 *   adjustedSubtotal = (baseMaterialCost + tearOffCost) * pitchMultiplier * storiesMultiplier
 *   mid              = adjustedSubtotal + permitFlatFee
 *   low              = mid * (1 - spread)
 *   high             = mid * (1 + spread)
 */

export class PricingError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "PricingError";
    this.field = field;
  }
}

function findQuestion(config, key) {
  const q = (config.questions || []).find((q) => q.key === key);
  if (!q) {
    throw new PricingError(
      `Configuration is missing the required "${key}" question.`,
      key
    );
  }
  return q;
}

function findOption(question, value) {
  const opt = (question.options || []).find((o) => o.value === value);
  if (!opt) {
    throw new PricingError(
      `"${value}" is not a valid option for "${question.key}".`,
      question.key
    );
  }
  return opt;
}

function toFinitePositiveNumber(value, field) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new PricingError(`"${field}" must be a number.`, field);
  }
  return n;
}

/**
 * Calculates the estimate range for a given answers payload against a
 * given config document. Throws PricingError on anything that would make
 * the formula uncomputable (missing question, unknown option, bad number).
 * Range/required-field *validation* (is roof_area within min/max, are all
 * required questions answered) happens separately in validateAnswers.js —
 * this function assumes it has already been called.
 */
export function calculateEstimate(answers, config) {
  const roofAreaQ = findQuestion(config, "roof_area");
  const roofArea = toFinitePositiveNumber(
    answers[roofAreaQ.key],
    roofAreaQ.key
  );

  const materialQ = findQuestion(config, "material");
  const materialOpt = findOption(materialQ, answers[materialQ.key]);
  const ratePerSqft = toFinitePositiveNumber(
    materialOpt.rate_per_sqft,
    "material.rate_per_sqft"
  );

  const pitchQ = findQuestion(config, "pitch");
  const pitchOpt = findOption(pitchQ, answers[pitchQ.key]);
  const pitchMultiplier = toFinitePositiveNumber(
    pitchOpt.multiplier,
    "pitch.multiplier"
  );

  const layersQ = findQuestion(config, "layers");
  const layersOpt = findOption(layersQ, answers[layersQ.key]);
  const tearOffPerSqft = toFinitePositiveNumber(
    layersOpt.tear_off_per_sqft ?? 0,
    "layers.tear_off_per_sqft"
  );

  const storiesQ = findQuestion(config, "stories");
  const storiesOpt = findOption(storiesQ, answers[storiesQ.key]);
  const storiesMultiplier = toFinitePositiveNumber(
    storiesOpt.multiplier,
    "stories.multiplier"
  );

  const { waste_factor, permit_flat_fee, range_spread_pct } =
    config.modifiers || {};
  if (
    !Number.isFinite(Number(waste_factor)) ||
    !Number.isFinite(Number(permit_flat_fee)) ||
    !Number.isFinite(Number(range_spread_pct))
  ) {
    throw new PricingError(
      "Configuration modifiers are missing or invalid.",
      "modifiers"
    );
  }

  const wasteFactor = Number(waste_factor);
  const permitFlatFee = Number(permit_flat_fee);
  const spread = Number(range_spread_pct) / 100;

  const baseMaterialCost = roofArea * ratePerSqft * (1 + wasteFactor);
  const tearOffCost = roofArea * tearOffPerSqft;
  const adjustedSubtotal =
    (baseMaterialCost + tearOffCost) * pitchMultiplier * storiesMultiplier;
  const mid = adjustedSubtotal + permitFlatFee;
  const low = mid * (1 - spread);
  const high = mid * (1 + spread);

  const round2 = (n) => Math.round(n * 100) / 100;

  return {
    estimate_low: round2(low),
    estimate_mid: round2(mid),
    estimate_high: round2(high),
  };
}
