// ─── POST /api/send-email ─────────────────────────────────────────────────────
// Sends a job digest email to the configured recipient.
// Real send when SMTP_USER + SMTP_PASS are set; simulated otherwise.

import { NextRequest, NextResponse } from 'next/server';
import type { ProcessResult, ScrapeOptions } from '@/types';

const TO_EMAIL = process.env.TO_EMAIL || 'raffymcfee@gmail.com';

function buildEmailHtml(result: ProcessResult, options: ScrapeOptions): string {
  const { validJobs, topSkills, suggestedKeywords, applicationMessage, stats, removedJobs } = result;
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const jobRows = validJobs.map(j => `
    <tr style="border-bottom:1px solid #e5e7eb;">
      <td style="padding:10px 8px;font-size:13px;font-weight:600;color:#111827;">${j.title ?? '—'}</td>
      <td style="padding:10px 8px;font-size:12px;color:#6b7280;">${j.companyName ?? '—'}</td>
      <td style="padding:10px 8px;font-size:12px;color:#6b7280;">${j.location ?? '—'}</td>
      <td style="padding:10px 8px;font-size:12px;color:#059669;font-weight:500;">${j.workType ?? '—'}</td>
      <td style="padding:10px 8px;font-size:12px;">
        <a href="${j.url ?? '#'}" style="color:#2563eb;text-decoration:none;">View →</a>
      </td>
      <td style="padding:10px 8px;font-size:11px;color:#9ca3af;">${j.score ?? 0}/100</td>
    </tr>
  `).join('');

  const removedRows = removedJobs.slice(0, 10).map(r => `
    <tr>
      <td style="padding:6px 8px;font-size:12px;color:#374151;">${r.job.title ?? '—'}</td>
      <td style="padding:6px 8px;font-size:12px;color:#ef4444;">${r.reason}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:680px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <div style="background:#1d4ed8;padding:28px 32px;">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">LinkedIQ Job Digest</h1>
      <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">${date} · "${options.keyword}"${options.location ? ` · ${options.location}` : ''}</p>
    </div>
    <div style="background:#eff6ff;padding:16px 32px;display:flex;gap:24px;border-bottom:1px solid #e0e7ff;">
      <div><span style="font-size:22px;font-weight:700;color:#1d4ed8;">${validJobs.length}</span><br><span style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;">Valid</span></div>
      <div><span style="font-size:22px;font-weight:700;color:#dc2626;">${removedJobs.length}</span><br><span style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;">Removed</span></div>
      <div><span style="font-size:22px;font-weight:700;color:#059669;">${stats.totalScraped}</span><br><span style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;">Scraped</span></div>
    </div>
    <div style="padding:28px 32px;">
      <h2 style="font-size:14px;font-weight:700;color:#111827;margin:0 0 10px;text-transform:uppercase;letter-spacing:.08em;">🧠 Top Skills In Demand</h2>
      <div style="margin-bottom:24px;">${topSkills.map(s => `<span style="display:inline-block;background:#dbeafe;color:#1d4ed8;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:500;margin:3px 4px 3px 0;">${s}</span>`).join('')}</div>
      <h2 style="font-size:14px;font-weight:700;color:#111827;margin:0 0 10px;text-transform:uppercase;letter-spacing:.08em;">🔍 Suggested Keywords</h2>
      <div style="margin-bottom:24px;">${suggestedKeywords.map(k => `<span style="display:inline-block;background:#f0fdf4;color:#059669;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:500;margin:3px 4px 3px 0;">${k}</span>`).join('')}</div>
      <h2 style="font-size:14px;font-weight:700;color:#111827;margin:0 0 12px;text-transform:uppercase;letter-spacing:.08em;">📋 Job Listings (${validJobs.length})</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
        <thead><tr style="background:#f3f4f6;">
          <th style="padding:8px;text-align:left;font-size:11px;color:#6b7280;">Title</th>
          <th style="padding:8px;text-align:left;font-size:11px;color:#6b7280;">Company</th>
          <th style="padding:8px;text-align:left;font-size:11px;color:#6b7280;">Location</th>
          <th style="padding:8px;text-align:left;font-size:11px;color:#6b7280;">Work Type</th>
          <th style="padding:8px;text-align:left;font-size:11px;color:#6b7280;">Link</th>
          <th style="padding:8px;text-align:left;font-size:11px;color:#6b7280;">Score</th>
        </tr></thead>
        <tbody>${jobRows}</tbody>
      </table>
      <h2 style="font-size:14px;font-weight:700;color:#111827;margin:0 0 12px;text-transform:uppercase;letter-spacing:.08em;">✍️ Application Message</h2>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;font-size:13px;line-height:1.7;color:#374151;white-space:pre-line;margin-bottom:24px;">${applicationMessage}</div>
      ${removedJobs.length > 0 ? `<details><summary style="font-size:13px;color:#9ca3af;cursor:pointer;margin-bottom:8px;">🗑 Removed Jobs (${removedJobs.length})</summary><table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#fef2f2;"><th style="padding:6px 8px;text-align:left;font-size:11px;color:#6b7280;">Title</th><th style="padding:6px 8px;text-align:left;font-size:11px;color:#6b7280;">Reason</th></tr></thead><tbody>${removedRows}</tbody></table></details>` : ''}
    </div>
    <div style="background:#f3f4f6;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">Sent by LinkedIQ · AI-Powered LinkedIn Job Hunter</p>
    </div>
  </div>
</body></html>`;
}

export async function POST(req: NextRequest) {
  try {
    const { result, options }: { result: ProcessResult; options: ScrapeOptions } = await req.json();
    if (!result?.validJobs) return NextResponse.json({ error: 'No result data' }, { status: 400 });

    const htmlBody = buildEmailHtml(result, options);
    const subject  = `[LinkedIQ] ${result.validJobs.length} jobs found for "${options.keyword}" · ${new Date().toLocaleDateString()}`;

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT ?? '587', 10),
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({
        from: `"LinkedIQ" <${process.env.SMTP_USER}>`,
        to: TO_EMAIL,
        subject,
        html: htmlBody,
      });
    } else {
      await new Promise(r => setTimeout(r, 800)); // simulate
    }

    return NextResponse.json({
      success: true,
      to: TO_EMAIL,
      subject,
      simulated: !(process.env.SMTP_USER && process.env.SMTP_PASS),
    });
  } catch (err) {
    console.error('[/api/send-email]', err);
    return NextResponse.json({ error: (err as Error).message ?? 'Failed' }, { status: 500 });
  }
}
