import React, { useEffect, useState } from "react";
import { getAdminConfig, updateAdminConfig, ApiError } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const NUMERIC_OPTION_FIELDS = [
  { key: "rate_per_sqft", label: "Rate ($/sq ft)" },
  { key: "multiplier", label: "Multiplier (×)" },
  { key: "tear_off_per_sqft", label: "Tear-off rate ($/sq ft)" },
];

export default function ConfigEditor() {
  const { session, signOut } = useAuth();
  const [loadState, setLoadState] = useState("loading");
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // { type: "success"|"error", message }

  async function load() {
    setLoadState("loading");
    try {
      const data = await getAdminConfig(session.token);
      setConfig(data);
      setLoadState("ready");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return signOut();
      setLoadState("error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateQuestion(index, patch) {
    setConfig((prev) => {
      const questions = [...prev.questions];
      questions[index] = { ...questions[index], ...patch };
      return { ...prev, questions };
    });
  }

  function updateOption(qIndex, oIndex, patch) {
    setConfig((prev) => {
      const questions = [...prev.questions];
      const options = [...questions[qIndex].options];
      options[oIndex] = { ...options[oIndex], ...patch };
      questions[qIndex] = { ...questions[qIndex], options };
      return { ...prev, questions };
    });
  }

  function updateModifier(key, value) {
    setConfig((prev) => ({
      ...prev,
      modifiers: { ...prev.modifiers, [key]: value },
    }));
  }

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    try {
      const updated = await updateAdminConfig(session.token, config);
      setConfig(updated);
      setStatus({ type: "success", message: `Saved. Now live as version ${updated.config_version}.` });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return signOut();
      const detail =
        err instanceof ApiError && err.details?.length
          ? " " + err.details.map((d) => d.message).join(" ")
          : "";
      setStatus({
        type: "error",
        message: (err instanceof ApiError ? err.message : "Couldn't save.") + detail,
      });
    } finally {
      setSaving(false);
    }
  }

  if (loadState === "loading") {
    return <div className="card p-8 text-slate-soft">Loading configuration…</div>;
  }
  if (loadState === "error") {
    return (
      <div className="card p-8">
        <p className="text-brick-dark">Couldn't load the configuration.</p>
        <button className="btn-secondary mt-4" onClick={load}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">
            Rates, questions & business info
          </h2>
          <p className="text-sm text-slate-soft">
            Currently live: version {config.config_version}. Changes go live for
            homeowners the moment you save — no redeploy.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      {status && (
        <p
          className={`rounded-md px-4 py-2.5 text-sm ${
            status.type === "success"
              ? "bg-patina-light text-patina-dark"
              : "bg-brick-light text-brick-dark"
          }`}
        >
          {status.message}
        </p>
      )}

      <section className="card p-6">
        <h3 className="font-display text-lg font-semibold text-ink mb-4">
          Business info
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="field-label">Business name</label>
            <input
              className="field-input"
              value={config.business.name}
              onChange={(e) =>
                setConfig((p) => ({ ...p, business: { ...p.business, name: e.target.value } }))
              }
            />
          </div>
          <div>
            <label className="field-label">Region</label>
            <input
              className="field-input"
              value={config.business.region}
              onChange={(e) =>
                setConfig((p) => ({ ...p, business: { ...p.business, region: e.target.value } }))
              }
            />
          </div>
          <div>
            <label className="field-label">Currency</label>
            <input
              className="field-input"
              value={config.business.currency}
              onChange={(e) =>
                setConfig((p) => ({ ...p, business: { ...p.business, currency: e.target.value } }))
              }
            />
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h3 className="font-display text-lg font-semibold text-ink mb-4">
          Global modifiers
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <ModifierField
            label="Waste factor (%)"
            value={config.modifiers.waste_factor * 100}
            onChange={(pct) => updateModifier("waste_factor", pct / 100)}
          />
          <ModifierField
            label="Permit flat fee ($)"
            value={config.modifiers.permit_flat_fee}
            onChange={(v) => updateModifier("permit_flat_fee", v)}
          />
          <ModifierField
            label="Range spread (%)"
            value={config.modifiers.range_spread_pct}
            onChange={(v) => updateModifier("range_spread_pct", v)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-lg font-semibold text-ink">Questions</h3>
        {config.questions
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((q) => {
            const index = config.questions.findIndex((x) => x.key === q.key);
            return (
              <QuestionEditorCard
                key={q.key}
                question={q}
                onLabelChange={(label) => updateQuestion(index, { label })}
                onActiveChange={(active) => updateQuestion(index, { active })}
                onMinMaxChange={(patch) => updateQuestion(index, patch)}
                onOptionChange={(oIndex, patch) => updateOption(index, oIndex, patch)}
              />
            );
          })}
      </section>
    </div>
  );
}

function ModifierField({ label, value, onChange }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input
        type="number"
        step="any"
        className="field-input font-mono"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function QuestionEditorCard({ question, onLabelChange, onActiveChange, onMinMaxChange, onOptionChange }) {
  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-[240px]">
          <label className="field-label">Question label</label>
          <input
            className="field-input"
            value={question.label}
            onChange={(e) => onLabelChange(e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-soft font-mono">key: {question.key}</p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <label
            className={`flex items-center gap-2 text-sm ${
              question.lockedForPricing ? "cursor-not-allowed text-slate-soft" : "cursor-pointer text-ink"
            }`}
            title={
              question.lockedForPricing
                ? "This question feeds the pricing formula and can't be turned off."
                : undefined
            }
          >
            <input
              type="checkbox"
              className="h-4 w-4 accent-patina"
              checked={question.active}
              disabled={question.lockedForPricing}
              onChange={(e) => onActiveChange(e.target.checked)}
            />
            Active on public estimator
          </label>
          {question.lockedForPricing && (
            <span className="text-xs text-slate-soft">Required for pricing</span>
          )}
        </div>
      </div>

      {question.type === "number" && (
        <div className="mt-4 grid grid-cols-2 gap-4 max-w-xs">
          <div>
            <label className="field-label">Min</label>
            <input
              type="number"
              className="field-input font-mono"
              value={question.min ?? ""}
              onChange={(e) => onMinMaxChange({ min: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="field-label">Max</label>
            <input
              type="number"
              className="field-input font-mono"
              value={question.max ?? ""}
              onChange={(e) => onMinMaxChange({ max: Number(e.target.value) })}
            />
          </div>
        </div>
      )}

      {question.type === "select" && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-soft">
                <th className="pb-2 pr-4 font-medium">Option label</th>
                {NUMERIC_OPTION_FIELDS.filter((f) =>
                  question.options.some((o) => o[f.key] !== undefined)
                ).map((f) => (
                  <th key={f.key} className="pb-2 pr-4 font-medium">
                    {f.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {question.options.map((opt, oIndex) => (
                <tr key={opt.value} className="border-t border-slate/10">
                  <td className="py-2 pr-4">
                    <input
                      className="field-input"
                      value={opt.label}
                      onChange={(e) => onOptionChange(oIndex, { label: e.target.value })}
                    />
                  </td>
                  {NUMERIC_OPTION_FIELDS.filter((f) => opt[f.key] !== undefined).map((f) => (
                    <td key={f.key} className="py-2 pr-4">
                      <input
                        type="number"
                        step="0.01"
                        className="field-input font-mono w-32"
                        value={opt[f.key]}
                        onChange={(e) =>
                          onOptionChange(oIndex, { [f.key]: Number(e.target.value) })
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
