'use client';

import type { ProcessResult } from '@/types';

interface Props { result: ProcessResult; }

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 w-28 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-600 w-6 text-right">{value}</span>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-4">{title}</p>
      {children}
    </div>
  );
}

export default function AIInsights({ result }: Props) {
  const { validJobs, removedJobs, topSkills, suggestedKeywords, commonRequirements, stats } = result;

  const skillFreq: Record<string, number> = {};
  validJobs.forEach(j => j.analysis.skills.forEach(s => { skillFreq[s] = (skillFreq[s] ?? 0) + 1; }));
  const sortedSkills   = Object.entries(skillFreq).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const maxSkillFreq   = sortedSkills[0]?.[1] ?? 1;

  const cvCount        = validJobs.filter(j => j.analysis.requires_cv).length;
  const redirectCount  = validJobs.filter(j => j.analysis.platform_redirect).length;
  const remoteCount    = validJobs.filter(j => j.workType === 'Remote').length;
  const cleanCount     = validJobs.filter(j => !j.analysis.requires_cv && !j.analysis.platform_redirect).length;

  const highScore = validJobs.filter(j => j.score >= 80).length;
  const midScore  = validJobs.filter(j => j.score >= 60 && j.score < 80).length;
  const lowScore  = validJobs.filter(j => j.score < 60).length;
  const avgScore  = validJobs.length
    ? Math.round(validJobs.reduce((s, j) => s + j.score, 0) / validJobs.length)
    : 0;

  return (
    <div className="space-y-4 animate-slide-up">

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Scraped', value: stats.totalScraped, color: 'text-white',       bg: 'bg-gray-900' },
          { label: 'Valid Jobs',    value: validJobs.length,   color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
          { label: 'Removed',       value: removedJobs.length, color: 'text-red-400',     bg: 'bg-red-500/5' },
          { label: 'Avg Score',     value: `${avgScore}/100`,  color: 'text-blue-400',    bg: 'bg-blue-500/5' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border border-gray-800 rounded-xl p-4`}>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] uppercase tracking-widest text-gray-600 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Top Skills */}
        <Card title="🧠 Top Skills In Demand">
          {sortedSkills.length === 0 ? (
            <p className="text-xs text-gray-600">No skills data available.</p>
          ) : (
            <div className="space-y-2.5">
              {sortedSkills.map(([skill, count]) => (
                <BarRow key={skill} label={skill} value={count} max={maxSkillFreq} color="bg-blue-500" />
              ))}
            </div>
          )}
        </Card>

        {/* Job Quality Breakdown */}
        <Card title="📊 Job Quality Breakdown">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs text-gray-400">Clean (no CV, no redirect)</span>
              </div>
              <span className="text-sm font-semibold text-emerald-400">{cleanCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-gray-400">Remote jobs</span>
              </div>
              <span className="text-sm font-semibold text-emerald-400">{remoteCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <span className="text-xs text-gray-400">Requires CV/Resume</span>
              </div>
              <span className="text-sm font-semibold text-blue-400">{cvCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                <span className="text-xs text-gray-400">Platform Redirect</span>
              </div>
              <span className="text-sm font-semibold text-purple-400">{redirectCount}</span>
            </div>

            <div className="border-t border-gray-800 pt-3 mt-2">
              <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-2">Score Distribution</p>
              <div className="space-y-1.5">
                <BarRow label="High (80-100)" value={highScore} max={validJobs.length || 1} color="bg-emerald-500" />
                <BarRow label="Mid (60-79)"   value={midScore}  max={validJobs.length || 1} color="bg-yellow-500" />
                <BarRow label="Low (<60)"     value={lowScore}  max={validJobs.length || 1} color="bg-gray-600" />
              </div>
            </div>
          </div>
        </Card>

        {/* Common Requirements */}
        <Card title="📋 Common Requirements">
          {commonRequirements.length === 0 ? (
            <p className="text-xs text-gray-600">No dominant requirements detected.</p>
          ) : (
            <ul className="space-y-2">
              {commonRequirements.map(r => (
                <li key={r} className="flex items-start gap-2 text-xs text-gray-400">
                  <svg className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {r}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Suggested Keywords */}
        <Card title="🔍 Suggested Keywords">
          <p className="text-xs text-gray-600 mb-3">Try these in your next search for better results:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedKeywords.map(kw => (
              <span key={kw} className="px-2.5 py-1 rounded-full text-xs bg-blue-600/10 text-blue-400 border border-blue-600/20 font-medium">
                {kw}
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* Raw JSON debug */}
      <details className="group">
        <summary className="text-xs text-gray-600 hover:text-gray-400 cursor-pointer flex items-center gap-1.5 list-none">
          <svg className="w-3 h-3 group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          View raw aggregated JSON
        </summary>
        <pre className="mt-2 text-[10px] text-gray-500 bg-gray-900 border border-gray-800 rounded-xl p-4 overflow-x-auto leading-relaxed">
{JSON.stringify({
  top_skills: topSkills,
  common_requirements: commonRequirements,
  suggested_keywords: suggestedKeywords,
  valid_jobs: validJobs.map(j => ({
    title: j.title, location: j.location, workType: j.workType,
    score: j.score, analysis: j.analysis,
  })),
}, null, 2)}
        </pre>
      </details>
    </div>
  );
}
