import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateEstimate, PricingError } from "../src/lib/pricingEngine.js";
import { seedConfig } from "../src/seed/seedData.js";

// Work from a fresh deep copy per test so nothing leaks between them.
function freshConfig() {
  return JSON.parse(JSON.stringify(seedConfig));
}

test("matches a hand-computed example (architectural shingle, medium pitch, one tear-off layer, two stories)", () => {
  const config = freshConfig();
  const answers = {
    roof_area: 2000,
    material: "asphalt_arch", // rate_per_sqft 5.90
    pitch: "medium", // multiplier 1.12
    layers: "1", // tear_off_per_sqft 1.15
    stories: "2", // multiplier 1.08
  };

  // baseMaterialCost = 2000 * 5.90 * 1.10 = 12980
  // tearOffCost      = 2000 * 1.15        = 2300
  // adjustedSubtotal = (12980 + 2300) * 1.12 * 1.08 = 15280 * 1.2096 = 18482.688
  // mid              = 18482.688 + 350 = 18832.688
  // low              = 18832.688 * 0.88 = 16572.76544
  // high             = 18832.688 * 1.12 = 21092.61056
  const result = calculateEstimate(answers, config);

  assert.equal(result.estimate_mid, 18832.69);
  assert.equal(result.estimate_low, 16572.77);
  assert.equal(result.estimate_high, 21092.61);
});

test("zero tear-off cost for a new build (layers = 0)", () => {
  const config = freshConfig();
  const answers = {
    roof_area: 900,
    material: "metal_standing", // 12.40
    pitch: "low", // 1.0
    layers: "0", // 0
    stories: "1", // 1.0
  };

  // baseMaterialCost = 900 * 12.40 * 1.10 = 12276
  // tearOffCost      = 0
  // adjustedSubtotal = 12276 * 1 * 1 = 12276
  // mid              = 12276 + 350 = 12626
  const result = calculateEstimate(answers, config);

  assert.equal(result.estimate_mid, 12626);
  assert.equal(result.estimate_low, 11110.88);
  assert.equal(result.estimate_high, 14141.12);
});

test("boundary roof_area values (min and max) still produce a positive estimate", () => {
  const config = freshConfig();
  const base = { material: "asphalt_3tab", pitch: "steep", layers: "2", stories: "3" };

  const atMin = calculateEstimate({ ...base, roof_area: 300 }, config);
  const atMax = calculateEstimate({ ...base, roof_area: 12000 }, config);

  assert.ok(atMin.estimate_low > 0);
  assert.ok(atMax.estimate_high > atMin.estimate_high);
});

test("throws PricingError for an unknown material option (tamper attempt)", () => {
  const config = freshConfig();
  const answers = {
    roof_area: 1000,
    material: "gold_plated_titanium", // not a real option
    pitch: "low",
    layers: "0",
    stories: "1",
  };

  assert.throws(() => calculateEstimate(answers, config), PricingError);
});

test("throws PricingError for a non-numeric roof_area", () => {
  const config = freshConfig();
  const answers = {
    roof_area: "a lot",
    material: "asphalt_3tab",
    pitch: "low",
    layers: "0",
    stories: "1",
  };

  assert.throws(() => calculateEstimate(answers, config), PricingError);
});

test("throws PricingError when a question the formula needs has been deleted from config", () => {
  const config = freshConfig();
  config.questions = config.questions.filter((q) => q.key !== "pitch");

  const answers = {
    roof_area: 1000,
    material: "asphalt_3tab",
    pitch: "low",
    layers: "0",
    stories: "1",
  };

  assert.throws(() => calculateEstimate(answers, config), PricingError);
});

test("owner-panel rate changes are reflected immediately (no restart needed)", () => {
  const config = freshConfig();
  const answers = {
    roof_area: 1000,
    material: "asphalt_arch",
    pitch: "low",
    layers: "0",
    stories: "1",
  };

  const before = calculateEstimate(answers, config);

  // Simulate the owner panel raising the architectural shingle rate to $7.00/sqft.
  const material = config.questions.find((q) => q.key === "material");
  material.options.find((o) => o.value === "asphalt_arch").rate_per_sqft = 7.0;

  const after = calculateEstimate(answers, config);

  assert.ok(after.estimate_mid > before.estimate_mid);
});
