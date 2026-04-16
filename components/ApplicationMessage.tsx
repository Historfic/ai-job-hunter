'use client';

import { useState } from 'react';
import type { AnalyzedJob } from '@/types';

interface Props {
  message: string;
  jobs: AnalyzedJob[];
}

export default function ApplicationMessage({ message, jobs }: Props) {
  const [copied, setCopied]               = useState(false);
  const [editedMessage, setEditedMessage] = useState(message);
  const [editing, setEditing]             = useState(false);

  const cvJobs       = jobs.filter(j => j.analysis.requires_cv);
  const redirectJobs = jobs.filter(j => j.analysis.platform_redirect);
  const allSkills    = [...new Set(jobs.flatMap(j => j.analysis.skills))].slice(0, 8);

  async function handleCopy() {
    await navigator.clipboard.writeText(editedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4 animate-slide-up max-w-2xl">

      {/* Context flags */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Message Context</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {cvJobs.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <span className="text-xs text-blue-400">📄 CV mention included ({cvJobs.length} jobs require it)</span>
            </div>
          )}
          {redirectJobs.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <span className="text-xs text-purple-400">↗ Platform flexibility included ({redirectJobs.length} redirects)</span>
            </div>
          )}
          {cvJobs.length === 0 && redirectJobs.length === 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <span className="text-xs text-emerald-400">✓ Clean message — no CV or redirect flags</span>
            </div>
          )}
        </div>
        {allSkills.length > 0 && (
          <div>
            <p className="text-[10px] text-gray-600 mb-1.5">Skills woven into the message:</p>
            <div className="flex flex-wrap gap-1.5">
              {allSkills.map(s => (
                <span key={s} className="px-2 py-0.5 rounded-full text-[10px] bg-gray-800 text-gray-400 border border-gray-700">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Message editor */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <p className="text-xs font-semibold text-gray-300">Generated Application Message</p>
          <div className="flex items-center gap-2">
            {editing && (
              <button onClick={() => { setEditedMessage(message); setEditing(false); }} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                Reset
              </button>
            )}
            <button
              onClick={() => setEditing(e => !e)}
              className="text-xs px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              {editing ? 'Preview' : '✏️ Edit'}
            </button>
            <button
              onClick={handleCopy}
              className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${copied ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        {editing ? (
          <textarea
            value={editedMessage}
            onChange={e => setEditedMessage(e.target.value)}
            className="w-full bg-transparent px-5 py-4 text-sm text-gray-300 leading-relaxed resize-none focus:outline-none min-h-[280px]"
          />
        ) : (
          <div className="px-5 py-4">
            <p className="text-sm text-gray-300 leading-loose whitespace-pre-line">{editedMessage}</p>
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 p-3 bg-yellow-500/5 border border-yellow-500/15 rounded-xl">
        <svg className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-yellow-400/80 leading-relaxed">
          Generated from skills across all {jobs.length} valid jobs. Use <strong>Edit</strong> to personalise, then <strong>Copy</strong> to paste into LinkedIn.
        </p>
      </div>
    </div>
  );
}
