/**
 * Validates the payload the owner panel PUTs to /api/admin/config before
 * it's allowed to overwrite the live config. Keeps the same set of
 * questions/keys — this build supports editing existing questions
 * (labels, rates, multipliers, active state) but not adding brand new
 * ones, which the brief explicitly lists as an optional stretch goal
 * (see DECISIONS.md).
 */
export function validateConfigUpdate(payload, currentConfig) {
  const errors = [];

  if (!payload || typeof payload !== "object") {
    return { valid: false, errors: [{ field: "root", message: "Missing config payload." }] };
  }

  const { business, questions, modifiers } = payload;

  if (!business || !business.name || !business.region || !business.currency) {
    errors.push({ field: "business", message: "Business name, region, and currency are required." });
  }

  if (!modifiers) {
    errors.push({ field: "modifiers", message: "Modifiers are required." });
  } else {
    for (const key of ["waste_factor", "permit_flat_fee", "range_spread_pct"]) {
      const n = Number(modifiers[key]);
      if (!Number.isFinite(n) || n < 0) {
        errors.push({ field: `modifiers.${key}`, message: `"${key}" must be a non-negative number.` });
      }
    }
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    errors.push({ field: "questions", message: "Questions array is required." });
    return { valid: false, errors };
  }

  const currentByKey = new Map((currentConfig.questions || []).map((q) => [q.key, q]));
  const incomingKeys = new Set();

  questions.forEach((q, i) => {
    const path = `questions[${i}]`;
    if (!q.key || !currentByKey.has(q.key)) {
      errors.push({ field: path, message: `Unknown or missing question key at position ${i}.` });
      return;
    }
    incomingKeys.add(q.key);
    const original = currentByKey.get(q.key);

    if (!q.label || !String(q.label).trim()) {
      errors.push({ field: `${path}.label`, message: `"${q.key}" needs a label.` });
    }

    if (original.lockedForPricing && q.active === false) {
      errors.push({
        field: `${path}.active`,
        message: `"${q.key}" feeds the pricing formula and can't be deactivated.`,
      });
    }

    if (q.type === "number") {
      if (q.min !== undefined && q.max !== undefined && Number(q.min) > Number(q.max)) {
        errors.push({ field: `${path}.min`, message: `"${q.key}" min cannot be greater than max.` });
      }
    }

    if (q.type === "select") {
      if (!Array.isArray(q.options) || q.options.length === 0) {
        errors.push({ field: `${path}.options`, message: `"${q.key}" needs at least one option.` });
      } else {
        q.options.forEach((opt, j) => {
          const originalOpt = (original.options || []).find((o) => o.value === opt.value);
          if (!originalOpt) {
            errors.push({
              field: `${path}.options[${j}]`,
              message: `"${opt.value}" is not a recognized option for "${q.key}".`,
            });
            return;
          }
          for (const numField of ["rate_per_sqft", "multiplier", "tear_off_per_sqft"]) {
            if (originalOpt[numField] !== undefined) {
              const n = Number(opt[numField]);
              if (!Number.isFinite(n) || n < 0) {
                errors.push({
                  field: `${path}.options[${j}].${numField}`,
                  message: `"${opt.label || opt.value}" ${numField} must be a non-negative number.`,
                });
              }
            }
          }
        });
      }
    }
  });

  for (const key of currentByKey.keys()) {
    if (!incomingKeys.has(key)) {
      errors.push({ field: "questions", message: `Question "${key}" is missing from the update.` });
    }
  }

  return { valid: errors.length === 0, errors };
}
