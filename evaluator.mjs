const OPENROUTER_URL   = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "meta-llama/llama-3.1-8b-instruct:free";

const SYSTEM_PROMPT = `You are a ruthless job filter for a freelance automation & AI developer.

TARGET SKILLS — only these four matter:
1. n8n  (workflow automation, n8n nodes, self-hosted n8n)
2. Python  (scripting, automation, data pipelines, FastAPI, etc.)
3. Supabase  (PostgreSQL, Supabase Auth, Realtime, Edge Functions)
4. AI Voice  (ElevenLabs, Vapi, Twilio AI, Bland AI, Retell, voice agents, TTS/STT pipelines)

Return ONLY a raw JSON object — no markdown fences, no extra text.

JSON schema (all fields required):
{
  "is_legit": boolean,
  "should_apply": boolean,
  "has_external_redirect_or_video": boolean,
  "matched_skills": string[],
  "reason": string
}`;

/**
 * Evaluate a single job description using OpenRouter.
 * @param {string} text  Raw job description text (capped at 4000 chars)
 */
export async function evaluateJob(text) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set in .env");

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://linkediq.vercel.app",
      "X-Title": "LinkedIQ",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: `Evaluate this job posting:\n\n${text.slice(0, 4000)}` },
      ],
      temperature: 0.1,
      max_tokens: 300,
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);

  const data = await res.json();
  const raw  = data.choices?.[0]?.message?.content?.trim() ?? "";

  // Strip accidental markdown fences
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in response");

  return JSON.parse(jsonMatch[0]);
}
