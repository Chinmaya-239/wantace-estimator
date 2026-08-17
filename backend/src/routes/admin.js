import { Router } from "express";
import Config from "../models/Config.js";
import Lead from "../models/Lead.js";
import { requireAuth } from "../middleware/auth.js";
import { getLiveConfig } from "../lib/getLiveConfig.js";
import { validateConfigUpdate } from "../lib/validateConfigUpdate.js";

const router = Router();
router.use(requireAuth);

// GET /api/admin/config — full config including rates, for the editor.
router.get("/config", async (req, res) => {
  try {
    const config = await getLiveConfig();
    res.json(config);
  } catch (err) {
    console.error("[GET /api/admin/config]", err.message);
    res.status(500).json({ error: "Could not load configuration." });
  }
});

// PUT /api/admin/config — updates rates/labels/toggles, bumps config_version.
router.put("/config", async (req, res) => {
  try {
    const current = await getLiveConfig();
    const { valid, errors } = validateConfigUpdate(req.body, current);
    if (!valid) {
      return res.status(400).json({ error: "Validation failed.", details: errors });
    }

    const { business, questions, modifiers } = req.body;

    // Preserve order/lockedForPricing from the current doc — those are
    // structural, not something the owner panel edits.
    const currentByKey = new Map(current.questions.map((q) => [q.key, q]));
    const mergedQuestions = questions.map((q) => {
      const original = currentByKey.get(q.key);
      return {
        key: q.key,
        label: q.label,
        type: original.type,
        unit: original.unit,
        required: original.required,
        active: original.lockedForPricing ? true : Boolean(q.active),
        order: original.order,
        min: q.type === "number" ? Number(q.min) : original.min,
        max: q.type === "number" ? Number(q.max) : original.max,
        lockedForPricing: original.lockedForPricing,
        options:
          original.type === "select"
            ? q.options.map((opt) => {
                const originalOpt = original.options.find((o) => o.value === opt.value);
                return {
                  value: originalOpt.value,
                  label: opt.label,
                  ...(originalOpt.rate_per_sqft !== undefined && {
                    rate_per_sqft: Number(opt.rate_per_sqft),
                  }),
                  ...(originalOpt.multiplier !== undefined && {
                    multiplier: Number(opt.multiplier),
                  }),
                  ...(originalOpt.tear_off_per_sqft !== undefined && {
                    tear_off_per_sqft: Number(opt.tear_off_per_sqft),
                  }),
                };
              })
            : undefined,
      };
    });

    const updated = await Config.findByIdAndUpdate(
      current._id,
      {
        $set: {
          business: {
            name: business.name,
            region: business.region,
            currency: business.currency,
          },
          questions: mergedQuestions,
          modifiers: {
            waste_factor: Number(modifiers.waste_factor),
            permit_flat_fee: Number(modifiers.permit_flat_fee),
            range_spread_pct: Number(modifiers.range_spread_pct),
          },
          config_version: current.config_version + 1,
          updated_at: new Date(),
          updated_by: req.user?.sub || "owner",
        },
      },
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("[PUT /api/admin/config]", err.message);
    res.status(500).json({ error: "Could not save configuration." });
  }
});

// GET /api/admin/leads — most recent first.
router.get("/leads", async (req, res) => {
  try {
    const leads = await Lead.find().sort({ captured_at: -1 }).lean();
    res.json(leads);
  } catch (err) {
    console.error("[GET /api/admin/leads]", err.message);
    res.status(500).json({ error: "Could not load leads." });
  }
});

// GET /api/admin/leads/export.csv — stretch goal: CSV export for Marcus.
router.get("/leads/export.csv", async (req, res) => {
  try {
    const leads = await Lead.find().sort({ captured_at: -1 }).lean();

    const escape = (val) => {
      const s = val === undefined || val === null ? "" : String(val);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const header = [
      "captured_at",
      "config_version",
      "name",
      "phone",
      "email",
      "estimate_low",
      "estimate_high",
      "answers_json",
    ];

    const rows = leads.map((lead) =>
      [
        lead.captured_at?.toISOString?.() ?? lead.captured_at,
        lead.config_version,
        lead.name,
        lead.phone,
        lead.email,
        lead.estimate_low,
        lead.estimate_high,
        JSON.stringify(lead.answers),
      ]
        .map(escape)
        .join(",")
    );

    const csv = [header.join(","), ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="leads-export.csv"`);
    res.send(csv);
  } catch (err) {
    console.error("[GET /api/admin/leads/export.csv]", err.message);
    res.status(500).json({ error: "Could not export leads." });
  }
});

export default router;
