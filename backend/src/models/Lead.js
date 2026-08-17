import mongoose from "mongoose";

const { Schema } = mongoose;

const LeadSchema = new Schema(
  {
    captured_at: { type: Date, default: Date.now },
    config_version: { type: Number, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    // Mixed on purpose: historical leads (e.g. config_version 1 in the seed
    // export) carry a different set of answer keys than the current config
    // (chimney_count, gutter_replace, a discontinued "slate_natural"
    // material). Locking this down to the current question schema would
    // make legacy leads impossible to store as-received. See DECISIONS.md.
    answers: { type: Schema.Types.Mixed, required: true },
    estimate_low: { type: Number, required: true },
    estimate_high: { type: Number, required: true },
  },
  { timestamps: false }
);

LeadSchema.index({ captured_at: -1 });

export default mongoose.model("Lead", LeadSchema);
