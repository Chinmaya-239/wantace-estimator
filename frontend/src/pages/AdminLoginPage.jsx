import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { login, ApiError } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function AdminLoginPage() {
  const { session, signIn } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (session?.token) return <Navigate to="/admin" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await login(username.trim(), password);
      signIn(data.token, data.username);
      navigate("/admin");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't sign in. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-fog px-5">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="font-display text-2xl font-semibold text-ink">
            Owner panel
          </p>
          <p className="mt-1 text-sm text-slate-soft">
            Sign in to manage rates, questions, and leads.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          <div>
            <label className="field-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className="field-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </div>
          <div>
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="rounded-md bg-brick-light px-3 py-2 text-sm text-brick-dark">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-soft">
          <a href="/" className="hover:text-ink">
            ← Back to the estimator
          </a>
        </p>
      </div>
    </div>
  );
}
