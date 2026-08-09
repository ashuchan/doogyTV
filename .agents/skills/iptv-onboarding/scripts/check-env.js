#!/usr/bin/env node

/**
 * Environment Check Script for doggyTV
 * Checks Node version, dependencies, and project setup readiness.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\x1b[36m%s\x1b[0m', '=== doggyTV - Environment Check ===\n');

let errors = 0;
let warnings = 0;

// 1. Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);
if (majorVersion >= 18) {
  console.log(`\x1b[32m✔\x1b[0m Node.js version: ${nodeVersion} (Recommended >= 18)`);
} else {
  console.log(`\x1b[31m✖\x1b[0m Node.js version: ${nodeVersion}. Please upgrade to Node.js 18 or higher.`);
  errors++;
}

// 2. Check package.json & root directory
let rootDir = process.cwd();
if (!fs.existsSync(path.join(rootDir, 'package.json'))) {
  rootDir = path.resolve(__dirname, '../../../../');
}
const packageJsonPath = path.join(rootDir, 'package.json');

if (fs.existsSync(packageJsonPath)) {
  console.log(`\x1b[32m✔\x1b[0m package.json found at project root`);
} else {
  console.log(`\x1b[31m✖\x1b[0m package.json not found! Expected at ${packageJsonPath}`);
  errors++;
}

// 3. Check node_modules
const nodeModulesPath = path.join(rootDir, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log(`\x1b[32m✔\x1b[0m node_modules directory exists`);
} else {
  console.log(`\x1b[33m! node_modules directory missing. Run 'npm install' before starting.\x1b[0m`);
  warnings++;
}

// 4. Check Expo CLI capability
try {
  const expoVersion = execSync('npx expo --version', { cwd: rootDir, stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
  console.log(`\x1b[32m✔\x1b[0m Expo CLI available: v${expoVersion}`);
} catch (e) {
  console.log(`\x1b[33m! Could not execute 'npx expo'. Ensure dependencies are installed via 'npm install'.\x1b[0m`);
  warnings++;
}

// 5. Summary
console.log('\n--- Summary ---');
if (errors === 0 && warnings === 0) {
  console.log('\x1b[32m%s\x1b[0m', 'Your environment is fully prepared for local development!');
  console.log('Run \x1b[36mnpm run web\x1b[0m to launch the app on your local web browser.');
} else if (errors === 0) {
  console.log('\x1b[33m%s\x1b[0m', `Ready with ${warnings} warning(s). Please run 'npm install' if you haven't yet.`);
} else {
  console.log('\x1b[31m%s\x1b[0m', `Environment check failed with ${errors} error(s). Please fix the issues above.`);
  process.exit(1);
}
