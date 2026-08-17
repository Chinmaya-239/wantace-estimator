/**
 * Validates a submitted estimate request against the *currently active*
 * config. Returns { valid, errors } instead of throwing so the route can
 * return a single well-shaped 400 response listing every problem at once
 * (rather than failing fast on the first bad field), which is friendlier
 * for a homeowner filling this out on a phone.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGITS_RE = /\d/g;

export function validateContact(contact = {}) {
  const errors = [];
  const name = String(contact.name ?? "").trim();
  const phone = String(contact.phone ?? "").trim();
  const email = String(contact.email ?? "").trim();

  if (!name) errors.push({ field: "name", message: "Name is required." });

  if (!phone) {
    errors.push({ field: "phone", message: "Phone number is required." });
  } else {
    const digitCount = (phone.match(PHONE_DIGITS_RE) || []).length;
    if (digitCount < 7) {
      errors.push({
        field: "phone",
        message: "Enter a valid phone number.",
      });
    }
  }

  if (!email) {
    errors.push({ field: "email", message: "Email is required." });
  } else if (!EMAIL_RE.test(email)) {
    errors.push({ field: "email", message: "Enter a valid email address." });
  }

  return { valid: errors.length === 0, errors, clean: { name, phone, email } };
}

export function validateAnswers(answers = {}, config) {
  const errors = [];
  const activeQuestions = (config.questions || []).filter((q) => q.active);

  for (const q of activeQuestions) {
    const raw = answers[q.key];
    const present = raw !== undefined && raw !== null && raw !== "";

    if (q.required && !present) {
      errors.push({
        field: q.key,
        message: `"${q.label}" is required.`,
      });
      continue;
    }

    if (!present) continue; // optional and not answered — fine

    if (q.type === "number") {
      const n = Number(raw);
      if (!Number.isFinite(n)) {
        errors.push({ field: q.key, message: `"${q.label}" must be a number.` });
        continue;
      }
      if (q.min !== undefined && q.min !== null && n < q.min) {
        errors.push({
          field: q.key,
          message: `"${q.label}" must be at least ${q.min}${q.unit ? " " + q.unit : ""}.`,
        });
      }
      if (q.max !== undefined && q.max !== null && n > q.max) {
        errors.push({
          field: q.key,
          message: `"${q.label}" must be at most ${q.max}${q.unit ? " " + q.unit : ""}.`,
        });
      }
    }

    if (q.type === "select") {
      const validValues = (q.options || []).map((o) => o.value);
      if (!validValues.includes(String(raw))) {
        errors.push({
          field: q.key,
          message: `"${raw}" is not a valid choice for "${q.label}".`,
        });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
