import { Router } from "express";
import { getLiveConfig } from "../lib/getLiveConfig.js";

const router = Router();

/**
 * Strips every pricing-relevant field from a question before it goes to
 * the public estimator. The frontend needs to know a question exists, its
 * label, its type, and which values are selectable — it must never
 * receive rate_per_sqft / multiplier / tear_off_per_sqft, otherwise
 * someone could read the network tab and reconstruct the pricing formula,
 * or tamper with a client-side calculation. Calculation only ever happens
 * in POST /api/estimate, server-side.
 */
function toPublicQuestion(q) {
  const base = {
    key: q.key,
    label: q.label,
    type: q.type,
    required: q.required,
    order: q.order,
  };
  if (q.type === "number") {
    base.unit = q.unit;
    base.min = q.min;
    base.max = q.max;
  }
  if (q.type === "select") {
    base.options = (q.options || []).map((o) => ({
      value: o.value,
      label: o.label,
    }));
  }
  return base;
}

// GET /api/config — public. Only active questions, sorted, no pricing data.
router.get("/", async (req, res) => {
  try {
    const config = await getLiveConfig();
    const activeQuestions = (config.questions || [])
      .filter((q) => q.active)
      .sort((a, b) => a.order - b.order)
      .map(toPublicQuestion);

    res.json({
      config_version: config.config_version,
      business: config.business,
      questions: activeQuestions,
    });
  } catch (err) {
    console.error("[GET /api/config]", err.message);
    res.status(500).json({ error: "Could not load configuration." });
  }
});

export default router;
