// ─── POST /api/personalize ────────────────────────────────────────────────────
// Takes a single job + the shared base message and returns a version
// personalized specifically for that listing via OpenRouter.

import { NextRequest, NextResponse } from 'next/server';
import type { AnalyzedJob } from '@/types';

const OPENROUTER_URL   = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'meta-llama/llama-3.1-8b-instruct:free';

async function personalizeWithAI(
  job: AnalyzedJob,
  baseMessage: string,
  apiKey: string
): Promise<string> {
  const prompt = `You are helping someone apply for a remote job on LinkedIn.

Here is their base application message:
"""
${baseMessage}
"""

Personalize it specifically for this job posting:
- Job Title: ${job.title}
- Company: ${job.companyName ?? 'Unknown'}
- Location/Type: ${job.workType ?? ''} ${job.location ?? ''}
- Skills required: ${job.analysis.skills.join(', ') || 'Not listed'}
- Description: ${(job.description ?? '').slice(0, 600)}
${job.analysis.requires_cv ? '- This job requires a CV/resume attachment.' : ''}
${job.analysis.platform_redirect ? `- This job asks to apply via ${job.analysis.redirect_platform}.` : ''}

Rules:
- Keep the same professional, human tone
- Reference the specific job title and 1-2 skills from the listing naturally
- Mention the company name once if available
- Keep it under 180 words
- Do NOT add a subject line or "Dear Hiring Manager" header — start directly with the opening sentence
- Return ONLY the message text, nothing else`;

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
      temperature: 0.65,
      max_tokens: 350,
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);

  const data = await res.json();
  const msg = data.choices?.[0]?.message?.content?.trim();
  if (!msg || msg.length < 30) throw new Error('Empty AI response');
  return msg;
}

function personalizeLocally(job: AnalyzedJob, baseMessage: string): string {
  const title   = job.title ?? 'this position';
  const company = job.companyName;
  const skills  = job.analysis.skills.slice(0, 3);

  const opener = company
    ? `I came across ${company}'s posting for a ${title} on LinkedIn and I am genuinely excited to apply.`
    : `I came across your posting for a ${title} on LinkedIn and I am genuinely excited to apply.`;

  const skillLine = skills.length > 0
    ? `My background in ${skills.join(', ')} directly aligns with what you are looking for.`
    : '';

  const lines = baseMessage.split('\n').filter(Boolean);
  lines[0] = opener;
  if (skillLine && lines.length > 1) lines.splice(1, 0, skillLine);

  return lines.join('\n\n');
}

export async function POST(req: NextRequest) {
  try {
    const { job, baseMessage }: { job: AnalyzedJob; baseMessage: string } = await req.json();

    if (!job || !baseMessage) {
      return NextResponse.json({ error: 'job and baseMessage are required' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    let message: string;

    if (apiKey) {
      try {
        message = await personalizeWithAI(job, baseMessage, apiKey);
      } catch {
        message = personalizeLocally(job, baseMessage);
      }
    } else {
      message = personalizeLocally(job, baseMessage);
    }

    return NextResponse.json({ message });
  } catch (err) {
    console.error('[/api/personalize]', err);
    return NextResponse.json(
      { error: (err as Error).message ?? 'Failed to personalize' },
      { status: 500 }
    );
  }
}
