'use client';

import { useState } from 'react';
import type { ScrapeOptions } from '@/types';

interface Props {
  onSearch: (opts: ScrapeOptions) => void;
  loading: boolean;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
      {children}
    </p>
  );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
    />
  );
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
    >
      {children}
    </select>
  );
}

export default function SearchForm({ onSearch, loading }: Props) {
  // Required fields
  const [keyword, setKeyword]   = useState('n8n automation');
  const [location, setLocation] = useState('');
  const [limit, setLimit]       = useState('10');

  // Smart filters (collapsible)
  const [showFilters, setShowFilters] = useState(false);
  const [workType, setWorkType]       = useState<ScrapeOptions['workType']>('any');
  const [employmentType, setEmploymentType] = useState<ScrapeOptions['employmentType']>('any');
  const [experienceLevel, setExperienceLevel] = useState<ScrapeOptions['experienceLevel']>('');
  const [datePosted, setDatePosted] = useState<ScrapeOptions['datePosted']>('');
  const [liAtCookie, setLiAtCookie] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim() || loading) return;

    onSearch({
      keyword:        keyword.trim(),
      location:       location.trim() || undefined,
      workType,
      employmentType,
      experienceLevel,
      datePosted,
      limit:          Math.min(Math.max(Number(limit) || 10, 1), 30),
      liAtCookie:     liAtCookie.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-gray-300 mb-1">Search LinkedIn Jobs</p>
        <p className="text-[11px] text-gray-600">Configure your search and click Find Jobs.</p>
      </div>

      {/* ── Required Fields ─────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <Label>Job Keywords *</Label>
          <Input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="e.g. n8n, Python, AI voice"
            required
          />
        </div>

        <div>
          <Label>Location</Label>
          <Input
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="e.g. Remote, New York, Philippines"
          />
          <p className="text-[10px] text-gray-700 mt-1">Leave empty for worldwide results.</p>
        </div>

        <div>
          <Label>Number of Jobs *</Label>
          <Input
            type="number"
            value={limit}
            onChange={e => setLimit(e.target.value)}
            min="1"
            max="30"
            placeholder="10"
          />
          <p className="text-[10px] text-gray-700 mt-1">Max 30. Scraper loops until quota is met.</p>
        </div>
      </div>

      <div className="border-t border-gray-800" />

      {/* ── Smart Filters (collapsible) ──────────────────────────────────────── */}
      <div>
        <button
          type="button"
          onClick={() => setShowFilters(f => !f)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors w-full"
        >
          <svg className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-semibold uppercase tracking-widest text-[10px]">LinkedIn Filters</span>
          <span className="text-gray-700 text-[10px]">(optional)</span>
        </button>

        {showFilters && (
          <div className="mt-4 space-y-4 animate-slide-up">

            <div>
              <Label>Work Type</Label>
              <Select value={workType} onChange={e => setWorkType(e.target.value as ScrapeOptions['workType'])}>
                <option value="any">Any</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </Select>
            </div>

            <div>
              <Label>Employment Type</Label>
              <Select value={employmentType} onChange={e => setEmploymentType(e.target.value as ScrapeOptions['employmentType'])}>
                <option value="any">Any</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
              </Select>
            </div>

            <div>
              <Label>Experience Level</Label>
              <Select value={experienceLevel} onChange={e => setExperienceLevel(e.target.value as ScrapeOptions['experienceLevel'])}>
                <option value="">Any level</option>
                <option value="internship">Internship</option>
                <option value="entry">Entry Level</option>
                <option value="associate">Associate</option>
                <option value="mid-senior">Mid-Senior</option>
                <option value="director">Director</option>
                <option value="executive">Executive</option>
              </Select>
            </div>

            <div>
              <Label>Date Posted</Label>
              <Select value={datePosted} onChange={e => setDatePosted(e.target.value as ScrapeOptions['datePosted'])}>
                <option value="">Any time</option>
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </Select>
            </div>

            <div>
              <Label>LinkedIn Session Cookie (li_at)</Label>
              <Input
                type="password"
                value={liAtCookie}
                onChange={e => setLiAtCookie(e.target.value)}
                placeholder="li_at cookie value"
              />
              <p className="text-[10px] text-gray-700 mt-1">
                Required for live scraping. DevTools → Application → Cookies → linkedin.com → li_at
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Submit ──────────────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={loading || !keyword.trim()}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-sm font-medium transition-colors"
      >
        {loading ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            Searching...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Find Jobs
          </>
        )}
      </button>

      <p className="text-[10px] text-gray-700 text-center leading-relaxed">
        Demo mode active. Add your <code className="bg-gray-800 px-1 rounded">li_at</code> cookie for live LinkedIn data.
      </p>
    </form>
  );
}
