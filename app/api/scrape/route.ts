// ─── POST /api/scrape ─────────────────────────────────────────────────────────
// Full pipeline: scrape LinkedIn → AI analysis → filter → loop until quota → score
//
// Scraping strategy:
//   1. If DEMO_MODE=true (default): generate mock jobs
//   2. Otherwise: launch playwright-extra + stealth, set li_at cookie, scrape LinkedIn
//      Falls back to demo if Playwright is unavailable (e.g. Vercel serverless)
//
// Loop logic: scrape → analyze → if valid < requested → scrape next page (up to MAX_PASSES)

import { NextRequest, NextResponse } from 'next/server';
import type { RawJob, ScrapeOptions, ProcessResult, AnalyzedJob } from '@/types';
import { generateMockJobs } from '@/lib/mockJobs';
import { analyzeJobs, generateApplicationMessage, scoreJob } from '@/lib/aiAnalyzer';

export const maxDuration = 60;

const MAX_PASSES   = 3;
const BATCH_FACTOR = 1.5;

// ─── LinkedIn URL builder ─────────────────────────────────────────────────────

function buildLinkedInUrl(options: ScrapeOptions, offset = 0): string {
  const DATE_MAP: Record<string, string> = { '24h': 'r86400', '7d': 'r604800', '30d': 'r2592000' };
  const EXP_MAP:  Record<string, string> = {
    internship: '1', entry: '2', associate: '3', 'mid-senior': '4', director: '5', executive: '6',
  };
  const WORK_MAP: Record<string, string> = { remote: '2', hybrid: '3', onsite: '1' };
  const JOB_MAP:  Record<string, string> = {
    'full-time': 'F', 'part-time': 'P', contract: 'C',
  };

  const params = new URLSearchParams({ keywords: options.keyword });
  if (options.location)       params.set('location', options.location);
  if (options.datePosted && DATE_MAP[options.datePosted]) params.set('f_TPR', DATE_MAP[options.datePosted]);
  if (options.experienceLevel && EXP_MAP[options.experienceLevel]) params.set('f_E', EXP_MAP[options.experienceLevel]);
  if (options.workType && options.workType !== 'any' && WORK_MAP[options.workType]) params.set('f_WT', WORK_MAP[options.workType]);
  if (options.employmentType && options.employmentType !== 'any' && JOB_MAP[options.employmentType]) params.set('f_JT', JOB_MAP[options.employmentType]);
  if (offset > 0) params.set('start', String(offset));

  return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
}

// ─── Live Playwright scraper ──────────────────────────────────────────────────

async function scrapeLinkedIn(
  options: ScrapeOptions,
  limit: number,
  offset = 0
): Promise<RawJob[]> {
  // Dynamic imports — so bundlers don't try to bundle the browser at build time
  const { chromium } = await import('playwright-extra');
  const StealthPlugin = (await import('puppeteer-extra-plugin-stealth')).default;
  chromium.use(StealthPlugin());

  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  const browser  = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    ...(executablePath ? { executablePath } : {}),
  });
  const context  = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport:  { width: 1280, height: 900 },
  });

  // Inject the li_at session cookie so LinkedIn treats us as logged-in
  if (options.liAtCookie) {
    await context.addCookies([{
      name:     'li_at',
      value:    options.liAtCookie,
      domain:   '.linkedin.com',
      path:     '/',
      httpOnly: true,
      secure:   true,
      sameSite: 'None',
    }]);
  }

  const page = await context.newPage();
  const url  = buildLinkedInUrl(options, offset);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

  // Wait for job cards to appear
  await page.waitForSelector(
    '.jobs-search__results-list, .scaffold-layout__list-container, .base-card',
    { timeout: 15_000 }
  ).catch(() => null);

  const jobs: RawJob[] = [];

  // ── Iterate visible job cards ─────────────────────────────────────────────
  const cardHandles = await page.$$(
    '.jobs-search__results-list li, .scaffold-layout__list-container .job-card-container--clickable, .base-card'
  );

  for (let i = 0; i < Math.min(cardHandles.length, limit * 2); i++) {
    try {
      await cardHandles[i].scrollIntoViewIfNeeded();
      await cardHandles[i].click();
      await page.waitForTimeout(1500);

      const job = await page.evaluate((_idx: number): Omit<RawJob, 'id' | 'query'> => {
        // ── Job description panel ───────────────────────────────────────────
        const descEl =
          document.querySelector('.jobs-description__content .jobs-description-content__text') ||
          document.querySelector('.jobs-description__content') ||
          document.querySelector('.job-view-layout');

        // ── Top card metadata ───────────────────────────────────────────────
        const get = (sel: string) =>
          (document.querySelector(sel) as HTMLElement | null)?.innerText?.trim() ?? null;

        const title =
          get('.job-details-jobs-unified-top-card__job-title h1') ||
          get('.jobs-unified-top-card__job-title h1')             ||
          get('.jobs-unified-top-card__job-title');

        const company =
          get('.job-details-jobs-unified-top-card__company-name a') ||
          get('.jobs-unified-top-card__company-name a')             ||
          get('.jobs-unified-top-card__company-name');

        const location =
          get('.job-details-jobs-unified-top-card__bullet')  ||
          get('.jobs-unified-top-card__bullet')              ||
          get('.topcard__flavor--bullet');

        const salary =
          get('.job-details-jobs-unified-top-card__job-insight span') ||
          get('.compensation__salary') || null;

        const employmentType =
          get('.job-details-jobs-unified-top-card__job-insight:nth-of-type(2)') || null;

        // Work type badge
        const allInsights = Array.from(document.querySelectorAll(
          '.job-details-jobs-unified-top-card__job-insight, .jobs-unified-top-card__job-insight'
        )).map((el) => (el as HTMLElement).innerText?.trim() ?? '');
        const workTypeRaw = allInsights.find(t => /remote|hybrid|on-site/i.test(t)) ?? null;
        let workType: 'Remote' | 'Hybrid' | 'On-site' | null = null;
        if (workTypeRaw) {
          if (/remote/i.test(workTypeRaw))  workType = 'Remote';
          else if (/hybrid/i.test(workTypeRaw)) workType = 'Hybrid';
          else workType = 'On-site';
        }

        return {
          title,
          companyName: company,
          location,
          workType,
          employmentType,
          salary,
          description: descEl ? (descEl as HTMLElement).innerText?.trim() ?? null : null,
          datePosted: new Date().toISOString(),
          url: window.location.href,
        };
      }, i);

      if (job.title || job.description) {
        jobs.push({ ...job, id: `live-${i}-${Date.now()}`, query: options.keyword });
      }
    } catch {
      // Non-fatal — skip this card
    }
  }

  await browser.close();
  return jobs;
}

// ─── Aggregate helpers ────────────────────────────────────────────────────────

function aggregateSkills(jobs: AnalyzedJob[]): string[] {
  const freq: Record<string, number> = {};
  jobs.forEach(j => j.analysis.skills.forEach(s => { freq[s] = (freq[s] ?? 0) + 1; }));
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([s]) => s);
}

function aggregateKeywords(jobs: AnalyzedJob[], base: string): string[] {
  const freq: Record<string, number> = {};
  jobs.forEach(j => j.analysis.keywords.forEach(k => { freq[k] = (freq[k] ?? 0) + 1; }));
  freq[base] = (freq[base] ?? 0) + 3;
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => k);
}

function commonRequirements(jobs: AnalyzedJob[]): string[] {
  const patterns = [
    { label: 'CV / Resume required',  test: (j: AnalyzedJob) => j.analysis.requires_cv },
    { label: 'External platform redirect', test: (j: AnalyzedJob) => j.analysis.platform_redirect },
    { label: 'Video intro required',   test: (j: AnalyzedJob) => j.analysis.requires_file_upload },
    { label: 'Remote-friendly',        test: (j: AnalyzedJob) => j.workType === 'Remote' },
    { label: 'Python required',        test: (j: AnalyzedJob) => j.analysis.skills.includes('python') },
    { label: 'n8n mentioned',          test: (j: AnalyzedJob) => j.analysis.skills.includes('n8n') },
  ];
  return patterns
    .filter(p => jobs.filter(j => p.test(j)).length > jobs.length * 0.3)
    .map(p => p.label);
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const options: ScrapeOptions = await req.json();
    const { keyword, limit = 10, liAtCookie } = options;

    if (!keyword?.trim()) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
    }

    const anthropicKey = process.env.OPENROUTER_API_KEY;
    const demoMode     = process.env.DEMO_MODE !== 'false';
    const targetCount  = Math.min(Math.max(limit, 1), 30);

    const validJobs: AnalyzedJob[] = [];
    const removedJobs: { job: RawJob; reason: string }[] = [];
    const seenUrls    = new Set<string>();
    let totalScraped  = 0;
    let passes        = 0;
    let isLiveData    = false;
    let scrapeOffset  = 0;

    // ── Scrape + analyze loop ─────────────────────────────────────────────────
    while (validJobs.length < targetCount && passes < MAX_PASSES) {
      passes++;
      const needed = Math.ceil((targetCount - validJobs.length) * BATCH_FACTOR) + 5;

      let rawBatch: RawJob[] = [];

      if (!demoMode && liAtCookie) {
        try {
          rawBatch = await scrapeLinkedIn(options, needed, scrapeOffset);
          if (rawBatch.length > 0) isLiveData = true;
          scrapeOffset += rawBatch.length;
        } catch (err) {
          console.warn('[scrape] Playwright failed, falling back to demo:', (err as Error).message);
        }
      }

      if (rawBatch.length === 0) {
        rawBatch = generateMockJobs(keyword, needed);
      }

      totalScraped += rawBatch.length;

      // De-dupe
      const freshBatch = rawBatch.filter(job => {
        if (seenUrls.has(job.url ?? '')) return false;
        if (job.url) seenUrls.add(job.url);
        return true;
      });

      // AI analysis
      const analyzed = await analyzeJobs(freshBatch, keyword, anthropicKey);

      // Post-AI filter: remove video-upload-gated jobs
      for (const job of analyzed) {
        if (job.analysis.requires_file_upload) {
          removedJobs.push({
            job,
            reason: `Requires file upload: ${job.analysis.required_files.join(', ')}`,
          });
        } else {
          validJobs.push(job);
        }
      }
    }

    const finalJobs = validJobs.slice(0, targetCount);

    // Re-score with final context and sort
    finalJobs.forEach(j => { j.score = scoreJob(j, j.analysis, keyword); });
    finalJobs.sort((a, b) => b.score - a.score);

    const bestMatches        = finalJobs.slice(0, 3);
    const topSkills          = aggregateSkills(finalJobs);
    const suggestedKeywords  = aggregateKeywords(finalJobs, keyword);
    const commonReqs         = commonRequirements(finalJobs);
    const applicationMessage = await generateApplicationMessage(finalJobs, anthropicKey);

    const result: ProcessResult = {
      validJobs: finalJobs,
      removedJobs,
      topSkills,
      commonRequirements: commonReqs,
      suggestedKeywords,
      bestMatches,
      applicationMessage,
      stats: {
        totalScraped,
        totalAnalyzed: validJobs.length + removedJobs.length,
        totalRemoved:  removedJobs.length,
        scrapePasses:  passes,
      },
      isLiveData,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('[/api/scrape]', err);
    return NextResponse.json(
      { error: (err as Error).message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
