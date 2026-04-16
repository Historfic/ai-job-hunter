// ─── Core Job Types ────────────────────────────────────────────────────────────

export interface RawJob {
  id: string;
  title: string | null;
  companyName: string | null;
  location: string | null;
  workType: 'Remote' | 'Hybrid' | 'On-site' | null; // Remote/Hybrid/On-site
  employmentType: string | null;                      // Full-time, Part-time, Contract, etc.
  salary: string | null;
  description: string | null;
  datePosted: string | null;
  url: string | null;
  query?: string;
  hourlyRate?: number | null;
  salaryReason?: string;
}

// Per-job AI analysis shape
export interface JobAnalysis {
  title: string;
  platform_redirect: boolean;
  redirect_platform: string;
  requires_file_upload: boolean;
  required_files: string[];
  requires_cv: boolean;
  skills: string[];
  keywords: string[];
}

// A job that has been through AI analysis + scoring
export interface AnalyzedJob extends RawJob {
  analysis: JobAnalysis;
  score: number; // 0–100
}

// A job that was discarded and the reason why
export interface RemovedJob {
  job: RawJob;
  reason: string;
}

// ─── Request / Response Shapes ────────────────────────────────────────────────

export interface ScrapeOptions {
  keyword: string;
  location?: string;
  workType?: 'remote' | 'hybrid' | 'onsite' | 'any';
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'any';
  experienceLevel?: 'internship' | 'entry' | 'associate' | 'mid-senior' | 'director' | 'executive' | '';
  datePosted?: '24h' | '7d' | '30d' | '';
  limit: number;
  liAtCookie?: string; // LinkedIn li_at session cookie
}

// Full result returned from /api/scrape
export interface ProcessResult {
  validJobs: AnalyzedJob[];
  removedJobs: RemovedJob[];
  topSkills: string[];
  commonRequirements: string[];
  suggestedKeywords: string[];
  bestMatches: AnalyzedJob[];
  applicationMessage: string;
  stats: {
    totalScraped: number;
    totalAnalyzed: number;
    totalRemoved: number;
    scrapePasses: number;
  };
  isLiveData: boolean;
}

// ─── UI State ─────────────────────────────────────────────────────────────────

export type AppTab = 'jobs' | 'insights' | 'application' | 'email';

export interface User {
  name: string;
  email: string;
  avatar: string;
}
