#!/usr/bin/env node
/**
 * Add heroImage to all posts across all categories that lack it, using the first image from the post body.
 * Run: node scripts/add-hero-all-categories.js
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_BASE = path.join(__dirname, '../src/content');

const CONTENT_DIRS = [
  'bsp-news/news',
  'press/press-releases',
  'pmn/pipeline-midstream-news',
  'bsp-jobs/jobs-news',
  'drilling/drilling-rig-count',
  'bsp-jobs/drilling-rig-count',
  'pmn/drilling-rig-count',
  'events-list/news',
];

const FIRST_IMAGE_RE = /<img[^>]+src="([^"]+)"/;

function hasHeroImage(content) {
  return /^heroImage:\s*.+$/m.test(content);
}

async function processDir(relPath) {
  const dir = path.join(CONTENT_BASE, relPath);
  let exists = true;
  try {
    await fs.access(dir);
  } catch {
    exists = false;
  }
  if (!exists) return { added: 0, skipped: 0, noImage: 0 };

  const files = await fs.readdir(dir);
  const mdFiles = files.filter((f) => f.endsWith('.md'));

  let added = 0;
  let skipped = 0;
  let noImage = 0;

  for (const f of mdFiles) {
    const fp = path.join(dir, f);
    let content = await fs.readFile(fp, 'utf8');

    if (hasHeroImage(content)) {
      skipped++;
      continue;
    }

    const fmEnd = content.indexOf('---', 3);
    if (fmEnd === -1) continue;
    const body = content.slice(fmEnd + 3);
    const imgMatch = body.match(FIRST_IMAGE_RE);
    if (!imgMatch) {
      noImage++;
      continue;
    }

    const imgSrc = imgMatch[1];
    const closingPattern = /\n---\r?\n?$/;
    const fm = content.slice(0, fmEnd + 3);
    if (!fm.includes('---\n')) continue;
    const newFm = fm.replace(closingPattern, `\nheroImage: "${imgSrc}"\n---\n`);
    const newContent = newFm + content.slice(fm.length);
    await fs.writeFile(fp, newContent);
    added++;
  }

  return { added, skipped, noImage };
}

async function main() {
  let totalAdded = 0;
  let totalSkipped = 0;
  let totalNoImage = 0;

  for (const relPath of CONTENT_DIRS) {
    const { added, skipped, noImage } = await processDir(relPath);
    totalAdded += added;
    totalSkipped += skipped;
    totalNoImage += noImage;
    if (added > 0 || skipped > 0 || noImage > 0) {
      console.log(`${relPath}: added=${added}, skipped=${skipped}, noImage=${noImage}`);
    }
  }

  console.log(`\nTotal: added=${totalAdded}, skipped=${totalSkipped}, noImage=${totalNoImage}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
