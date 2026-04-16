/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Playwright and stealth plugin use dynamic require() calls that webpack
    // can't bundle — tell Next.js to keep them as external Node.js modules.
    serverComponentsExternalPackages: [
      'playwright-extra',
      'puppeteer-extra-plugin-stealth',
      'puppeteer-extra-plugin',
      'playwright',
    ],
  },
};

export default nextConfig;
