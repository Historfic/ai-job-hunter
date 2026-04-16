// ─── Salary Evaluator ─────────────────────────────────────────────────────────
// Parses LinkedIn salary strings and checks against a minimum hourly rate.
// LinkedIn shows salary in many formats — annual, monthly, or hourly.

export interface SalaryResult {
  approved: boolean;
  hourlyRate: number | null;
  reason: string;
}

const ANNUAL_DIVISOR   = 2080; // 52 weeks × 40 hours
const MONTHLY_DIVISOR  = 173;  // ~173 working hours/month

/**
 * Parse a salary string and return an estimated hourly rate.
 * Returns null if the salary can't be parsed.
 */
function parseHourlyRate(salaryStr: string | null): number | null {
  if (!salaryStr) return null;

  const s = salaryStr.toLowerCase().replace(/,/g, '');

  // Already hourly: "$40/hr", "$40–$60/hr"
  const hourlyMatch = s.match(/\$?([\d.]+)\s*(?:–|-|to)\s*\$?([\d.]+)\s*(?:\/hr|per hour)/);
  if (hourlyMatch) {
    return (parseFloat(hourlyMatch[1]) + parseFloat(hourlyMatch[2])) / 2;
  }
  const hourlyFlat = s.match(/\$?([\d.]+)\s*(?:\/hr|per hour)/);
  if (hourlyFlat) return parseFloat(hourlyFlat[1]);

  // Annual: "$80,000–$100,000/yr" or "$80k–$100k"
  const annualMatch = s.match(/\$?([\d.]+)k?\s*(?:–|-|to)\s*\$?([\d.]+)k?\s*(?:\/yr|per year|annually|\/y)?/);
  if (annualMatch) {
    let lo = parseFloat(annualMatch[1]);
    let hi = parseFloat(annualMatch[2]);
    if (lo < 1000) { lo *= 1000; hi *= 1000; } // handle "80k" notation
    return ((lo + hi) / 2) / ANNUAL_DIVISOR;
  }
  const annualFlat = s.match(/\$?([\d.]+)k?\s*(?:\/yr|per year|annually)/);
  if (annualFlat) {
    let v = parseFloat(annualFlat[1]);
    if (v < 1000) v *= 1000;
    return v / ANNUAL_DIVISOR;
  }

  // Monthly: "$3,000/mo"
  const monthlyMatch = s.match(/\$?([\d.]+)\s*(?:\/mo|per month)/);
  if (monthlyMatch) return parseFloat(monthlyMatch[1]) / MONTHLY_DIVISOR;

  return null;
}

/**
 * Evaluate whether a job meets the minimum hourly rate threshold.
 * When LinkedIn doesn't show salary, we approve by default.
 */
export function evaluateSalary(
  salaryStr: string | null,
  minHourly: number
): SalaryResult {
  if (!salaryStr || !salaryStr.trim()) {
    return {
      approved: true,
      hourlyRate: null,
      reason: 'No salary listed — included by default',
    };
  }

  const hourlyRate = parseHourlyRate(salaryStr);

  if (hourlyRate === null) {
    return {
      approved: true,
      hourlyRate: null,
      reason: `Could not parse salary: "${salaryStr}"`,
    };
  }

  if (hourlyRate < minHourly) {
    return {
      approved: false,
      hourlyRate,
      reason: `$${hourlyRate.toFixed(0)}/hr is below minimum $${minHourly}/hr`,
    };
  }

  return {
    approved: true,
    hourlyRate,
    reason: `~$${hourlyRate.toFixed(0)}/hr`,
  };
}
