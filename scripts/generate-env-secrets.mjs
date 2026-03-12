#!/usr/bin/env node

/**
 * GENERATE ENVIRONMENT SECRETS
 * Creates random secure secrets for .env.local
 * Usage: node scripts/generate-env-secrets.mjs
 */

import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

function generateSecret(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

function log(type, msg) {
  const colors = {
    info: "\x1b[34m",
    success: "\x1b[32m",
    warning: "\x1b[33m",
    reset: "\x1b[0m",
  };

  const icons = {
    info: "ℹ️ ",
    success: "✓",
    warning: "⚠️",
  };

  console.log(`${colors[type]}${icons[type]} ${type.toUpperCase()}${colors.reset}: ${msg}`);
}

console.log("═".repeat(60));
log("info", "Generating secure environment secrets");
console.log("═".repeat(60));

// Generate secrets
const sessionSecret = generateSecret(32);
const feedbackSalt = generateSecret(32);

console.log("\n📋 GENERATED SECRETS:\n");
console.log("SESSION_SECRET:");
console.log(`  ${sessionSecret}\n`);
console.log("FEEDBACK_HASH_SALT:");
console.log(`  ${feedbackSalt}\n`);

console.log("═".repeat(60));
log("info", "Add these to app/.env.local:");
console.log("═".repeat(60));

console.log(`
SESSION_SECRET=${sessionSecret}
FEEDBACK_HASH_SALT=${feedbackSalt}
`);

// Option to save to .env.local
const envLocalPath = path.join(
  path.dirname(import.meta.url.replace("file://", "")),
  "..",
  "app",
  ".env.local"
);

if (fs.existsSync(envLocalPath)) {
  log("info", "Appending to app/.env.local...");

  let content = fs.readFileSync(envLocalPath, "utf-8");

  // Update or add SESSION_SECRET
  if (content.includes("SESSION_SECRET=")) {
    content = content.replace(
      /SESSION_SECRET=.*/,
      `SESSION_SECRET=${sessionSecret}`
    );
  } else {
    content += `\nSESSION_SECRET=${sessionSecret}`;
  }

  // Update or add FEEDBACK_HASH_SALT
  if (content.includes("FEEDBACK_HASH_SALT=")) {
    content = content.replace(
      /FEEDBACK_HASH_SALT=.*/,
      `FEEDBACK_HASH_SALT=${feedbackSalt}`
    );
  } else {
    content += `\nFEEDBACK_HASH_SALT=${feedbackSalt}`;
  }

  fs.writeFileSync(envLocalPath, content);
  log("success", "Secrets saved to app/.env.local");
} else {
  log("warning", "app/.env.local not found, please add manually");
}

console.log("\n✓ Done! Review app/.env.local and verify the secrets are correct.");
console.log("  Then run: bash scripts/deploy-railway.sh production\n");
