const fs = require('fs');
const path = require('path');

const url = process.env.API_BASE_URL;
if (!url) {
  console.warn('[eas-build-pre-install] API_BASE_URL not set — using existing .env if present');
  process.exit(0);
}

const envPath = path.join(__dirname, '..', '.env');
fs.writeFileSync(envPath, `API_BASE_URL=${url.replace(/\/$/, '')}\n`, 'utf8');
console.log('[eas-build-pre-install] Wrote .env with API_BASE_URL for bundle build');
