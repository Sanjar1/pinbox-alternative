/**
 * Google Business Profile — OAuth Token Generator
 * Step 1: Run this to get the authorization URL
 * Step 2: Visit the URL, authorize, copy the code from the redirect
 * Step 3: Run: node scripts/gbp-get-token.mjs <code>
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');

const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(line => line.includes('=') && !line.startsWith('#'))
    .map(line => {
      const [key, ...rest] = line.split('=');
      return [key.trim(), rest.join('=').trim().replace(/^"|"$/g, '')];
    })
);

const CLIENT_ID     = env.GOOGLE_BP_CLIENT_ID;
const CLIENT_SECRET = env.GOOGLE_BP_CLIENT_SECRET;
const REDIRECT_URI  = env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

const code = process.argv[2];

if (!code) {
  // Step 1: Print the URL
  const params = new URLSearchParams({
    client_id:     CLIENT_ID,
    redirect_uri:  REDIRECT_URI,
    response_type: 'code',
    scope:         'https://www.googleapis.com/auth/business.manage',
    access_type:   'offline',
    prompt:        'consent',
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Step 1: Open this URL in your browser:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(url);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nAfter authorizing, you will be redirected to:');
  console.log(`  ${REDIRECT_URI}?code=<CODE>&...`);
  console.log('\nCopy the "code" value from the URL and run:');
  console.log('  node scripts/gbp-get-token.mjs <code>');

} else {
  // Step 2: Exchange code for tokens
  console.log('🔄 Exchanging code for tokens...');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri:  REDIRECT_URI,
      grant_type:    'authorization_code',
      code,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.refresh_token) {
    console.error('❌ Failed:');
    console.error(JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log('✅ Got tokens!');
  console.log(`   Access token expires in: ${data.expires_in}s`);
  console.log(`   Refresh token: ${data.refresh_token.slice(0, 20)}...`);

  // Update .env
  let envContent = readFileSync(envPath, 'utf8');
  envContent = envContent.replace(
    /GOOGLE_BP_REFRESH_TOKEN=.*/,
    `GOOGLE_BP_REFRESH_TOKEN="${data.refresh_token}"`
  );
  writeFileSync(envPath, envContent);

  console.log('\n✅ .env updated with new refresh token');
  console.log('Now run: node scripts/test-gbp-api.mjs');
}
