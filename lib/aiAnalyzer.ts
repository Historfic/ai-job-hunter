// ─── AI Analyzer ──────────────────────────────────────────────────────────────
// Analyzes raw job listings using:
//   A) OpenRouter API (when OPENROUTER_API_KEY is set) — llama-3.1-8b-instruct:free
//   B) Local regex heuristics (zero-config fallback)

import type { RawJob, JobAnalysis, AnalyzedJob } from '@/types';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'meta-llama/llama-3.1-8b-instruct:free';

// ─── Keyword lists ─────────────────────────────────────────────────────────────

const FILE_UPLOAD_KEYWORDS = [
  'video intro', 'video introduction', 'loom video', 'video application',
  'voice recording', 'audio recording', 'portfolio upload', 'upload portfolio',
  'video demo', 'demo reel', 'showreel', 'video reel', 'screen recording',
  'video submission', 'submit a video', 'record a video',
];

const CV_KEYWORDS = [
  'resume', 'cv', 'curriculum vitae', 'attach your cv', 'send your resume',
  'portfolio', 'work samples',
];

const PLATFORM_REDIRECT_PATTERNS: Record<string, RegExp> = {
  'Indeed':     /apply.*indeed|indeed.*apply|via indeed/i,
  'Upwork':     /apply.*upwork|upwork.*apply|continue on upwork/i,
  'Freelancer': /freelancer\.com|apply.*freelancer/i,
  'Email':      /email.*application|apply.*email|send.*email.*to apply/i,
  'Typeform':   /typeform|google form|application form/i,
  'External':   /apply (at|on|via) our website|apply through our/i,
};

const SKILL_KEYWORDS = [
  'react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt',
  'javascript', 'typescript', 'node.js', 'express', 'fastapi', 'django', 'flask',
  'python', 'php', 'ruby', 'go', 'rust',
  'mysql', 'postgresql', 'mongodb', 'redis', 'supabase', 'firebase',
  'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'vercel', 'netlify',
  'wordpress', 'shopify', 'woocommerce',
  'figma', 'photoshop', 'canva',
  'n8n', 'zapier', 'make', 'airtable', 'pipedream',
  'openai', 'anthropic', 'claude', 'llm', 'machine learning', 'langchain',
  'vapi', 'elevenlabs', 'twilio', 'retell', 'bland ai', 'ai voice',
  'playwright', 'selenium', 'scraping', 'beautifulsoup',
  'celery', 'airflow', 'dbt', 'spark',
  'seo', 'google ads', 'facebook ads',
  'notion', 'asana', 'jira', 'hubspot', 'salesforce',
  'excel', 'google sheets', 'sql',
];

// ─── Local (regex) analyzer ────────────────────────────────────────────────────

export function analyzeJobLocally(job: RawJob): JobAnalysis {
  const fullText = `${job.title ?? ''} ${job.description ?? ''}`.toLowerCase();

  const requires_file_upload = FILE_UPLOAD_KEYWORDS.some(kw => fullText.includes(kw));
  const required_files = FILE_UPLOAD_KEYWORDS
    .filter(kw => fullText.includes(kw))
    .map(kw => kw.charAt(0).toUpperCase() + kw.slice(1));

  const requires_cv = CV_KEYWORDS.some(kw => fullText.includes(kw));

  let platform_redirect = false;
  let redirect_platform = '';
  for (const [platform, pattern] of Object.entries(PLATFORM_REDIRECT_PATTERNS)) {
    if (pattern.test(fullText)) {
      platform_redirect = true;
      redirect_platform = platform;
      break;
    }
  }

  const skills = SKILL_KEYWORDS.filter(kw => fullText.includes(kw));

  const titleWords = (job.title ?? '')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .map(w => w.replace(/[^a-zA-Z0-9.+#]/g, ''))
    .filter(Boolean);
  const keywords = [...new Set([...skills.slice(0, 5), ...titleWords.slice(0, 5)])].slice(0, 10);

  return {
    title: job.title ?? '',
    platform_redirect,
    redirect_platform,
    requires_file_upload,
    required_files,
    requires_cv,
    skills,
    keywords,
  };
}

// ─── OpenRouter AI analyzer ────────────────────────────────────────────────────

async function analyzeJobWithAI(job: RawJob, apiKey: string): Promise<JobAnalysis> {
  const prompt = `Analyze this LinkedIn job listing and return ONLY a valid JSON object. No explanation, just JSON.

Job Title: ${job.title}
Company: ${job.companyName ?? 'Unknown'}
Description: ${(job.description ?? '').slice(0, 800)}

Return exactly this JSON structure:
{
  "title": "${job.title}",
  "platform_redirect": false,
  "redirect_platform": "",
  "requires_file_upload": false,
  "required_files": [],
  "requires_cv": false,
  "skills": [],
  "keywords": []
}

Rules:
- platform_redirect: true if job asks to apply on an external website, Typeform, or via email
- redirect_platform: the platform name if platform_redirect is true, otherwise empty string
- requires_file_upload: true ONLY if job explicitly requires video intro, Loom recording, audio recording, or screen recording
- required_files: list what files are required if requires_file_upload is true
- requires_cv: true if job mentions resume, CV, or curriculum vitae
- skills: array of technical/professional skills mentioned (n8n, Python, Supabase, Vapi, React, SQL, etc.)
- keywords: 5-8 most important keywords from the job listing`;

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://linkediq.vercel.app',
      'X-Title': 'LinkedIQ',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 400,
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? '';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in AI response');

  return JSON.parse(jsonMatch[0]) as JobAnalysis;
}

// ─── Score calculator ──────────────────────────────────────────────────────────

export function scoreJob(job: RawJob, analysis: JobAnalysis, keyword: string): number {
  let score = 50;

  const kw = keyword.toLowerCase();
  if ((job.title ?? '').toLowerCase().includes(kw)) score += 18;
  if ((job.description ?? '').toLowerCase().includes(kw)) score += 7;

  if (job.workType === 'Remote') score += 10;
  else if (job.workType === 'Hybrid') score += 5;

  if (job.salary?.includes('$')) score += 8;

  score += Math.min(analysis.skills.length * 2, 12);

  if (!analysis.platform_redirect)   score += 5;
  if (!analysis.requires_cv)         score += 3;
  if (!analysis.requires_file_upload) score += 5;

  if (job.datePosted) {
    const diffH = (Date.now() - new Date(job.datePosted).getTime()) / 3_600_000;
    if (diffH <= 24)  score += 8;
    else if (diffH <= 168) score += 4;
  }

  return Math.min(100, Math.round(score));
}

// ─── Main batch analyzer ───────────────────────────────────────────────────────

export async function analyzeJobs(
  jobs: RawJob[],
  keyword: string,
  openRouterKey?: string
): Promise<AnalyzedJob[]> {
  const results: AnalyzedJob[] = [];

  for (const job of jobs) {
    let analysis: JobAnalysis;

    try {
      if (openRouterKey) {
        analysis = await analyzeJobWithAI(job, openRouterKey);
        await new Promise(r => setTimeout(r, 200));
      } else {
        analysis = analyzeJobLocally(job);
      }
    } catch {
      analysis = analyzeJobLocally(job);
    }

    const score = scoreJob(job, analysis, keyword);
    results.push({ ...job, analysis, score });
  }

  return results;
}

// ─── Application message generator ───────────────────────────────────────────

export async function generateApplicationMessage(
  jobs: AnalyzedJob[],
  openRouterKey?: string
): Promise<string> {
  const hasCV       = jobs.some(j => j.analysis.requires_cv);
  const hasPlatform = jobs.some(j => j.analysis.platform_redirect);
  const allSkills   = [...new Set(jobs.flatMap(j => j.analysis.skills))].slice(0, 8);
  const topKeywords = [...new Set(jobs.flatMap(j => j.analysis.keywords))].slice(0, 6);

  if (openRouterKey) {
    const prompt = `Write a professional, human-sounding job application message for remote positions on LinkedIn.

Skills to highlight: ${allSkills.join(', ')}
Keywords from job listings: ${topKeywords.join(', ')}
${hasCV ? '- Include: "I have attached my CV/resume for your review."' : ''}
${hasPlatform ? '- Include: "I am open to continuing the application process on your preferred platform."' : ''}

Structure:
1. Brief, engaging introduction (2 sentences)
2. Core skills and what I bring (3-4 sentences, mention the specific skills above)
3. ${hasCV ? 'CV mention' : 'Enthusiasm to discuss further'}
4. ${hasPlatform ? 'Platform flexibility line' : ''}
5. Professional closing

Tone: Professional, confident, human — NOT robotic or generic. Write in first person. Under 200 words.`;

    try {
      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://linkediq.vercel.app',
          'X-Title': 'LinkedIQ',
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 400,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const msg = data.choices?.[0]?.message?.content?.trim();
        if (msg && msg.length > 50) return msg;
      }
    } catch {
      // fall through to template
    }
  }

  // Template fallback
  const skillsText = allSkills.length > 0
    ? `I specialize in ${allSkills.slice(0, 4).join(', ')}, with hands-on experience delivering results in these areas.`
    : 'I bring a strong background in automation, AI integration, and remote collaboration.';

  return `Hello,

I came across your posting on LinkedIn and I am genuinely excited about this opportunity. Your role aligns closely with my background, and I believe I can add real value to your team from day one.

${skillsText} I thrive working independently, hitting deadlines, and adapting quickly to new tools. My experience in remote-first environments has made me highly responsive and proactive.
${hasCV ? '\nI have attached my CV/resume for your review.' : ''}${hasPlatform ? '\nI am happy to continue the application process on your preferred platform.' : ''}

I would love the chance to discuss how I can contribute. Thank you for considering my application!

Best regards`.trim();
}
