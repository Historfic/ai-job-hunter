'use client';

import { useState } from 'react';
import type { AnalyzedJob } from '@/types';

interface Props {
  job: AnalyzedJob;
  highlight?: boolean;
  baseMessage?: string;
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-yellow-400';
  return 'text-gray-500';
}

function scoreBarColor(score: number) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-gray-600';
}

function relativeDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const diffH = (Date.now() - d.getTime()) / 3_600_000;
  if (diffH < 1)  return 'Just posted';
  if (diffH < 24) return `${Math.floor(diffH)}h ago`;
  const days = Math.floor(diffH / 24);
  if (days === 1) return 'Yesterday';
  if (days < 30)  return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const WORK_TYPE_STYLE: Record<string, string> = {
  Remote:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Hybrid:   'bg-yellow-500/10  text-yellow-400  border-yellow-500/20',
  'On-site':'bg-gray-500/10   text-gray-400    border-gray-600/20',
};

export default function JobCard({ job, highlight, baseMessage }: Props) {
  const [expanded, setExpanded]           = useState(false);
  const [showPersonal, setShowPersonal]   = useState(false);
  const [personalMsg, setPersonalMsg]     = useState('');
  const [personalLoading, setPersonalLoading] = useState(false);
  const [personalError, setPersonalError] = useState('');
  const [personalCopied, setPersonalCopied]   = useState(false);

  const { analysis } = job;

  async function handlePersonalize() {
    if (showPersonal && personalMsg) { setShowPersonal(false); return; }
    setShowPersonal(true);
    if (personalMsg) return;

    setPersonalLoading(true);
    setPersonalError('');
    try {
      const res = await fetch('/api/personalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job, baseMessage: baseMessage ?? '' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setPersonalMsg(data.message);
    } catch (err) {
      setPersonalError((err as Error).message);
    } finally {
      setPersonalLoading(false);
    }
  }

  async function handleCopyPersonal() {
    await navigator.clipboard.writeText(personalMsg);
    setPersonalCopied(true);
    setTimeout(() => setPersonalCopied(false), 2000);
  }

  return (
    <div className={`rounded-xl border transition-all group
      ${highlight
        ? 'bg-yellow-500/5 border-yellow-500/20 hover:border-yellow-500/40'
        : 'bg-gray-900 border-gray-800 hover:border-gray-700'
      }`}
    >
      <div className="p-4">
        {/* Top row: title + score */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {highlight && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-400 font-medium">
                  ⭐ Top Match
                </span>
              )}
              <h3 className="text-sm font-semibold text-white truncate leading-tight">
                {job.title ?? 'Untitled Position'}
              </h3>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-gray-400">{job.companyName ?? 'Unknown Company'}</span>
              {job.location && (
                <span className="text-xs text-gray-600 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {job.location}
                </span>
              )}
              {job.datePosted && (
                <span className="text-[10px] text-gray-600">{relativeDate(job.datePosted)}</span>
              )}
            </div>
          </div>

          {/* Score */}
          <div className="flex flex-col items-end shrink-0">
            <span className={`text-base font-bold ${scoreColor(job.score)}`}>{job.score}</span>
            <span className="text-[9px] text-gray-600 uppercase tracking-wider">score</span>
          </div>
        </div>

        {/* Score bar */}
        <div className="w-full h-1 bg-gray-800 rounded-full mb-3">
          <div className={`h-full rounded-full transition-all ${scoreBarColor(job.score)}`} style={{ width: `${job.score}%` }} />
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {job.workType && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] border font-medium ${WORK_TYPE_STYLE[job.workType] ?? 'bg-gray-700/10 text-gray-400 border-gray-700/20'}`}>
              {job.workType}
            </span>
          )}
          {job.employmentType && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-800 text-gray-400 border border-gray-700">
              {job.employmentType}
            </span>
          )}
          {job.salary && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium text-emerald-400">{job.salary}</span>
            </div>
          )}
          {analysis.requires_cv && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
              📄 CV Required
            </span>
          )}
          {analysis.platform_redirect && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20">
              ↗ {analysis.redirect_platform || 'External'}
            </span>
          )}
        </div>

        {/* Skill pills */}
        {analysis.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {analysis.skills.slice(0, 6).map(s => (
              <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-gray-800 text-gray-400 border border-gray-700">
                {s}
              </span>
            ))}
            {analysis.skills.length > 6 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] text-gray-600">
                +{analysis.skills.length - 6} more
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {job.description && (
          <p className={`text-xs text-gray-500 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
            {job.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 gap-2">
          {job.description && job.description.length > 120 && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors shrink-0"
            >
              {expanded ? 'Show less ↑' : 'Show more ↓'}
            </button>
          )}
          <div className="flex-1" />

          {/* Personalize button */}
          <button
            onClick={handlePersonalize}
            disabled={personalLoading}
            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors
              ${showPersonal && personalMsg
                ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-600/25 hover:bg-emerald-600/25'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {personalLoading ? (
              <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            )}
            {personalLoading ? 'Writing...' : showPersonal && personalMsg ? 'Hide message' : 'Personalize'}
          </button>

          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors font-medium shrink-0"
            >
              View Job
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>

        {/* Personalized message panel */}
        {showPersonal && (
          <div className="mt-3 border-t border-gray-800 pt-3 animate-slide-up">
            {personalLoading && (
              <div className="flex items-center gap-2 py-2 text-xs text-gray-500">
                <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                Personalizing message for this job...
              </div>
            )}
            {personalError && <p className="text-xs text-red-400 py-1">{personalError}</p>}
            {personalMsg && !personalLoading && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
                    ✍️ Personalized for this job
                  </span>
                  <button
                    onClick={handleCopyPersonal}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors
                      ${personalCopied ? 'bg-emerald-600/20 text-emerald-400' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                  >
                    {personalCopied ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-line bg-gray-950 rounded-lg p-3 border border-gray-800">
                  {personalMsg}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
