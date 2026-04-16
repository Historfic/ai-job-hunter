'use client';

import type { ProcessResult, ScrapeOptions } from '@/types';

interface Props {
  result: ProcessResult;
  options: ScrapeOptions;
  onSend: () => void;
  sending: boolean;
  sent: boolean;
}

const TO_EMAIL = 'raffymcfee@gmail.com';

export default function EmailPreview({ result, options, onSend, sending, sent }: Props) {
  const { validJobs, topSkills, suggestedKeywords, applicationMessage, stats, removedJobs } = result;
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-4 animate-slide-up max-w-2xl">

      {/* Send button */}
      <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${sent ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-gray-900 border-gray-800'}`}>
        <div>
          <p className="text-sm font-semibold text-white">{sent ? '✅ Email sent successfully!' : 'Send Job Digest Email'}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {sent
              ? `Delivered to ${TO_EMAIL}`
              : `Will send to ${TO_EMAIL} · ${validJobs.length} job${validJobs.length !== 1 ? 's' : ''} + AI insights`
            }
          </p>
        </div>
        {!sent && (
          <button
            onClick={onSend}
            disabled={sending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl text-sm font-medium transition-colors"
          >
            {sending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Send Email
              </>
            )}
          </button>
        )}
      </div>

      {/* Email preview */}
      <div className="bg-white rounded-xl overflow-hidden shadow-2xl border border-gray-700">
        <div className="bg-[#1d4ed8] px-6 py-5">
          <h1 className="text-lg font-bold text-white">LinkedIQ Job Digest</h1>
          <p className="text-blue-200 text-xs mt-1">
            {date} · &ldquo;{options.keyword}&rdquo;{options.location ? ` · ${options.location}` : ''}
          </p>
        </div>

        <div className="bg-blue-50 px-6 py-4 flex gap-6 border-b border-blue-100">
          {[
            { label: 'Valid Jobs',    value: validJobs.length,    color: 'text-blue-700'   },
            { label: 'Removed',       value: removedJobs.length,  color: 'text-red-600'    },
            { label: 'Total Scraped', value: stats.totalScraped,  color: 'text-gray-700'   },
            { label: 'Passes',        value: stats.scrapePasses,  color: 'text-purple-700' },
          ].map(s => (
            <div key={s.label}>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">🧠 Top Skills In Demand</h2>
            <div className="flex flex-wrap gap-1.5">
              {topSkills.map(s => <span key={s} className="px-2.5 py-1 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">{s}</span>)}
            </div>
          </div>

          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">🔍 Suggested Keywords</h2>
            <div className="flex flex-wrap gap-1.5">
              {suggestedKeywords.map(k => <span key={k} className="px-2.5 py-1 rounded-full text-xs bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">{k}</span>)}
            </div>
          </div>

          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-3">📋 Valid Jobs ({validJobs.length})</h2>
            <div className="divide-y divide-gray-100 rounded-lg border border-gray-100 overflow-hidden">
              {validJobs.slice(0, 8).map((job, i) => (
                <div key={job.id} className={`flex items-start justify-between px-4 py-3 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-xs font-semibold text-gray-900 truncate">{job.title}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{job.companyName} · {job.workType ?? job.employmentType}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-emerald-600">{job.salary ?? 'N/A'}</p>
                    <p className="text-[10px] text-blue-500">Score: {job.score}</p>
                  </div>
                </div>
              ))}
              {validJobs.length > 8 && (
                <div className="px-4 py-2 bg-gray-50 text-center text-xs text-gray-400">
                  + {validJobs.length - 8} more jobs in full email
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">✍️ Application Message</h2>
            <div className="bg-gray-50 rounded-lg border border-gray-100 p-4">
              <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line line-clamp-6">{applicationMessage}</p>
            </div>
          </div>

          {removedJobs.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-red-400 mb-2">🗑 Removed ({removedJobs.length})</h2>
              <div className="space-y-1">
                {removedJobs.slice(0, 5).map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-red-400">✗</span>
                    <span className="text-gray-500 font-medium">{r.job.title}</span>
                    <span className="text-gray-400">— {r.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-100 px-6 py-3 text-center">
          <p className="text-[10px] text-gray-400">Sent by LinkedIQ · AI-Powered LinkedIn Job Hunter</p>
        </div>
      </div>

      <p className="text-[10px] text-gray-700 text-center">
        Set SMTP_USER + SMTP_PASS in .env for real delivery. Currently simulated.
      </p>
    </div>
  );
}
