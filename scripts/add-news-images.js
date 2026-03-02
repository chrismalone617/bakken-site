#!/usr/bin/env node
/**
 * Add featured images to the 20 newest News (bsp-news/news) posts using Unsplash API.
 * - Adds heroImage to frontmatter (for hero/featured)
 * - Inserts image at top of post body
 * Run: node scripts/add-news-images.js
 * Requires: UNSPLASH_ACCESS_KEY in .env
 */

import fs from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, '../src/content/bsp-news/news');
const PUBLIC_IMAGES = path.join(__dirname, '../public/images');

const LIMIT = 20;

function loadEnv() {
  try {
    const envPath = path.join(__dirname, '../.env');
    const raw = readFileSync(envPath, 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim();
    }
  } catch {}
}

function extractPubDate(content) {
  const fmMatch = content.match(/^---\n[\s\S]*?^pubDate:\s*(.+?)\s*$/m);
  if (fmMatch) return new Date(fmMatch[1].trim());
  const dtMatch = content.match(/datetime=["'](\d{4}-\d{2}-\d{2})["']/);
  if (dtMatch) return new Date(dtMatch[1]);
  return null;
}

function hasHeroImage(content) {
  return /^heroImage:\s*.+$/m.test(content);
}

function titleToQuery(title) {
  const t = (title || '').toLowerCase();
  const terms = ['oil', 'gas', 'drilling', 'bakken', 'north dakota', 'energy', 'rig', 'pipeline'];
  const found = terms.filter((term) => t.includes(term));
  if (found.length > 0) return found.slice(0, 2).join(' ');
  const words = t.replace(/[^\w\s]/g, '').split(/\s+/).filter((w) => w.length > 3).slice(0, 2);
  return words.join(' ') || 'oil gas energy';
}

async function searchUnsplash(query, accessKey) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${accessKey}` },
  });
  if (!res.ok) throw new Error(`Unsplash API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const photo = data.results?.[0];
  if (!photo) return null;
  return photo.urls?.regular || photo.urls?.full;
}

async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(destPath, buf);
}

async function main() {
  loadEnv();
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    console.error('Missing UNSPLASH_ACCESS_KEY in .env');
    process.exit(1);
  }

  const files = await fs.readdir(CONTENT_DIR);
  const mdFiles = files.filter((f) => f.endsWith('.md'));

  const posts = [];
  for (const f of mdFiles) {
    const filePath = path.join(CONTENT_DIR, f);
    const content = await fs.readFile(filePath, 'utf8');
    const titleMatch = content.match(/^title:\s*["'](.+?)["']/m);
    const title = titleMatch ? titleMatch[1].replace(/\\"/g, '"') : '';
    const pubDate = extractPubDate(content);
    const hasHero = hasHeroImage(content);
    posts.push({ file: f, filePath, content, title, pubDate, hasHero });
  }

  const withDate = posts.filter((p) => p.pubDate);
  withDate.sort((a, b) => (b.pubDate?.getTime() ?? 0) - (a.pubDate?.getTime() ?? 0));
  const toProcess = withDate.slice(0, LIMIT).filter((p) => !p.hasHero);

  if (toProcess.length === 0) {
    console.log('No posts to process (all have heroImage or no pubDate).');
    return;
  }

  console.log(`Processing ${toProcess.length} posts...`);

  for (const post of toProcess) {
    const slug = path.basename(post.file, '.md');
    const query = titleToQuery(post.title);
    console.log(`  ${slug}: "${query}"`);

    try {
      const fallbacks = [query, 'oil drilling north dakota', 'oil rig', 'energy landscape'];
      let imageUrl = null;
      for (const q of fallbacks) {
        imageUrl = await searchUnsplash(q, accessKey);
        if (imageUrl) break;
        if (q !== query) console.log(`    Fallback "${q}"`);
      }
      if (!imageUrl) {
        console.log(`    Skipping - no image found`);
        continue;
      }

      const ext = 'jpg';
      const imgFilename = `unsplash-${slug}.${ext}`.replace(/[^a-zA-Z0-9._-]/g, '_');
      const imgPath = path.join(PUBLIC_IMAGES, imgFilename);
      const imgSrc = `/images/${imgFilename}`;

      await downloadImage(imageUrl, imgPath);

      let newContent = post.content;
      const fmEnd = newContent.indexOf('---', 3);
      if (fmEnd === -1) continue;
      const fm = newContent.slice(0, fmEnd + 3);
      let body = newContent.slice(fmEnd + 3);

      let newFm = fm;
      const closingPattern = /\n---\r?\n?$/;
      if (!/^pubDate:\s/m.test(fm)) {
        const dateStr = post.pubDate ? post.pubDate.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
        newFm = newFm.replace(closingPattern, `\npubDate: ${dateStr}\n---\n`);
      }
      newFm = newFm.replace(closingPattern, `\nheroImage: "${imgSrc}"\n---\n`);

      const imgBlock = `
    <figure class="mb-8 -mx-6 md:mx-0">
      <img src="${imgSrc}" alt="${post.title.replace(/"/g, '&quot;')}" class="w-full rounded-2xl object-cover" loading="eager" />
    </figure>
`;
      const alreadyHasImg = body.includes(`unsplash-${slug}`);
      if (!alreadyHasImg) {
        const bodyStart = body.indexOf('<div class="content-body">');
        if (bodyStart !== -1) {
          const insertAt = body.indexOf('>', bodyStart) + 1;
          body = body.slice(0, insertAt) + imgBlock + body.slice(insertAt);
        } else {
          body = imgBlock + body;
        }
      }

      await fs.writeFile(post.filePath, newFm + body);
      console.log(`    Added ${imgSrc}`);
    } catch (err) {
      console.error(`    Error: ${err.message}`);
    }

    await new Promise((r) => setTimeout(r, 350));
  }

  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
