import React from "react";

/**
 * Renders one form control for a question object that came from
 * GET /api/config. Nothing here — no options, no labels, no min/max — is
 * hardcoded; it all comes from `question`, which the backend controls.
 */
export default function QuestionField({ question, value, onChange, error }) {
  if (question.type === "number") {
    return (
      <div>
        <label className="field-label" htmlFor={question.key}>
          {question.label}
          {question.unit ? (
            <span className="text-slate-soft font-normal"> ({question.unit})</span>
          ) : null}
        </label>
        <input
          id={question.key}
          name={question.key}
          type="number"
          inputMode="numeric"
          className="field-input font-mono"
          value={value ?? ""}
          min={question.min}
          max={question.max}
          placeholder={
            question.min !== undefined && question.max !== undefined
              ? `Between ${question.min} and ${question.max}`
              : undefined
          }
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${question.key}-error` : undefined}
        />
        {question.min !== undefined && question.max !== undefined && (
          <p className="mt-1.5 text-xs text-slate-soft">
            Enter a value between {question.min} and {question.max} {question.unit}.
          </p>
        )}
        {error && (
          <p id={`${question.key}-error`} className="field-error">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (question.type === "select") {
    return (
      <fieldset>
        <legend className="field-label">{question.label}</legend>
        <div className="space-y-2">
          {(question.options || []).map((opt) => {
            const checked = value === opt.value;
            return (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 transition-colors ${
                  checked
                    ? "border-patina bg-patina-light"
                    : "border-slate/20 bg-white hover:border-patina/50"
                }`}
              >
                <input
                  type="radio"
                  name={question.key}
                  value={opt.value}
                  checked={checked}
                  onChange={() => onChange(opt.value)}
                  className="h-4 w-4 accent-patina"
                />
                <span className="text-sm text-ink">{opt.label}</span>
              </label>
            );
          })}
        </div>
        {error && <p className="field-error">{error}</p>}
      </fieldset>
    );
  }

  return null;
}
