import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const router = Router();

/**
 * Credentials live in env vars, hashed at process start (not stored in the
 * DB — there's exactly one owner-panel account shared by Dale and Marcus
 * in this build; see DECISIONS.md for why full multi-user accounts were
 * scoped out). ADMIN_PASSWORD_HASH takes precedence if set; otherwise the
 * plaintext ADMIN_PASSWORD from .env is hashed on the fly for comparison.
 */
function getAdminHash() {
  if (process.env.ADMIN_PASSWORD_HASH) return process.env.ADMIN_PASSWORD_HASH;
  const plain = process.env.ADMIN_PASSWORD;
  if (!plain) return null;
  return bcrypt.hashSync(plain, 10);
}

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  const expectedUsername = process.env.ADMIN_USERNAME;
  const hash = getAdminHash();

  if (!expectedUsername || !hash) {
    console.error("[POST /api/auth/login] ADMIN_USERNAME / ADMIN_PASSWORD not configured");
    return res.status(500).json({ error: "Owner login is not configured on the server." });
  }

  const usernameMatches = username === expectedUsername;
  const passwordMatches = bcrypt.compareSync(password, hash);

  if (!usernameMatches || !passwordMatches) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }

  const token = jwt.sign(
    { sub: username, role: "owner" },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "12h" }
  );

  res.json({ token, username });
});

export default router;
