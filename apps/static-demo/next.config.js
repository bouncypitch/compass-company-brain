const path = require('path');

/**
 * Static, backend-free export of the Compass demo for GitHub Pages.
 *
 * The deck and journey components are compiled straight from apps/web/src
 * (`@/` → ../web/src), except the network layer: `@/lib/brain-api` resolves to
 * ./src/lib/brain-api.ts, which serves the recorded snapshot in public/snapshot.
 */
const BASE_PATH = '/compass-company-brain';
const STATIC_BRAIN_API = './src/lib/brain-api.ts';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: BASE_PATH,
  trailingSlash: true,
  images: { unoptimized: true },
  devIndicators: false,
  reactStrictMode: true,
  transpilePackages: ['@app-starter/shared'],
  env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH },
  turbopack: {
    root: path.join(__dirname, '../..'),
    resolveAlias: {
      '@/lib/brain-api': STATIC_BRAIN_API,
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/lib/brain-api$': path.join(__dirname, STATIC_BRAIN_API),
    };
    return config;
  },
};

module.exports = nextConfig;
