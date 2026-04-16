'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User, ScrapeOptions, ProcessResult, AppTab } from '@/types';
import SearchForm from '@/components/SearchForm';
import JobCard from '@/components/JobCard';
import AIInsights from '@/components/AIInsights';
import ApplicationMessage from '@/components/ApplicationMessage';
import EmailPreview from '@/components/EmailPreview';

const STEPS = [
  { pct: 8,  msg: 'Launching Playwright browser...' },
  { pct: 25, msg: (kw: string) => `Searching LinkedIn for "${kw}"...` },
  { pct: 45, msg: 'Running Claude analysis on each listing...' },
  { pct: 65, msg: 'Filtering video-gate & redirect jobs...' },
  { pct: 80, msg: 'Scoring and ranking results...' },
  { pct: 92, msg: 'Generating application message...' },
  { pct: 100, msg: 'Done!' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser]               = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [loading, setLoading]       = useState(false);
  const [progress, setProgress]     = useState(0);
  const [statusMsg, setStatusMsg]   = useState('');
  const [error, setError]           = useState('');

  const [result, setResult]         = useState<ProcessResult | null>(null);
  const [activeTab, setActiveTab]   = useState<AppTab>('jobs');
  const [emailSent, setEmailSent]   = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [lastOptions, setLastOptions]   = useState<ScrapeOptions | null>(null);

  // ── Auth guard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('linkediq_user');
    if (!stored) { router.replace('/login'); return; }
    setUser(JSON.parse(stored));
  }, [router]);

  function animateProgress(targetPct: number, msg: string) {
    setStatusMsg(msg);
    setProgress(prev => Math.max(prev, targetPct));
  }

  // ── Main search pipeline ─────────────────────────────────────────────────────
  const handleSearch = useCallback(async (options: ScrapeOptions) => {
    setLoading(true);
    setError('');
    setResult(null);
    setEmailSent(false);
    setProgress(0);
    setLastOptions(options);

    try {
      animateProgress(STEPS[0].pct, STEPS[0].msg as string);
      await tick();

      const kwMsg = typeof STEPS[1].msg === 'function'
        ? STEPS[1].msg(options.keyword)
        : STEPS[1].msg;
      animateProgress(STEPS[1].pct, kwMsg);

      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error ?? `Server error ${res.status}`);
      }

      animateProgress(STEPS[2].pct, STEPS[2].msg as string);
      await tick();
      animateProgress(STEPS[3].pct, STEPS[3].msg as string);
      await tick();
      animateProgress(STEPS[4].pct, STEPS[4].msg as string);

      const data: ProcessResult = await res.json();

      animateProgress(STEPS[5].pct, STEPS[5].msg as string);
      await tick();
      animateProgress(STEPS[6].pct, STEPS[6].msg as string);

      setResult(data);
      setActiveTab('jobs');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Email send ───────────────────────────────────────────────────────────────
  async function handleSendEmail() {
    if (!result || sendingEmail) return;
    setSendingEmail(true);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result, options: lastOptions }),
      });
      if (!res.ok) throw new Error('Email send failed');
      setEmailSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSendingEmail(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('linkediq_user');
    router.push('/login');
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabCounts: Record<AppTab, number | undefined> = {
    jobs: result?.validJobs.length,
    insights: undefined,
    application: undefined,
    email: undefined,
  };

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <header className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-gray-800 bg-gray-950 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors lg:hidden"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <span className="text-sm font-semibold">LinkedIQ</span>
          </div>

          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-medium">
            Demo Mode
          </span>
        </div>

        <div className="flex items-center gap-4">
          {result && (
            <div className="hidden md:flex items-center gap-4 text-xs text-gray-500">
              <span><span className="text-white font-medium">{result.validJobs.length}</span> valid</span>
              <span><span className="text-red-400 font-medium">{result.removedJobs.length}</span> removed</span>
              <span>Scraped <span className="text-white font-medium">{result.stats.totalScraped}</span></span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full" />
            <div className="hidden sm:block">
              <p className="text-xs font-medium leading-none">{user.name}</p>
              <p className="text-xs text-gray-600 leading-none mt-0.5">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-1 text-xs text-gray-600 hover:text-gray-400 transition-colors"
              title="Sign out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside className={`${sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'} shrink-0 border-r border-gray-800 flex flex-col transition-all duration-200 bg-gray-950`}>
          <div className="flex-1 overflow-y-auto p-4">
            <SearchForm onSearch={handleSearch} loading={loading} />
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Progress bar */}
          {loading && (
            <div className="shrink-0 border-b border-gray-800 bg-gray-950 px-5 py-4 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-gray-400">{statusMsg}</span>
                </div>
                <span className="text-xs text-gray-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5">
                <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="shrink-0 mx-5 mt-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-start gap-2 animate-fade-in">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <strong>Error</strong>: {error}
                <button onClick={() => setError('')} className="ml-2 underline text-xs hover:no-underline">dismiss</button>
              </div>
            </div>
          )}

          {/* ── Empty state ─────────────────────────────────────────────────── */}
          {!loading && !result && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
              <div className="w-16 h-16 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-gray-300 mb-2">Ready to hunt</h2>
              <p className="text-sm text-gray-600 max-w-xs">
                Fill in the search form on the left and click <strong className="text-gray-500">Find Jobs</strong> to start the AI-powered LinkedIn scan.
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl w-full">
                {[
                  { icon: '🕷️', title: 'Stealth Scraper', desc: 'Playwright + stealth plugin scrapes LinkedIn as a real browser' },
                  { icon: '🤖', title: 'Claude Analysis', desc: 'Detects video gates, redirects, and skill match per listing' },
                  { icon: '✍️', title: 'Auto Apply', desc: 'Generates a reusable, human-sounding cover letter' },
                ].map(f => (
                  <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-left">
                    <div className="text-xl mb-2">{f.icon}</div>
                    <p className="text-xs font-semibold text-gray-300 mb-1">{f.title}</p>
                    <p className="text-xs text-gray-600">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Results ─────────────────────────────────────────────────────── */}
          {result && !loading && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden animate-fade-in">

              {/* Demo banner */}
              {!result.isLiveData && (
                <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 text-xs text-yellow-400">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span><strong>Demo mode</strong> — showing sample jobs. Set <code className="bg-yellow-500/20 px-1 rounded">DEMO_MODE=false</code> and add your <code className="bg-yellow-500/20 px-1 rounded">li_at</code> LinkedIn cookie for live data.</span>
                </div>
              )}

              {/* Tab bar */}
              <div className="shrink-0 flex items-center gap-1 px-4 pt-3 pb-0 border-b border-gray-800">
                {(['jobs', 'insights', 'application', 'email'] as AppTab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors capitalize
                      ${activeTab === tab ? 'text-white bg-gray-800 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'}`}
                  >
                    {tab === 'jobs'        && '📋'}
                    {tab === 'insights'    && '🧠'}
                    {tab === 'application' && '✍️'}
                    {tab === 'email'       && '📧'}
                    {tab}
                    {tabCounts[tab] !== undefined && (
                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-blue-600 text-white text-[10px] rounded-full">
                        {tabCounts[tab]}
                      </span>
                    )}
                  </button>
                ))}

                {result.bestMatches.length > 0 && activeTab === 'jobs' && (
                  <div className="ml-auto flex items-center gap-1.5 text-xs text-yellow-400">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>{result.bestMatches.length} best match{result.bestMatches.length > 1 ? 'es' : ''}</span>
                  </div>
                )}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto p-4 md:p-5">

                {activeTab === 'jobs' && (
                  <div className="space-y-3 animate-slide-up">
                    {result.bestMatches.length > 0 && (
                      <div className="mb-5">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-semibold uppercase tracking-wider text-yellow-400">🏆 Top Matches</span>
                          <div className="flex-1 border-t border-yellow-500/20" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {result.bestMatches.map(job => (
                            <JobCard key={job.id} job={job} highlight baseMessage={result.applicationMessage} />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        All Valid Jobs ({result.validJobs.length})
                      </span>
                      <div className="flex-1 border-t border-gray-800" />
                    </div>

                    {result.validJobs.length === 0 ? (
                      <div className="text-center py-12 text-gray-600">
                        <p className="text-sm">No valid jobs found after filtering.</p>
                        <p className="text-xs mt-1">Try different keywords or filters.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {result.validJobs.map(job => (
                          <JobCard key={job.id} job={job} baseMessage={result.applicationMessage} />
                        ))}
                      </div>
                    )}

                    {result.removedJobs.length > 0 && (
                      <details className="mt-6 group">
                        <summary className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer hover:text-gray-400 transition-colors list-none">
                          <svg className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          {result.removedJobs.length} removed jobs (debug)
                        </summary>
                        <div className="mt-2 space-y-2 pl-4 border-l border-gray-800">
                          {result.removedJobs.map((r, i) => (
                            <div key={i} className="bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                              <p className="text-xs font-medium text-red-400/80">{r.job.title}</p>
                              <p className="text-xs text-gray-600 mt-0.5">Removed: {r.reason}</p>
                              <p className="text-xs text-gray-700">{r.job.companyName}</p>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}

                {activeTab === 'insights'    && <AIInsights result={result} />}
                {activeTab === 'application' && <ApplicationMessage message={result.applicationMessage} jobs={result.validJobs} />}
                {activeTab === 'email'       && (
                  <EmailPreview
                    result={result}
                    options={lastOptions!}
                    onSend={handleSendEmail}
                    sending={sendingEmail}
                    sent={emailSent}
                  />
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function tick() {
  return new Promise<void>(r => setTimeout(r, 300));
}
