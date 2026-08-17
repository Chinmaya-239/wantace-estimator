import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Config from "../models/Config.js";
import Lead from "../models/Lead.js";
import { seedConfig, seedLeads } from "./seedData.js";

async function run() {
  await connectDB();

  const existingConfig = await Config.countDocuments();
  if (existingConfig > 0) {
    console.log(
      `[seed] ${existingConfig} config document(s) already exist — skipping config seed. ` +
        "Delete the 'configs' collection first if you want to reseed from scratch."
    );
  } else {
    await Config.create(seedConfig);
    console.log("[seed] inserted seed config (version 3).");
  }

  const existingLeads = await Lead.countDocuments();
  if (existingLeads > 0) {
    console.log(`[seed] ${existingLeads} lead(s) already exist — skipping lead seed.`);
  } else {
    await Lead.insertMany(seedLeads);
    console.log(`[seed] inserted ${seedLeads.length} historical leads.`);
  }

  await mongoose.disconnect();
  console.log("[seed] done.");
}

run().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
