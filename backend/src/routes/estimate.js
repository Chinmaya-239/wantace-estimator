import { Router } from "express";
import Lead from "../models/Lead.js";
import { getLiveConfig } from "../lib/getLiveConfig.js";
import { validateAnswers, validateContact } from "../lib/validateAnswers.js";
import { calculateEstimate, PricingError } from "../lib/pricingEngine.js";

const router = Router();

// POST /api/estimate — public. Validates, calculates server-side, stores lead.
router.post("/", async (req, res) => {
  const { name, phone, email, answers } = req.body || {};

  if (!answers || typeof answers !== "object") {
    return res.status(400).json({ error: "Missing answers payload." });
  }

  let config;
  try {
    config = await getLiveConfig();
  } catch (err) {
    console.error("[POST /api/estimate] config load failed:", err.message);
    return res.status(500).json({ error: "Could not load configuration." });
  }

  const contactResult = validateContact({ name, phone, email });
  const answersResult = validateAnswers(answers, config);
  const allErrors = [...contactResult.errors, ...answersResult.errors];

  if (allErrors.length > 0) {
    return res.status(400).json({ error: "Validation failed.", details: allErrors });
  }

  let estimate;
  try {
    estimate = calculateEstimate(answers, config);
  } catch (err) {
    if (err instanceof PricingError) {
      console.error("[POST /api/estimate] pricing error:", err.message);
      return res.status(400).json({ error: err.message, field: err.field });
    }
    console.error("[POST /api/estimate] unexpected pricing failure:", err);
    return res.status(500).json({ error: "Could not calculate an estimate." });
  }

  try {
    const lead = await Lead.create({
      captured_at: new Date(),
      config_version: config.config_version,
      name: contactResult.clean.name,
      phone: contactResult.clean.phone,
      email: contactResult.clean.email,
      answers,
      estimate_low: estimate.estimate_low,
      estimate_high: estimate.estimate_high,
    });

    res.status(201).json({
      lead_id: lead._id,
      currency: config.business?.currency || "USD",
      estimate_low: estimate.estimate_low,
      estimate_high: estimate.estimate_high,
    });
  } catch (err) {
    console.error("[POST /api/estimate] failed to save lead:", err.message);
    res.status(500).json({ error: "Could not save your estimate. Please try again." });
  }
});

export default router;
