#!/usr/bin/env node

/**
 * VERIFY RAILWAY DEPLOYMENT
 * Checks that the deployed app is running correctly
 * Usage: node scripts/verify-deployment.mjs
 */

import { execSync } from "child_process";
import https from "https";

function log(type, msg) {
  const colors = {
    info: "\x1b[34m",
    success: "\x1b[32m",
    warning: "\x1b[33m",
    error: "\x1b[31m",
    reset: "\x1b[0m",
  };

  const icons = {
    info: "ℹ️ ",
    success: "✓",
    warning: "⚠️",
    error: "✗",
  };

  console.log(`${colors[type]}${icons[type]} ${type.toUpperCase()}${colors.reset}: ${msg}`);
}

async function checkUrl(url) {
  return new Promise((resolve) => {
    https
      .get(url, (res) => {
        resolve(res.statusCode === 200);
      })
      .on("error", () => {
        resolve(false);
      });
  });
}

async function run() {
  try {
    console.log("═".repeat(60));
    log("info", "Verifying Railway Deployment");
    console.log("═".repeat(60));

    // Get app URL
    log("info", "Getting app URL from Railway...");
    let appUrl;

    try {
      appUrl = execSync("railway domain", {
        encoding: "utf-8",
      }).trim();

      if (!appUrl) {
        log("warning", "Could not get domain from Railway");
        appUrl = await question("Enter app URL (e.g., https://pinbox-xxxxx.railway.app): ");
      }
    } catch {
      appUrl = await question("Enter app URL (e.g., https://pinbox-xxxxx.railway.app): ");
    }

    if (!appUrl.startsWith("http")) {
      appUrl = `https://${appUrl}`;
    }

    console.log(`\n🔗 Testing URL: ${appUrl}\n`);

    // Test 1: App is running
    log("info", "Testing if app is running...");
    const isRunning = await checkUrl(appUrl);

    if (isRunning) {
      log("success", "App is responding");
    } else {
      log("error", "App is not responding");
      log("warning", "Wait 2-5 minutes for deployment to complete");
      process.exit(1);
    }

    // Test 2: Voting page
    log("info", "Testing voting page (/523da2)...");
    const votingPageUrl = `${appUrl}/523da2`;
    const votingPageOk = await checkUrl(votingPageUrl);

    if (votingPageOk) {
      log("success", "Voting page is accessible");
    } else {
      log("warning", "Voting page might not be ready yet");
    }

    // Test 3: Check logs for errors
    log("info", "Checking deployment logs...");
    try {
      const logs = execSync("railway logs --tail=20", {
        encoding: "utf-8",
      });

      if (logs.includes("error") || logs.includes("Error")) {
        log("warning", "Possible errors found in logs");
        console.log("\nLast 20 log lines:");
        console.log(logs);
      } else {
        log("success", "No obvious errors in logs");
      }
    } catch {
      log("warning", "Could not fetch logs");
    }

    // Test 4: Check environment variables
    log("info", "Checking environment variables...");
    try {
      const vars = execSync("railway variables list", {
        encoding: "utf-8",
      });

      const required = [
        "DATABASE_URL",
        "SESSION_SECRET",
        "FEEDBACK_HASH_SALT",
        "NODE_ENV",
      ];
      const missing = [];

      for (const varName of required) {
        if (vars.includes(varName)) {
          log("success", `${varName} is set`);
        } else {
          log("warning", `${varName} is NOT set`);
          missing.push(varName);
        }
      }

      if (missing.length > 0) {
        log("error", `Missing variables: ${missing.join(", ")}`);
        log("info", "Set them with: railway variables set VAR_NAME value");
      }
    } catch {
      log("warning", "Could not check environment variables");
    }

    // Summary
    console.log("\n" + "═".repeat(60));
    if (isRunning) {
      log("success", "Deployment looks good!");
      console.log("\n📋 POST-DEPLOYMENT CHECKLIST:\n");
      console.log("  ✓ App is running and responding");
      console.log(`  ✓ Visit: ${appUrl}`);
      console.log(`  ✓ Test voting: ${votingPageUrl}`);
      console.log("  □ Verify vote submission saves to database");
      console.log("  □ Check admin panel: /admin");
      console.log("  □ Generate QR posters with production URL");
      console.log("  □ Test on mobile device");
    } else {
      log("warning", "Deployment not ready yet");
      console.log("\nWait 2-5 minutes for Railway to finish building...");
      console.log("Then run this script again.");
    }
    console.log("═".repeat(60));
  } catch (error) {
    log("error", error.message);
    process.exit(1);
  }
}

function question(query) {
  return new Promise((resolve) => {
    process.stdout.write(query);
    process.stdin.once("data", (data) => {
      resolve(data.toString().trim());
    });
  });
}

run();
