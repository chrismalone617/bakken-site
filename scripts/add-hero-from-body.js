#!/usr/bin/env node
/**
 * Add heroImage to all News posts that lack it, using the first image from the post body.
 * Run: node scripts/add-hero-from-body.js
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, '../src/content/bsp-news/news');

const FIRST_IMAGE_RE = /<img[^>]+src="([^"]+)"/;

function hasHeroImage(content) {
  return /^heroImage:\s*.+$/m.test(content);
}

async function main() {
  const files = await fs.readdir(CONTENT_DIR);
  const mdFiles = files.filter((f) => f.endsWith('.md'));

  let added = 0;
  let skipped = 0;
  let noImage = 0;

  for (const f of mdFiles) {
    const fp = path.join(CONTENT_DIR, f);
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
    if (added <= 10 || added % 50 === 0) {
      console.log(`  ${f}: ${imgSrc}`);
    }
  }

  console.log(`\nDone. Added: ${added}, Already had heroImage: ${skipped}, No image in body: ${noImage}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
