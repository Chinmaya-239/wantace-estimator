import Config from "../models/Config.js";

/**
 * This build keeps a single Config document that is updated in place on
 * every owner-panel save (config_version increments, updated_at bumps).
 * Sorting by config_version defensively handles the unlikely case of more
 * than one document existing (e.g. a re-run seed) without ever needing a
 * migration. Full multi-version history is scoped out — see DECISIONS.md.
 */
export async function getLiveConfig() {
  const config = await Config.findOne().sort({ config_version: -1 }).lean();
  if (!config) {
    throw new Error(
      "No configuration found in the database. Run `npm run seed` in backend/ first."
    );
  }
  return config;
}
