import React from "react";

function formatCurrency(amount, currency) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${Math.round(amount).toLocaleString()}`;
  }
}

/**
 * The estimator's signature moment: a result presented like a contractor's
 * paper estimate slip rather than a generic "results card" — a perforated
 * top edge (the punch-hole notches), a rotated "ESTIMATE" stamp, and the
 * range set in mono numerals like a printed figure.
 */
export default function EstimateResult({ estimate, business, contact, onStartOver }) {
  return (
    <div className="relative">
      <div className="card relative overflow-hidden">
        {/* perforation notches */}
        <div className="absolute left-0 right-0 top-16 flex justify-between px-1">
          <div className="h-4 w-4 -translate-x-1/2 rounded-full bg-fog" />
          <div className="h-4 w-4 translate-x-1/2 rounded-full bg-fog" />
        </div>
        <div className="absolute left-0 right-0 top-[68px] border-t-2 border-dashed border-slate/20" />

        <div className="px-6 pb-4 pt-6 sm:px-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-display text-lg font-semibold text-ink">
                {business?.name}
              </p>
              <p className="text-sm text-slate-soft">{business?.region}</p>
            </div>
            <div className="rotate-3 rounded border-2 border-brick px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-brick">
              Estimate
            </div>
          </div>
        </div>

        <div className="px-6 pb-8 pt-10 sm:px-8">
          <p className="text-sm text-slate-soft">
            Ballpark cost range for {contact?.name || "your"} roof
          </p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono">
            <span className="text-4xl font-semibold text-ink sm:text-5xl">
              {formatCurrency(estimate.estimate_low, estimate.currency)}
            </span>
            <span className="text-xl text-slate-soft">–</span>
            <span className="text-4xl font-semibold text-ink sm:text-5xl">
              {formatCurrency(estimate.estimate_high, estimate.currency)}
            </span>
          </div>
          <p className="mt-4 max-w-md text-sm text-slate-soft">
            This is a preliminary estimate based on the details you gave us. A
            final number depends on an in-person inspection — we'll be in touch
            at the phone number or email you provided.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button type="button" className="btn-secondary" onClick={onStartOver}>
          Start a new estimate
        </button>
      </div>
    </div>
  );
}
