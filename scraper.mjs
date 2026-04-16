/**
 * AI Job Hunter — Local scraper
 *
 * Uses playwright-extra + stealth plugin so LinkedIn treats it as a real browser.
 * Launches a PERSISTENT context so your login session survives between runs.
 *
 * Usage:
 *   node scraper.js "<linkedin-jobs-search-url>"
 *
 * First run: The browser will open. Log in to LinkedIn manually, then close the
 * browser. On the next run, your session will be reused automatically.
 *
 * Environment variables (copy .env.example → .env):
 *   ANTHROPIC_API_KEY   required
 *   VERCEL_API_URL      optional — if set, results are POSTed to your deployed app
 */

import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { evaluateJob } from "./evaluator.js";

dotenv.config();

chromium.use(StealthPlugin());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USER_DATA_DIR = path.join(__dirname, "browser-session");
const RESULTS_FILE  = path.join(__dirname, "results.json");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Extract visible text from the active job description panel */
async function extractJobDescription(page) {
  return page.evaluate(() => {
    const panel =
      document.querySelector(".jobs-description__content") ||
      document.querySelector(".jobs-description-content__text") ||
      document.querySelector(".job-view-layout") ||
      document.querySelector("[data-test-id='job-detail-container']");
    return panel ? panel.innerText.trim() : "";
  });
}

/** Extract metadata (title, company, URL) from the active job card panel */
async function extractJobMeta(page) {
  return page.evaluate(() => {
    const get = (sel) =>
      document.querySelector(sel)?.innerText?.trim() || "";
    return {
      title:   get(".job-details-jobs-unified-top-card__job-title h1")   ||
               get(".jobs-unified-top-card__job-title h1")               ||
               get(".jobs-unified-top-card__job-title"),
      company: get(".job-details-jobs-unified-top-card__company-name a") ||
               get(".jobs-unified-top-card__company-name a")             ||
               get(".jobs-unified-top-card__company-name"),
      url:     window.location.href,
    };
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function scrape(linkedinUrl) {
  console.log("🚀 Launching persistent browser…");

  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,          // keep visible so you can log in on first run
    viewport: { width: 1280, height: 900 },
    args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
  });

  const page = await context.newPage();

  console.log(`🌐 Navigating to LinkedIn jobs…`);
  await page.goto(linkedinUrl, { waitUntil: "domcontentloaded", timeout: 40_000 });

  // Wait for job list — if not found, the user probably isn't logged in
  const listSelector =
    ".jobs-search__results-list, .scaffold-layout__list-container";

  try {
    await page.waitForSelector(listSelector, { timeout: 15_000 });
  } catch {
    console.warn(
      "\n⚠️  Job list not found — you may not be logged in.\n" +
      "   Log in to LinkedIn in the browser window, then re-run the script.\n"
    );
    await sleep(60_000); // give user time to log in
    await context.close();
    return [];
  }

  // Collect all visible job card elements
  const cardSelector =
    ".job-card-container--clickable, .jobs-search-results__list-item";
  const cards = await page.$$(cardSelector);
  console.log(`📋 Found ${cards.length} job cards\n`);

  const results = [];

  for (let i = 0; i < cards.length; i++) {
    try {
      await cards[i].scrollIntoViewIfNeeded();
      await cards[i].click();
      await sleep(1800); // wait for detail panel to render

      const description = await extractJobDescription(page);
      if (!description) {
        console.log(`  [${i + 1}/${cards.length}] ⏭  No description — skipping`);
        continue;
      }

      const meta = await extractJobMeta(page);
      console.log(`  [${i + 1}/${cards.length}] 🤖 Evaluating: ${meta.title || "Unknown"} @ ${meta.company || "Unknown"}`);

      const evaluation = await evaluateJob(description);

      const result = { ...meta, ...evaluation };
      results.push(result);

      const verdict = evaluation.should_apply ? "✅ APPLY" : "⛔ SKIP";
      const skills  = evaluation.matched_skills?.join(", ") || "none";
      console.log(`           ${verdict} | skills: ${skills}`);
      if (evaluation.has_external_redirect_or_video) {
        console.log(`           ⚠️  External redirect / video gate detected`);
      }
    } catch (err) {
      console.error(`  [${i + 1}/${cards.length}] ❌ Error:`, err.message);
    }
  }

  // ── Save results ───────────────────────────────────────────────────────────
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));

  const applyCount = results.filter((r) => r.should_apply).length;
  console.log(`\n✅ Done — ${results.length} jobs evaluated, ${applyCount} worth applying to`);
  console.log(`💾 Saved to ${RESULTS_FILE}`);

  // ── Optionally POST to Vercel deployment ──────────────────────────────────
  if (process.env.VERCEL_API_URL) {
    try {
      const endpoint = `${process.env.VERCEL_API_URL.replace(/\/$/, "")}/api/results`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobs: results }),
      });
      if (res.ok) {
        console.log(`🚀 Results synced to ${endpoint}`);
      }
    } catch (err) {
      console.warn("⚠️  Could not sync to Vercel:", err.message);
    }
  }

  await context.close();
  return results;
}

// ─── CLI entry-point ─────────────────────────────────────────────────────────

const url = process.argv[2];
if (!url) {
  console.error("Usage: node scraper.js \"<linkedin-jobs-search-url>\"");
  process.exit(1);
}

scrape(url).catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
