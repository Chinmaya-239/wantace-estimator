import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ConfigEditor from "../components/ConfigEditor.jsx";
import LeadsTable from "../components/LeadsTable.jsx";

const TABS = [
  { id: "config", label: "Config editor" },
  { id: "leads", label: "Leads" },
];

export default function AdminDashboardPage() {
  const { session, signOut } = useAuth();
  const [tab, setTab] = useState("config");

  return (
    <div className="min-h-screen bg-fog">
      <header className="border-b border-slate/10 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div>
            <p className="font-display text-lg font-semibold text-ink">Owner panel</p>
            <p className="text-xs text-slate-soft">Signed in as {session?.username}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm text-slate-soft hover:text-ink">
              View public estimator
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="text-sm font-medium text-brick hover:text-brick-dark"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <nav className="border-b border-slate/10 bg-white">
        <div className="mx-auto flex max-w-5xl gap-1 px-5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "border-patina text-ink"
                  : "border-transparent text-slate-soft hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-5 py-8">
        {tab === "config" ? <ConfigEditor /> : <LeadsTable />}
      </main>
    </div>
  );
}
