import type { RawJob } from '@/types';

// ─── Realistic LinkedIn-style mock jobs ────────────────────────────────────────
// Focused on the target skills: n8n, Python, Supabase, AI Voice

const MOCK_POOL: Omit<RawJob, 'id' | 'query'>[] = [
  {
    title: 'n8n Automation Engineer',
    companyName: 'FlowStack AI',
    location: 'Remote',
    workType: 'Remote',
    employmentType: 'Contract',
    salary: '$40–$60/hr',
    description: 'We are looking for an experienced n8n developer to build and maintain automation workflows for our SaaS platform. You will integrate n8n with Slack, HubSpot, Postgres, and various REST APIs. Strong knowledge of JavaScript in code nodes, error handling, and webhook-based triggers required. Familiarity with self-hosted n8n on Docker is a plus.',
    datePosted: new Date(Date.now() - 2 * 86400000).toISOString(),
    url: 'https://www.linkedin.com/jobs/view/mock-001',
  },
  {
    title: 'Python Backend Developer (AI/Automation)',
    companyName: 'Ignite Labs',
    location: 'United States',
    workType: 'Remote',
    employmentType: 'Full-time',
    salary: '$90,000–$120,000/yr',
    description: 'Join our fast-growing team to build Python microservices that power our AI automation products. You will work with FastAPI, Celery, PostgreSQL, and integrate with OpenAI and Claude APIs. Experience with async Python, Docker, and writing clean, testable code is required. Bonus: experience with n8n or workflow automation tools.',
    datePosted: new Date(Date.now() - 1 * 86400000).toISOString(),
    url: 'https://www.linkedin.com/jobs/view/mock-002',
  },
  {
    title: 'Supabase Full-Stack Developer',
    companyName: 'Buildfast',
    location: 'Remote — Worldwide',
    workType: 'Remote',
    employmentType: 'Contract',
    salary: '$50–$75/hr',
    description: 'We need a skilled developer to architect and build features using Supabase as the backend. Tasks include designing PostgreSQL schemas, writing Edge Functions (TypeScript/Deno), configuring Row Level Security, setting up Realtime subscriptions, and integrating Supabase Auth with third-party OAuth providers. Must have shipped at least one production Supabase project.',
    datePosted: new Date(Date.now() - 3 * 86400000).toISOString(),
    url: 'https://www.linkedin.com/jobs/view/mock-003',
  },
  {
    title: 'AI Voice Agent Developer',
    companyName: 'VoiceFlow Systems',
    location: 'Remote',
    workType: 'Remote',
    employmentType: 'Contract',
    salary: '$60–$80/hr',
    description: 'Build intelligent AI voice agents using Vapi and ElevenLabs. You will design conversation flows, integrate with CRM systems via API calls and n8n workflows, handle speech-to-text and text-to-speech pipelines, and improve agent performance. Experience with Vapi.ai, Bland AI, or Retell is required. Python scripting for backend webhook handling is a plus.',
    datePosted: new Date(Date.now() - 1 * 86400000).toISOString(),
    url: 'https://www.linkedin.com/jobs/view/mock-004',
  },
  {
    title: 'Workflow Automation Specialist (n8n / Make)',
    companyName: 'Operata',
    location: 'Remote — Philippines friendly',
    workType: 'Remote',
    employmentType: 'Part-time',
    salary: '$20–$35/hr',
    description: 'We need someone to own our automation stack — primarily n8n and Make (Integromat). You will build workflows connecting our tools: Notion, Airtable, Stripe, Gmail, and Slack. Ability to write small Python scripts to handle edge cases is a big plus. No Loom or video intro required — just show us a project you built.',
    datePosted: new Date(Date.now() - 4 * 86400000).toISOString(),
    url: 'https://www.linkedin.com/jobs/view/mock-005',
  },
  {
    title: 'AI Integration Developer',
    companyName: 'NeuralBridge',
    location: 'Remote',
    workType: 'Remote',
    employmentType: 'Full-time',
    salary: '$80,000–$110,000/yr',
    description: 'Help us build LLM-powered features into our product. Tech stack: Python, FastAPI, Supabase, and the Anthropic/OpenAI SDKs. You will build RAG pipelines, structured output parsers, and tool-use chains. Experience with pgvector in Supabase, LangChain or similar frameworks, and production LLM deployments required.',
    datePosted: new Date(Date.now() - 2 * 86400000).toISOString(),
    url: 'https://www.linkedin.com/jobs/view/mock-006',
  },
  {
    title: 'Conversational AI & Telephony Developer',
    companyName: 'CallSmart',
    location: 'Remote',
    workType: 'Remote',
    employmentType: 'Contract',
    salary: '$55–$70/hr',
    description: 'We are building an AI phone agent system using Twilio, Vapi, and ElevenLabs. Looking for a developer who can handle the full stack: voice pipeline setup, LLM integration, webhook handlers (Python/FastAPI), and CRM sync via n8n. Must be comfortable debugging audio quality, latency, and transcription accuracy issues.',
    datePosted: new Date(Date.now() - 5 * 86400000).toISOString(),
    url: 'https://www.linkedin.com/jobs/view/mock-007',
  },
  {
    title: 'Data Engineer — Python & Supabase',
    companyName: 'Metricore',
    location: 'Hybrid — Austin, TX',
    workType: 'Hybrid',
    employmentType: 'Full-time',
    salary: '$100,000–$130,000/yr',
    description: 'Build and maintain our data pipelines using Python, Airflow, and Supabase as the analytics backend. You will write ETL scripts, design efficient Postgres schemas with proper indexing, and build internal dashboards with PostgREST APIs. Experience with Supabase Edge Functions and Realtime is a strong plus.',
    datePosted: new Date(Date.now() - 6 * 86400000).toISOString(),
    url: 'https://www.linkedin.com/jobs/view/mock-008',
  },
  {
    title: 'Marketing Automation Specialist',
    companyName: 'GrowthEngine',
    location: 'Remote',
    workType: 'Remote',
    employmentType: 'Full-time',
    salary: '$50,000–$70,000/yr',
    description: 'We are looking for a marketing automation specialist to manage our HubSpot, Mailchimp, and social media workflows. Must have experience with email sequences, A/B testing, and CRM management. Please send a video introduction via Loom to apply. No prior automation engineering experience required.',
    datePosted: new Date(Date.now() - 1 * 86400000).toISOString(),
    url: 'https://www.linkedin.com/jobs/view/mock-009',
  },
  {
    title: 'No-Code / Low-Code Developer (Zapier, Make)',
    companyName: 'QuickFlows Inc.',
    location: 'Remote',
    workType: 'Remote',
    employmentType: 'Contract',
    salary: '$15–$25/hr',
    description: 'Looking for a no-code developer to build automations using Zapier and Make. Nice to have: basic familiarity with n8n. Mostly connecting apps: Gmail, Google Sheets, Stripe, Notion. No coding required — just solid understanding of trigger/action logic. Apply via our Typeform at the link below.',
    datePosted: new Date(Date.now() - 3 * 86400000).toISOString(),
    url: 'https://www.linkedin.com/jobs/view/mock-010',
  },
  {
    title: 'Python Scraping & Automation Engineer',
    companyName: 'DataHarvest',
    location: 'Remote',
    workType: 'Remote',
    employmentType: 'Contract',
    salary: '$35–$50/hr',
    description: 'Build web scrapers and data pipelines using Python (Playwright, BeautifulSoup, Scrapy). You will automate data collection from websites, clean and transform data, and store results in a Supabase Postgres database. Familiarity with rotating proxies, anti-bot evasion techniques, and scheduling via cron or n8n workflows is valued.',
    datePosted: new Date(Date.now() - 2 * 86400000).toISOString(),
    url: 'https://www.linkedin.com/jobs/view/mock-011',
  },
  {
    title: 'Voice AI Product Developer (Startup)',
    companyName: 'Aria Labs',
    location: 'Remote',
    workType: 'Remote',
    employmentType: 'Full-time',
    salary: '$85,000–$115,000/yr',
    description: 'We are building next-gen AI voice assistants and need a full-stack developer to join the founding team. You will work with ElevenLabs for voice synthesis, Vapi or Retell for conversation management, and Python backends to handle complex dialogue flows. Supabase for user data and session storage. Equity offered.',
    datePosted: new Date(Date.now() - 1 * 86400000).toISOString(),
    url: 'https://www.linkedin.com/jobs/view/mock-012',
  },
];

/**
 * Generate mock LinkedIn-style jobs, optionally filtered by keyword.
 */
export function generateMockJobs(keyword: string, limit: number): RawJob[] {
  const kw = keyword.toLowerCase();

  // Score mock jobs by how well they match the keyword
  const scored = MOCK_POOL.map(j => {
    const text = `${j.title} ${j.description}`.toLowerCase();
    const score = (text.match(new RegExp(kw, 'g')) ?? []).length;
    return { job: j, score };
  });

  // Sort by relevance, then take what we need (cycle if not enough)
  scored.sort((a, b) => b.score - a.score);

  const results: RawJob[] = [];
  for (let i = 0; results.length < limit; i++) {
    const { job } = scored[i % scored.length];
    results.push({
      ...job,
      id: `mock-${i}-${Date.now()}`,
      query: keyword,
    });
  }

  return results.slice(0, limit);
}
