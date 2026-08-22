#!/usr/bin/env node
/**
 * Lightweight secret-leak / hardcoded-credential detector.
 *
 * Scans tracked files in repo root for:
 *   - Firebase web API keys (AIza... prefix)
 *   - Firebase project IDs that should not be hardcoded
 *   - Hardcoded "2026-08-21" date used as a stand-in for today
 *   - Service-account JSON filenames that should be gitignored
 *
 * Exits 0 if clean, non-zero on any match.
 *
 * Usage:  node functions/scripts/checkLeak.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');

const SCAN_DIRS = ['src', 'scripts', 'functions', 'firestore.rules', 'firebase.json'];
const SKIP_DIRS = ['node_modules', 'dist', '.firebase', '.git', 'coverage'];
const SCAN_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.env', '.rules']);

const PATTERNS = [
  { name: 'Firebase Web API Key', re: /AIza[0-9A-Za-z_-]{35}/, severity: 'HIGH' },
  { name: 'Firebase project id "erp-buildicy" hardcoded', re: /['"`]erp-buildicy['"`]/, severity: 'MEDIUM' },
  { name: 'Hardcoded demo date "2026-08-21"', re: /['"`]2026-08-21['"`]/, severity: 'LOW' },
  {
    name: 'Service-account reference',
    // Match only "service-account*.json" appearing as a real file path or
    // import — not help text or .gitignore entries (those are legitimate).
    re: /(?:require\(|import\s.*from\s*['"`]|setContentFile\(|readFileSync\()\s*['"`].*service-account[_-]?.*\.json/i,
    severity: 'HIGH',
  },
];

function listFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const stat = fs.statSync(dir);
  if (stat.isFile()) {
    out.push(dir);
    return out;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full));
    else if (SCAN_EXTS.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function scanFile(file) {
  const findings = [];
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, idx) => {
    for (const { name, re, severity } of PATTERNS) {
      if (re.test(line)) {
        findings.push({ file, line: idx + 1, severity, name, text: line.trim() });
      }
    }
  });
  return findings;
}

function gitTracked() {
  try {
    return execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' })
      .split('\n')
      .filter(Boolean)
      .map(rel => path.resolve(ROOT, rel));
  } catch {
    return [];
  }
}

(function main() {
  const allFiles = new Set();
  for (const target of SCAN_DIRS) {
    for (const f of listFiles(path.resolve(ROOT, target))) allFiles.add(f);
  }
  // Also include anything git-tracked that we might have missed.
  for (const f of gitTracked()) {
    if (SKIP_DIRS.some(skip => f.includes(`${path.sep}${skip}${path.sep}`))) continue;
    if (SCAN_EXTS.has(path.extname(f))) allFiles.add(f);
  }

  // Filter out self-references in the detector itself, and the .gitignore
  // entry that legitimately names service-account*.json to keep it out of
  // version control.
  const SELF_FILE = path.resolve(__filename);
  const findings = [];
  for (const file of allFiles) {
    if (path.resolve(file) === SELF_FILE) continue;
    findings.push(...scanFile(file));
  }

  if (findings.length === 0) {
    console.log('OK - no leaks detected.');
    process.exit(0);
  }

  console.error(`Found ${findings.length} potential leak(s):\n`);
  for (const f of findings) {
    console.error(`  [${f.severity}] ${f.name}`);
    console.error(`    ${path.relative(ROOT, f.file)}:${f.line}`);
    console.error(`    > ${f.text}\n`);
  }
  process.exit(1);
})();