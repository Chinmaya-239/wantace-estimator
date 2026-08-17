import React, { useEffect, useState } from "react";
import { getLeads, downloadLeadsCsv, ApiError } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function formatCurrency(amount) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
}

// Turns an answer key like "gutter_replace" into "Gutter replace" for
// display. Legacy leads carry keys that don't exist in the current
// config's questions, so we render whatever is actually there rather than
// mapping against known question labels.
function humanizeKey(key) {
  const spaced = key.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export default function LeadsTable() {
  const { session, signOut } = useAuth();
  const [loadState, setLoadState] = useState("loading");
  const [leads, setLeads] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  async function load() {
    setLoadState("loading");
    try {
      const data = await getLeads(session.token);
      setLeads(data);
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

  async function handleExport() {
    setExporting(true);
    setExportError("");
    try {
      await downloadLeadsCsv(session.token);
    } catch (err) {
      setExportError("Couldn't export leads. Try again.");
    } finally {
      setExporting(false);
    }
  }

  if (loadState === "loading") {
    return <div className="card p-8 text-slate-soft">Loading leads…</div>;
  }
  if (loadState === "error") {
    return (
      <div className="card p-8">
        <p className="text-brick-dark">Couldn't load leads.</p>
        <button className="btn-secondary mt-4" onClick={load}>
          Try again
        </button>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="font-display text-lg font-semibold text-ink">
          No leads yet
        </p>
        <p className="mt-1 text-sm text-slate-soft">
          Leads show up here as soon as someone completes the public
          estimator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">
            Leads
          </h2>
          <p className="text-sm text-slate-soft">
            {leads.length} captured, most recent first.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {exportError && <span className="text-sm text-brick-dark">{exportError}</span>}
          <button type="button" className="btn-secondary" onClick={handleExport} disabled={exporting}>
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {/* Desktop table */}
        <table className="hidden w-full text-sm sm:table">
          <thead>
            <tr className="border-b border-slate/10 bg-fog/60 text-left text-xs uppercase tracking-wide text-slate-soft">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Submitted</th>
              <th className="px-4 py-3 font-medium">Estimate range</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <LeadRow
                key={lead._id}
                lead={lead}
                expanded={expandedId === lead._id}
                onToggle={() => setExpandedId(expandedId === lead._id ? null : lead._id)}
              />
            ))}
          </tbody>
        </table>

        {/* Mobile cards */}
        <div className="divide-y divide-slate/10 sm:hidden">
          {leads.map((lead) => (
            <LeadCard
              key={lead._id}
              lead={lead}
              expanded={expandedId === lead._id}
              onToggle={() => setExpandedId(expandedId === lead._id ? null : lead._id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AnswersList({ answers, configVersion }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-soft">
        Submitted answers (config v{configVersion})
      </p>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {Object.entries(answers).map(([key, value]) => (
          <div key={key} className="flex justify-between gap-3 text-sm sm:justify-start">
            <dt className="text-slate-soft">{humanizeKey(key)}</dt>
            <dd className="font-mono text-ink">{String(value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function LeadRow({ lead, expanded, onToggle }) {
  return (
    <>
      <tr className="border-b border-slate/10 last:border-0 hover:bg-fog/40">
        <td className="px-4 py-3 font-medium text-ink">{lead.name}</td>
        <td className="px-4 py-3 text-ink">{lead.phone}</td>
        <td className="px-4 py-3 text-ink">{lead.email}</td>
        <td className="px-4 py-3 text-slate-soft">{formatDate(lead.captured_at)}</td>
        <td className="px-4 py-3 font-mono text-ink">
          {formatCurrency(lead.estimate_low)} – {formatCurrency(lead.estimate_high)}
        </td>
        <td className="px-4 py-3 text-right">
          <button type="button" onClick={onToggle} className="text-sm font-medium text-patina hover:text-patina-dark">
            {expanded ? "Hide" : "Details"}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-slate/10 bg-fog/30">
          <td colSpan={6} className="px-4 py-4">
            <AnswersList answers={lead.answers} configVersion={lead.config_version} />
          </td>
        </tr>
      )}
    </>
  );
}

function LeadCard({ lead, expanded, onToggle }) {
  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-ink">{lead.name}</p>
          <p className="text-sm text-slate-soft">{lead.phone}</p>
          <p className="text-sm text-slate-soft">{lead.email}</p>
        </div>
        <p className="whitespace-nowrap font-mono text-sm text-ink">
          {formatCurrency(lead.estimate_low)}–{formatCurrency(lead.estimate_high)}
        </p>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-slate-soft">{formatDate(lead.captured_at)}</p>
        <button type="button" onClick={onToggle} className="text-sm font-medium text-patina">
          {expanded ? "Hide details" : "Details"}
        </button>
      </div>
      {expanded && (
        <div className="mt-3 border-t border-slate/10 pt-3">
          <AnswersList answers={lead.answers} configVersion={lead.config_version} />
        </div>
      )}
    </div>
  );
}
