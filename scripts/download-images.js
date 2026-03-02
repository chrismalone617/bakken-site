#!/usr/bin/env node
/**
 * Download images from scraped HTML files.
 * Run before convert-html-to-content.js.
 * Output: public/images/, src/data/image-map.json
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRAPED_DIR = path.resolve(process.env.SCRAPED_DIR || path.join(__dirname, '../../scraped'));
const IMAGES_DIR = path.join(__dirname, '../public/images');
const IMAGE_MAP_PATH = path.join(__dirname, '../src/data/image-map.json');

// Extract image URLs from HTML
const IMG_SRC_RE = /<img[^>]+src=["']([^"']+)["']/gi;
const SRCSET_RE = /<source[^>]+srcset=["']([^"']+)["']/gi;
const BG_URL_RE = /background-image:\s*url\(["']?([^"')]+)["']?\)/gi;

function extractImageUrls(html) {
  const urls = new Set();
  for (const re of [IMG_SRC_RE, SRCSET_RE, BG_URL_RE]) {
    let m;
    while ((m = re.exec(html)) !== null) {
      let url = m[1].trim();
      // srcset can have "url 1x, url2 2x" - take first URL
      if (url.includes(',')) url = url.split(',')[0].trim().split(/\s+/)[0];
      if (!url || url.startsWith('data:') || url.startsWith('#')) continue;
      if (url.startsWith('//')) url = 'https:' + url;
      if (url.startsWith('/')) url = 'https://www.bakkenshale.com' + url;
      if (url.startsWith('http')) urls.add(url);
    }
  }
  return [...urls];
}

function urlToFilename(url) {
  const hash = createHash('sha256').update(url).digest('hex').slice(0, 12);
  const ext = path.extname(new URL(url).pathname) || '.jpg';
  const safeExt = /^\.(jpe?g|png|gif|webp|svg)$/i.test(ext) ? ext : '.jpg';
  return hash + safeExt;
}

async function downloadImage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BakkenImageDownload/1.0)' },
      redirect: 'follow',
    });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function main() {
  const files = await fs.readdir(SCRAPED_DIR);
  const htmlFiles = files.filter((f) => f.endsWith('.html'));

  const allUrls = new Set();
  for (const f of htmlFiles) {
    const html = await fs.readFile(path.join(SCRAPED_DIR, f), 'utf8');
    for (const u of extractImageUrls(html)) allUrls.add(u);
  }

  await fs.mkdir(IMAGES_DIR, { recursive: true });
  await fs.mkdir(path.dirname(IMAGE_MAP_PATH), { recursive: true });

  const imageMap = {};
  let downloaded = 0;
  let failed = 0;

  for (const url of allUrls) {
    const buf = await downloadImage(url);
    if (!buf) {
      failed++;
      continue;
    }
    const filename = urlToFilename(url);
    const localPath = `/images/${filename}`;
    await fs.writeFile(path.join(IMAGES_DIR, filename), buf);
    imageMap[url] = localPath;
    downloaded++;
    if (downloaded % 50 === 0) process.stdout.write(`.`);
  }

  await fs.writeFile(IMAGE_MAP_PATH, JSON.stringify(imageMap, null, 2), 'utf8');
  console.log(`\nDownloaded ${downloaded} images, ${failed} failed.`);
  console.log(`Image map: ${IMAGE_MAP_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
