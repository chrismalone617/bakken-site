#!/usr/bin/env node
/**
 * One-time migration: move files from src/content/pages/*.md
 * into folder structure: section/contentType/slug.md or pages/slug.md
 *
 * Rule: section__contentType__rest → section/contentType/rest.md
 *       Flat files (no __) → pages/filename.md
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGES_DIR = path.join(__dirname, '../src/content/pages');
const CONTENT_ROOT = path.join(__dirname, '../src/content');

function getNewPath(filename) {
  const base = filename.replace(/\.md$/i, '');
  const parts = base.split('__');
  if (parts.length < 2) {
    return path.join('pages', filename);
  }
  const section = parts[0];
  const contentType = parts[1];
  const rest = parts.slice(2).join('__');
  const slug = rest || contentType;
  return path.join(section, contentType, `${slug}.md`);
}

async function main() {
  const files = await fs.readdir(PAGES_DIR);
  const mdFiles = files.filter((f) => f.endsWith('.md'));

  let moved = 0;
  let skipped = 0;

  for (const f of mdFiles) {
    const src = path.join(PAGES_DIR, f);
    const rel = getNewPath(f);
    const dest = path.join(CONTENT_ROOT, rel);
    const destDir = path.dirname(dest);

    if (path.resolve(src) === path.resolve(dest)) {
      skipped++;
      continue;
    }

    await fs.mkdir(destDir, { recursive: true });
    try {
      await fs.rename(src, dest);
      moved++;
      if (moved % 100 === 0) process.stdout.write('.');
    } catch (err) {
      if (err.code === 'ENOENT') {
        skipped++;
      } else {
        throw err;
      }
    }
  }

  console.log(`\nMoved ${moved} files. Skipped ${skipped}.`);

  const remaining = await fs.readdir(PAGES_DIR).catch(() => []);
  if (remaining.length === 0) {
    await fs.rmdir(PAGES_DIR);
    console.log('Removed empty pages/ directory.');
  } else {
    console.log(`Warning: ${remaining.length} files remain in pages/`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
