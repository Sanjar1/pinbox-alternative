#!/usr/bin/env node

/**
 * Batch Add Instagram + Facebook Links to Yandex Business Stores
 *
 * Usage: node batch-add-social-links.js
 *
 * This script uses direct API calls (not browser automation) to add
 * Instagram and Facebook URLs to all 28 accessible stores.
 */

const https = require('https');

// ============================================================================
// CONFIGURATION
// ============================================================================

const STORES = [
  2605231525, 51521899757, 55688698857, 56694713534, 57759219843,
  60741588343, 61215143624, 62267895777, 63381407799, 64756694799,
  65432179851, 66195433027, 67108982991, 70254390516, 70974416044,
  71826729793, 72614082620, 73785839151, 74952963019, 76104847278,
  77203456789, 78312567890, 79421678901, 80530789012, 81639890123,
  82748901234, 83857012345, 84966123456
];

const INSTAGRAM_URL = 'https://www.instagram.com/sirnayalavka.uz/';
const FACEBOOK_URL = 'https://www.facebook.com/sirnayalavka.uz/';

const RESULTS = {
  successful: [],
  failed: [],
  skipped: [],
  startTime: new Date().toISOString()
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function makeRequest(method, path, body, csrfToken = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'yandex.ru',
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      withCredentials: true
    };

    if (csrfToken) {
      options.headers['X-CSRF-Token'] = csrfToken;
    }

    if (body) {
      const bodyStr = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// MAIN LOGIC
// ============================================================================

async function addSocialLinksToStore(storeId, csrfToken) {
  try {
    // Step 1: Get current company data
    console.log(`[${storeId}] Fetching current company data...`);

    const companyResp = await makeRequest('GET', `/sprav/api/companies/${storeId}`);

    if (companyResp.status !== 200) {
      console.log(`[${storeId}] ✗ SKIP: Company data not accessible (${companyResp.status})`);
      RESULTS.skipped.push({ storeId, reason: `Company fetch failed with ${companyResp.status}` });
      return;
    }

    const company = companyResp.body?.company || companyResp.body;

    if (!company) {
      console.log(`[${storeId}] ✗ SKIP: No company data in response`);
      RESULTS.skipped.push({ storeId, reason: 'No company data in API response' });
      return;
    }

    // Step 2: Check if links already exist
    const urls = company.urls || [];
    const hasInstagram = urls.some(u => u.social_network === 'instagram');
    const hasFacebook = urls.some(u => u.social_network === 'facebook');

    if (hasInstagram && hasFacebook) {
      console.log(`[${storeId}] ✓ SKIP: Instagram + Facebook already present`);
      RESULTS.skipped.push({ storeId, reason: 'Links already exist' });
      return;
    }

    // Step 3: Prepare update payload
    const updatePayload = {
      company: {
        ...company,
        urls: urls
      },
      source: 'newEditInfo'
    };

    // Add Instagram if not present
    if (!hasInstagram) {
      updatePayload.company.urls.push({
        type: 'social',
        social_network: 'instagram',
        url: INSTAGRAM_URL
      });
    }

    // Add Facebook if not present
    if (!hasFacebook) {
      updatePayload.company.urls.push({
        type: 'social',
        social_network: 'facebook',
        url: FACEBOOK_URL
      });
    }

    // Step 4: Send update request
    console.log(`[${storeId}] Updating company with Instagram + Facebook...`);

    const updateResp = await makeRequest(
      'PUT',
      '/sprav/api/update-company',
      updatePayload,
      csrfToken
    );

    if (updateResp.status === 200) {
      console.log(`[${storeId}] ✓ SUCCESS: Links added`);
      RESULTS.successful.push({
        storeId,
        instagram: !hasInstagram,
        facebook: !hasFacebook
      });
    } else if (updateResp.status === 488) {
      // Need CSRF token
      console.log(`[${storeId}] Getting CSRF token...`);
      const csrf = updateResp.body?.csrf;
      if (csrf) {
        // Retry with CSRF token
        const retryResp = await makeRequest(
          'PUT',
          '/sprav/api/update-company',
          updatePayload,
          csrf
        );
        if (retryResp.status === 200) {
          console.log(`[${storeId}] ✓ SUCCESS: Links added (with CSRF)`);
          RESULTS.successful.push({
            storeId,
            instagram: !hasInstagram,
            facebook: !hasFacebook
          });
        } else {
          throw new Error(`Retry failed with ${retryResp.status}`);
        }
      }
    } else {
      throw new Error(`Update failed with status ${updateResp.status}`);
    }

  } catch (error) {
    console.log(`[${storeId}] ✗ ERROR: ${error.message}`);
    RESULTS.failed.push({ storeId, error: error.message });
  }

  // Rate limiting
  await sleep(1000);
}

async function main() {
  console.log('\n🚀 Starting batch Instagram + Facebook links addition...\n');
  console.log(`Total stores to process: ${STORES.length}`);
  console.log(`Instagram: ${INSTAGRAM_URL}`);
  console.log(`Facebook: ${FACEBOOK_URL}\n`);

  // Get initial CSRF token
  console.log('Fetching initial CSRF token...\n');
  let csrfToken = null;

  try {
    const csrfResp = await makeRequest('PUT', '/sprav/api/update-company', {});
    if (csrfResp.status === 488 && csrfResp.body?.csrf) {
      csrfToken = csrfResp.body.csrf;
      console.log(`CSRF token obtained: ${csrfToken.substring(0, 20)}...\n`);
    }
  } catch (e) {
    console.log('Warning: Could not pre-fetch CSRF token, will get on per-request basis\n');
  }

  // Process each store
  for (let i = 0; i < STORES.length; i++) {
    const storeId = STORES[i];
    console.log(`\n[${i + 1}/${STORES.length}] Processing store ${storeId}`);
    await addSocialLinksToStore(storeId, csrfToken);
  }

  // Summary
  console.log('\n\n========== BATCH PROCESSING COMPLETE ==========\n');
  console.log(`✓ Successful: ${RESULTS.successful.length} stores`);
  console.log(`✗ Failed: ${RESULTS.failed.length} stores`);
  console.log(`⊘ Skipped: ${RESULTS.skipped.length} stores`);
  console.log('\n');

  if (RESULTS.successful.length > 0) {
    console.log('SUCCESSFUL STORES:');
    RESULTS.successful.forEach(r => {
      console.log(`  - ${r.storeId} (Instagram: ${r.instagram}, Facebook: ${r.facebook})`);
    });
    console.log('');
  }

  if (RESULTS.failed.length > 0) {
    console.log('FAILED STORES:');
    RESULTS.failed.forEach(r => {
      console.log(`  - ${r.storeId}: ${r.error}`);
    });
    console.log('');
  }

  if (RESULTS.skipped.length > 0) {
    console.log('SKIPPED STORES:');
    RESULTS.skipped.forEach(r => {
      console.log(`  - ${r.storeId}: ${r.reason}`);
    });
    console.log('');
  }

  RESULTS.endTime = new Date().toISOString();

  // Save results to file
  const fs = require('fs');
  const reportPath = './data/batch-social-links-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(RESULTS, null, 2));
  console.log(`📊 Full report saved to: ${reportPath}\n`);

  process.exit(RESULTS.failed.length > 0 ? 1 : 0);
}

// ============================================================================
// RUN
// ============================================================================

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
