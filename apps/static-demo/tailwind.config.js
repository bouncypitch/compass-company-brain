// apps/web's theme, scanning both this app and the web components it renders.
// jiti loads the web config the same way Tailwind would; requiring the .ts file
// directly lets Node's type stripping try (and warn about) it first.
const loadTs = require('jiti')(__filename, { interopDefault: true });

const webConfig = loadTs('../web/tailwind.config.ts');

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...webConfig,
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../web/src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
};
