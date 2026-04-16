'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types';

const DEMO_USERS: User[] = [
  {
    name: 'Rafael',
    email: 'raffymcfee@gmail.com',
    avatar: 'https://ui-avatars.com/api/?name=Rafael&background=2563eb&color=fff&bold=true',
  },
];

export default function LoginPage() {
  const router   = useRouter();
  const [loading, setLoading]   = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('linkediq_user');
    if (stored) router.replace('/dashboard');
    else setChecking(false);
  }, [router]);

  function handleLogin(user: User) {
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('linkediq_user', JSON.stringify(user));
      router.push('/dashboard');
    }, 800);
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen login-bg flex flex-col items-center justify-center p-6">
      {/* Brand */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-900/40">
          {/* LinkedIn-style icon */}
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">LinkedIQ</h1>
        <p className="text-gray-500 text-sm mt-1">AI-Powered LinkedIn Job Hunter</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-sm font-semibold text-gray-300 mb-5">Sign in to continue</h2>

        <div className="space-y-3">
          <button
            onClick={() => handleLogin(DEMO_USERS[0])}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 disabled:bg-gray-200 text-gray-900 font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? 'Signing in...' : 'Continue with Gmail'}
          </button>

          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gray-900 px-2 text-xs text-gray-600">or</span>
            </div>
          </div>

          <button
            onClick={() => handleLogin(DEMO_USERS[0])}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
          >
            {loading ? 'Loading...' : 'Quick Demo Login'}
          </button>
        </div>

        {/* Feature bullets */}
        <div className="mt-6 pt-5 border-t border-gray-800 space-y-2">
          {[
            'Scrape LinkedIn with stealth Playwright browser',
            'AI analysis: detect redirects, video gates & skill match',
            'Auto-generate personalized cover letters per job',
          ].map(feat => (
            <div key={feat} className="flex items-start gap-2 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {feat}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-6 text-xs text-gray-700 text-center">
        No real authentication. Prototype demo.
      </p>
    </div>
  );
}
