#!/usr/bin/env node

/**
 * RAILWAY SETUP SCRIPT
 * Interactive setup for Railway CLI and project linking
 * Usage: node scripts/railway-setup.mjs
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

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

async function run() {
  try {
    log("info", "Railway CLI Setup");
    console.log("═".repeat(60));

    // Step 1: Check Railway CLI
    log("info", "Checking Railway CLI...");
    try {
      execSync("railway --version", { stdio: "pipe" });
      log("success", "Railway CLI is installed");
    } catch {
      log("error", "Railway CLI not found");
      log("info", "Install from: https://docs.railway.app/guides/cli");
      process.exit(1);
    }

    // Step 2: Check authentication
    log("info", "Checking authentication...");
    try {
      const user = execSync("railway whoami", { encoding: "utf-8" }).trim();
      log("success", `Authenticated as: ${user}`);
    } catch {
      log("warning", "Not authenticated with Railway");
      const shouldLogin = await question("Do you want to login now? (y/n) ");
      if (shouldLogin.toLowerCase() === "y") {
        log("info", "Running: railway login");
        execSync("railway login", { stdio: "inherit" });
        log("success", "Login complete");
      } else {
        log("error", "Authentication required to continue");
        process.exit(1);
      }
    }

    // Step 3: Link to Railway project
    log("info", "Linking to Railway project...");

    const projectRoot = path.dirname(path.dirname(import.meta.url.replace("file://", "")));
    const railwayConfigDir = path.join(projectRoot, ".railway");
    const railwayConfigFile = path.join(railwayConfigDir, "config.json");

    let projectId;

    if (fs.existsSync(railwayConfigFile)) {
      const config = JSON.parse(fs.readFileSync(railwayConfigFile, "utf-8"));
      projectId = config.projectId;
      log("success", `Already linked to project: ${projectId}`);
    } else {
      log("info", "Projects available on your account:");
      try {
        const projects = execSync("railway list", { encoding: "utf-8" });
        console.log(projects);
      } catch (e) {
        log("warning", "Could not list projects");
      }

      projectId = await question("Enter Railway Project ID: ");
      if (!projectId) {
        log("error", "Project ID is required");
        process.exit(1);
      }

      if (!fs.existsSync(railwayConfigDir)) {
        fs.mkdirSync(railwayConfigDir, { recursive: true });
      }

      fs.writeFileSync(
        railwayConfigFile,
        JSON.stringify({ projectId }, null, 2)
      );

      log("success", `Linked to project: ${projectId}`);
    }

    // Step 4: Check environment variables in Railway
    log("info", "Checking environment variables on Railway...");
    try {
      const vars = execSync("railway variables list", {
        encoding: "utf-8",
      });
      const hasDatabase = vars.includes("DATABASE_URL");
      const hasSession = vars.includes("SESSION_SECRET");
      const hasSalt = vars.includes("FEEDBACK_HASH_SALT");

      if (hasDatabase) {
        log("success", "DATABASE_URL is set");
      } else {
        log("warning", "DATABASE_URL not set");
      }

      if (hasSession) {
        log("success", "SESSION_SECRET is set");
      } else {
        log("warning", "SESSION_SECRET not set");
      }

      if (hasSalt) {
        log("success", "FEEDBACK_HASH_SALT is set");
      } else {
        log("warning", "FEEDBACK_HASH_SALT not set");
      }
    } catch (e) {
      log("warning", "Could not check Railway variables");
    }

    // Step 5: Create .env.local if missing
    const appDir = path.join(projectRoot, "app");
    const envLocalFile = path.join(appDir, ".env.local");
    const envExampleFile = path.join(appDir, ".env.example");

    if (!fs.existsSync(envLocalFile)) {
      log("info", "Creating .env.local...");

      if (fs.existsSync(envExampleFile)) {
        const exampleContent = fs.readFileSync(envExampleFile, "utf-8");
        fs.writeFileSync(envLocalFile, exampleContent);
        log("success", "Created .env.local from .env.example");
        log("warning", "Edit .env.local with your actual values");
      } else {
        log("warning", ".env.example not found, skipping .env.local creation");
      }
    } else {
      log("success", ".env.local exists");
    }

    // Summary
    console.log("\n" + "═".repeat(60));
    log("success", "Setup complete!");
    console.log("\nNext steps:");
    console.log(
      "  1. Edit app/.env.local with your DATABASE_URL and secrets"
    );
    console.log(
      "  2. Run: bash scripts/deploy-railway.sh production"
    );
    console.log("═".repeat(60));

    rl.close();
  } catch (error) {
    log("error", error.message);
    rl.close();
    process.exit(1);
  }
}

run();
