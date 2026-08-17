import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * A single selectable option on a "select" question.
 *
 * The numeric fields below are intentionally all optional at the schema
 * level: which one(s) are meaningful depends on which question the option
 * belongs to (material options carry rate_per_sqft, pitch/stories options
 * carry multiplier, layers options carry tear_off_per_sqft). This keeps the
 * seed data's shape intact instead of forcing every option into one generic
 * "value" field. See DECISIONS.md for why the pricing engine stays coupled
 * to these named fields rather than a fully generic formula DSL.
 */
const OptionSchema = new Schema(
  {
    value: { type: String, required: true },
    label: { type: String, required: true },
    rate_per_sqft: { type: Number },
    multiplier: { type: Number },
    tear_off_per_sqft: { type: Number },
  },
  { _id: false }
);

const QuestionSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, enum: ["number", "select"], required: true },
    unit: { type: String },
    required: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    // Determines render/fetch order on the public estimator. Assigned from
    // seed array order since the original brief data has no explicit field.
    order: { type: Number, required: true },
    min: { type: Number },
    max: { type: Number },
    // True for the 5 questions the pricing formula actually reads
    // (roof_area, material, pitch, layers, stories). The owner panel
    // disables the "active" toggle for these — turning one off would make
    // the formula uncomputable. See DECISIONS.md.
    lockedForPricing: { type: Boolean, default: false },
    options: { type: [OptionSchema], default: undefined },
  },
  { _id: false }
);

const ConfigSchema = new Schema(
  {
    config_version: { type: Number, required: true },
    business: {
      name: { type: String, required: true },
      region: { type: String, required: true },
      currency: { type: String, required: true, default: "USD" },
    },
    questions: { type: [QuestionSchema], default: [] },
    modifiers: {
      waste_factor: { type: Number, required: true },
      permit_flat_fee: { type: Number, required: true },
      range_spread_pct: { type: Number, required: true },
    },
    updated_at: { type: Date, default: Date.now },
    updated_by: { type: String },
  },
  { timestamps: false }
);

// Only one Config document is kept "live" at a time in this build (see
// DECISIONS.md re: scoping out full version history as a stretch goal).
// We still bump config_version on every save so leads can record which
// version priced them.
ConfigSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

export default mongoose.model("Config", ConfigSchema);
