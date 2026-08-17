const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError(
      "Couldn't reach the server. Check your connection and try again.",
      0
    );
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError(
      data?.error || `Request failed (${res.status}).`,
      res.status,
      data?.details
    );
  }

  return data;
}

// --- Public ---

export const getConfig = () => request("/api/config");

export const submitEstimate = (payload) =>
  request("/api/estimate", { method: "POST", body: payload });

// --- Auth ---

export const login = (username, password) =>
  request("/api/auth/login", { method: "POST", body: { username, password } });

// --- Owner panel (protected) ---

export const getAdminConfig = (token) =>
  request("/api/admin/config", { token });

export const updateAdminConfig = (token, config) =>
  request("/api/admin/config", { method: "PUT", body: config, token });

export const getLeads = (token) => request("/api/admin/leads", { token });

// /api/admin/leads/export.csv is auth-protected, so this can't be a plain
// <a href>: it fetches with the bearer token, then triggers a download.
export async function downloadLeadsCsv(token) {
  const res = await fetch(`${API_URL}/api/admin/leads/export.csv`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new ApiError("Couldn't export leads.", res.status);
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "leads-export.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export { API_URL };
