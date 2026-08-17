import React from "react";

export default function ProgressSteps({ current, total }) {
  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between text-xs font-mono text-slate-soft">
        <span>
          Step {Math.min(current + 1, total)} of {total}
        </span>
        <span>{Math.round((Math.min(current, total) / total) * 100)}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate/10">
        <div
          className="h-full rounded-full bg-patina transition-all duration-300 ease-out"
          style={{ width: `${(Math.min(current, total) / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
