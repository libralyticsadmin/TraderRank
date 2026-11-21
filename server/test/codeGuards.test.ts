/**
 * Code guards — block CI on patterns that caused the 2026-11-21 broker incident.
 * See CLAUDE.md and docs/prompts/broker-connection-hardening.md.
 * Do not weaken these to make CI pass; fix the code instead.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '../src');

function listTs(dir: string): string[] {
  return fs.readdirSync(dir).flatMap(name => {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) return listTs(p);
    return p.endsWith('.ts') ? [p] : [];
  });
}

const files = listTs(SRC).map(file => ({
  file: path.relative(SRC, file),
  lines: fs.readFileSync(file, 'utf8').split('\n'),
}));

const isComment = (line: string) => /^\s*(\/\/|\*|\/\*)/.test(line);

const REPO_ROOT = path.resolve(here, '../..');
const CLIENT_SRC = path.resolve(REPO_ROOT, 'client/src');
const SCRIPTS_DIR = path.resolve(REPO_ROOT, 'scripts');

function listSources(dir: string, exts: string[]): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).flatMap(name => {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) return listSources(p, exts);
    return exts.some(e => p.endsWith(e)) ? [p] : [];
  });
}

// Identity hard-coding (CLAUDE.md "Identity and accounts"): legacy logins, userIds and
// usernames, plus MetaApi account ids (UUIDs). Comments are scanned too.
const LEGACY_LOGINS = /\b(342186831|411407722|72423906)\b/;
const LEGACY_NAMES = /zzzemzzz|homiesplant|homeisplant|homies|emanuel/i;
const UUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;

describe('Code guards', () => {
  it('every outbound fetch() has a timeout signal', () => {
    const violations: string[] = [];
    for (const { file, lines } of files) {
      lines.forEach((line, i) => {
        if (!/\bfetch\(/.test(line) || isComment(line)) return;
        if (/guard:allow-no-timeout\s+\S+/.test(lines[i - 1] || '')) return;
        const window = lines.slice(i, i + 30).join('\n');
        const end = window.search(/\}\s*\)\s*[;.]|\)\s*\.catch|\)\s*;/);
        const call = end >= 0 ? window.slice(0, end + 3) : window;
        if (!/signal/.test(call)) violations.push(`${file}:${i + 1}  ${line.trim()}`);
      });
    }
    expect(violations, `fetch() without AbortSignal timeout:\n${violations.join('\n')}`).toEqual([]);
  });

  it('no placeholder money values outside simulation-only code', () => {
    const PLACEHOLDER = /\b(10000|10420(\.50?)?|3817|1500000|1542050|1464000|15450|15820(\.75)?)\b/;
    const MONEY_CONTEXT = /(balance|equity|margin|freeMargin)\s*[:=]|\?\?|\|\|/i;
    const SIMULATION_FILES = new Set([path.join('workers', 'marketSimulator.ts')]);
    const violations: string[] = [];
    for (const { file, lines } of files) {
      if (SIMULATION_FILES.has(file)) continue;
      lines.forEach((line, i) => {
        if (isComment(line) || !PLACEHOLDER.test(line) || !MONEY_CONTEXT.test(line)) return;
        // Non-money numeric options (timeouts, intervals) are fine
        if (/(ms|Ms|interval|Interval|timeout|Timeout|limit|Limit)\b/.test(line)) return;
        const preceding = lines.slice(Math.max(0, i - 40), i).join('\n');
        if (/guard:simulation-only/.test(preceding)) return;
        violations.push(`${file}:${i + 1}  ${line.trim()}`);
      });
    }
    expect(violations, `Placeholder money values in live code:\n${violations.join('\n')}`).toEqual([]);
  });

  it('no hard-coded logins, userIds, usernames or MetaApi account ids in server code', () => {
    // Explicit allow-list: the one-off legacy identity migration and its CLI wrapper are the only
    // places allowed to name these accounts (they write them into the persisted stores).
    // Paths are relative to the repo root. Do not add generic code paths here; use data instead.
    const ALLOW = new Set([
      path.join('server', 'src', 'services', 'legacyIdentityMigration.ts'),
      path.join('scripts', 'migrate-legacy-identities.ts'),
    ]);
    const targets = [...listSources(SRC, ['.ts']), ...listSources(SCRIPTS_DIR, ['.ts', '.js'])];
    const violations: string[] = [];
    for (const abs of targets) {
      const rel = path.relative(REPO_ROOT, abs);
      if (ALLOW.has(rel)) continue;
      fs.readFileSync(abs, 'utf8').split('\n').forEach((line, i) => {
        if (LEGACY_LOGINS.test(line) || LEGACY_NAMES.test(line) || UUID.test(line)) {
          violations.push(`${rel}:${i + 1}  ${line.trim().slice(0, 160)}`);
        }
      });
    }
    expect(violations, `Hard-coded identity in server code:\n${violations.join('\n')}`).toEqual([]);
  });

  it('no hard-coded logins, userIds or usernames in client code', () => {
    const violations: string[] = [];
    for (const abs of listSources(CLIENT_SRC, ['.ts', '.tsx'])) {
      const rel = path.relative(REPO_ROOT, abs);
      fs.readFileSync(abs, 'utf8').split('\n').forEach((line, i) => {
        if (LEGACY_LOGINS.test(line) || LEGACY_NAMES.test(line)) {
          violations.push(`${rel}:${i + 1}  ${line.trim().slice(0, 160)}`);
        }
      });
    }
    expect(violations, `Hard-coded identity in client code:\n${violations.join('\n')}`).toEqual([]);
  });
});
