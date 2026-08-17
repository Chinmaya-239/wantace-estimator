import jwt from "jsonwebtoken";

/**
 * Protects /api/admin/* routes. Expects "Authorization: Bearer <token>".
 * This is intentionally simple single-role auth (see DECISIONS.md for why
 * that's the right call for a two-person owner panel, not a gap).
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing or malformed Authorization header." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session. Please log in again." });
  }
}
