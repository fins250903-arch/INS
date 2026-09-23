#!/usr/bin/env node
/**
 * Workers Builds' default deploy command is a bare `npx wrangler deploy`.
 * Wrangler then runs `wrangler.jsonc` → `build.command` (this script) and afterwards
 * requires the `main` field to exist as a file on disk.
 *
 * Astro's Cloudflare adapter must keep `main` as the package export
 * `@astrojs/cloudflare/entrypoints/server` (Vite resolves that; a `dist/...` path
 * does not exist yet when `astro build` starts). After the build we copy the
 * generated Worker to the path wrangler resolves from that export:
 *   <repo>/@astrojs/cloudflare/entrypoints/server.js
 */
import { spawnSync } from 'node:child_process';
import { cpSync, copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');

if (process.env.SKIP_CF_BUILD !== '1') {
  const build = spawnSync('npm', ['run', 'build'], {
    cwd: root,
    stdio: 'inherit',
    shell: true
  });
  if (build.status !== 0) {
    process.exit(build.status ?? 1);
  }
}

const generatedDir = join(root, 'dist', 'server');
const generatedEntry = join(generatedDir, 'entry.mjs');
const wranglerDir = join(root, '@astrojs', 'cloudflare', 'entrypoints');
const wranglerEntry = join(wranglerDir, 'server.js');
try {
  rmSync(wranglerDir, { recursive: true, force: true });
  mkdirSync(wranglerDir, { recursive: true });
  cpSync(generatedDir, wranglerDir, { recursive: true });
  copyFileSync(generatedEntry, wranglerEntry);
} catch (error) {
  console.error(`Expected ${generatedEntry} after the Astro build.`);
  throw error;
}
