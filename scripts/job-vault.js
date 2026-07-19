#!/usr/bin/env node
/**
 * job-vault: minimal credential helper for ATS/portal accounts.
 *
 * Stores account credentials in the macOS Keychain (no passwords are kept in
 * this script or in the repo). Maintains a small local index file that maps
 * company names to the Keychain service/account labels so we can list, get,
 * and update entries without asking the user to remember them.
 *
 * Usage:
 *   node scripts/job-vault.js
 *   node scripts/job-vault.js list
 *   node scripts/job-vault.js get "<Company Name>"
 *   node scripts/job-vault.js set "<Company Name>"
 *   node scripts/job-vault.js remove "<Company Name>"
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const VAULT_INDEX_PATH = path.join(__dirname, ".job-vault-index.json");
const KEYCHAIN_SERVICE_PREFIX = "ai-job-hunt-toolkit-job-vault";

function loadIndex() {
  if (!fs.existsSync(VAULT_INDEX_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(VAULT_INDEX_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function saveIndex(index) {
  fs.writeFileSync(VAULT_INDEX_PATH, JSON.stringify(index, null, 2));
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function keychainService(company) {
  return `${KEYCHAIN_SERVICE_PREFIX}-${slugify(company)}`;
}

function keychainAccount(company) {
  return slugify(company);
}

function getKeychainPassword(service, account) {
  try {
    const out = execSync(
      `security find-generic-password -s "${service}" -a "${account}" -w`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
    );
    return out.trim();
  } catch (err) {
    return null;
  }
}

function setKeychainPassword(service, account, password) {
  // security add-generic-password fails if an item already exists, so delete first.
  try {
    execSync(
      `security delete-generic-password -s "${service}" -a "${account}"`,
      { stdio: "ignore" }
    );
  } catch {
    // ignore "item not found"
  }

  execSync(
    `security add-generic-password -s "${service}" -a "${account}" -w "${password}" -U`,
    { stdio: "inherit" }
  );
}

function removeKeychainPassword(service, account) {
  execSync(
    `security delete-generic-password -s "${service}" -a "${account}"`,
    { stdio: "inherit" }
  );
}

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function promptHidden(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    }));
    // Hide typed characters by writing backspace sequences.
    rl.input.on("keypress", () => {
      const len = rl.line.length;
      readline.moveCursor(rl.output, -len, 0);
      readline.clearLine(rl.output, 1);
    });
  });
}

function printUsage() {
  console.log(`job-vault: ATS/portal credential helper

Usage:
  node scripts/job-vault.js list
  node scripts/job-vault.js get "<Company Name>"
  node scripts/job-vault.js set "<Company Name>"
  node scripts/job-vault.js remove "<Company Name>"

Credentials are stored in the macOS Keychain. The index file at
${VAULT_INDEX_PATH} only keeps company names and update timestamps — no
passwords are written to disk.`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "help";
  const company = args[1];

  const index = loadIndex();

  switch (command) {
    case "list": {
      const entries = Object.entries(index);
      if (entries.length === 0) {
        console.log("No stored credentials.");
        return;
      }
      console.log("Stored ATS/portal credentials:");
      for (const [name, meta] of entries) {
        console.log(`  - ${name} (email: ${meta.email}, updated: ${meta.updated_at})`);
      }
      break;
    }

    case "get": {
      if (!company) {
        console.error("Error: company name required");
        process.exit(1);
      }
      const service = keychainService(company);
      const account = keychainAccount(company);
      const password = getKeychainPassword(service, account);
      if (password === null) {
        console.error(`No credentials found for "${company}".`);
        process.exit(1);
      }
      const meta = index[company] || {};
      console.log(JSON.stringify({ email: meta.email, password }, null, 2));
      break;
    }

    case "set": {
      if (!company) {
        console.error("Error: company name required");
        process.exit(1);
      }
      const email = await prompt("Email: ");
      const password = await prompt("Password: ");
      if (!email || !password) {
        console.error("Error: email and password are required");
        process.exit(1);
      }
      const service = keychainService(company);
      const account = keychainAccount(company);
      setKeychainPassword(service, account, password);
      index[company] = {
        email,
        updated_at: new Date().toISOString(),
      };
      saveIndex(index);
      console.log(`Credentials stored for "${company}".`);
      break;
    }

    case "remove": {
      if (!company) {
        console.error("Error: company name required");
        process.exit(1);
      }
      const service = keychainService(company);
      const account = keychainAccount(company);
      removeKeychainPassword(service, account);
      delete index[company];
      saveIndex(index);
      console.log(`Credentials removed for "${company}".`);
      break;
    }

    case "help":
    default:
      printUsage();
      break;
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
