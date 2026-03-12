/**
 * Google Business Profile API — Live Test
 * Tests: refresh token → access token → GET /accounts
 * Run: node scripts/test-gbp-api.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env manually (no dotenv needed)
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
const REFRESH_TOKEN = env.GOOGLE_BP_REFRESH_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error('❌ Missing credentials in .env');
  process.exit(1);
}

console.log('✅ Credentials loaded');
console.log(`   Client ID: ${CLIENT_ID.slice(0, 20)}...`);

// Step 1: Exchange refresh token for access token
console.log('\n🔄 Step 1: Getting access token...');

const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id:     CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: REFRESH_TOKEN,
    grant_type:    'refresh_token',
  }),
});

const tokenData = await tokenRes.json();

if (!tokenRes.ok || !tokenData.access_token) {
  console.error('❌ Failed to get access token:');
  console.error(JSON.stringify(tokenData, null, 2));
  process.exit(1);
}

const accessToken = tokenData.access_token;
console.log(`✅ Access token received (expires in ${tokenData.expires_in}s)`);

// Step 2: Call GET /accounts
console.log('\n🔄 Step 2: Calling GET /accounts...');

const accountsRes = await fetch(
  'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
  { headers: { Authorization: `Bearer ${accessToken}` } }
);

const accountsData = await accountsRes.json();

if (!accountsRes.ok) {
  console.error(`❌ API returned ${accountsRes.status}:`);
  console.error(JSON.stringify(accountsData, null, 2));
  process.exit(1);
}

console.log(`✅ Accounts API responded with status ${accountsRes.status}`);
console.log('\n📋 Accounts found:');

if (!accountsData.accounts || accountsData.accounts.length === 0) {
  console.log('   (no accounts returned — may need to check account access)');
} else {
  for (const acc of accountsData.accounts) {
    console.log(`   - ${acc.name}: ${acc.accountName} (type: ${acc.type})`);
  }
}

// Step 3: Try listing locations if we have an account
if (accountsData.accounts?.length > 0) {
  const firstAccount = accountsData.accounts[0].name;
  console.log(`\n🔄 Step 3: Listing locations for ${firstAccount}...`);

  const locRes = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${firstAccount}/locations?readMask=name,title,phoneNumbers,storefrontAddress`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const locData = await locRes.json();

  if (!locRes.ok) {
    console.error(`❌ Locations API returned ${locRes.status}:`);
    console.error(JSON.stringify(locData, null, 2));
  } else {
    const locs = locData.locations || [];
    console.log(`✅ Found ${locs.length} location(s)`);
    for (const loc of locs.slice(0, 5)) {
      console.log(`   - ${loc.title || loc.name}`);
    }
    if (locs.length > 5) console.log(`   ... and ${locs.length - 5} more`);
  }
}

console.log('\n🎉 Test complete!');
