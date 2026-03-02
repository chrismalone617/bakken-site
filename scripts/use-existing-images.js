#!/usr/bin/env node
/**
 * Replace Unsplash heroImages with the first existing image from each post body.
 * - Removes the figure block we added (unsplash image at top)
 * - Updates heroImage in frontmatter to use the first image already in the post
 * - Deletes unsplash-*.jpg files from public/images/
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, '../src/content/bsp-news/news');
const PUBLIC_IMAGES = path.join(__dirname, '../public/images');

const UNSPLASH_FIGURE_RE = /\s*<figure class="mb-8 -mx-6 md:mx-0">\s*\n\s*<img src="\/images\/unsplash-[^"]+"[^>]*\/>\s*\n\s*<\/figure>\s*\n?/g;
const FIRST_IMAGE_RE = /src="(\/images\/(?!unsplash-)[^"]+)"/;

async function main() {
  const files = await fs.readdir(CONTENT_DIR);
  const toProcess = files.filter((f) => f.endsWith('.md'));

  const unsplashFiles = new Set();

  for (const f of toProcess) {
    const fp = path.join(CONTENT_DIR, f);
    let content = await fs.readFile(fp, 'utf8');

    if (!content.includes('heroImage: "/images/unsplash-')) continue;

    const unsplashMatch = content.match(/heroImage: "\/images\/(unsplash-[^"]+)"/);
    if (unsplashMatch) unsplashFiles.add(unsplashMatch[1]);

    const bodyStart = content.indexOf('---', 3) + 3;
    const body = content.slice(bodyStart);
    const imgMatch = body.match(FIRST_IMAGE_RE);
    if (!imgMatch) {
      console.log(`  ${f}: No existing image found, removing heroImage`);
      content = content.replace(/\nheroImage: "\/images\/unsplash-[^"]+"\n/, '\n');
    } else {
      const existingImg = imgMatch[1];
      content = content.replace(/heroImage: "\/images\/unsplash-[^"]+"/, `heroImage: "${existingImg}"`);
      console.log(`  ${f}: ${existingImg}`);
    }

    content = content.replace(UNSPLASH_FIGURE_RE, '');
    await fs.writeFile(fp, content);
  }

  for (const name of unsplashFiles) {
    const fp = path.join(PUBLIC_IMAGES, name);
    try {
      await fs.unlink(fp);
      console.log(`  Deleted ${name}`);
    } catch (e) {
      if (e.code !== 'ENOENT') console.error(`  Failed to delete ${name}:`, e.message);
    }
  }

  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
