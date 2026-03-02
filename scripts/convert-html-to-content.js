#!/usr/bin/env node
/**
 * Convert scraped HTML to src/content/*.md (folder structure)
 * Run after download-images.js
 * Output: src/content/{section}/{contentType}/{slug}.md or src/content/pages/{slug}.md for flat files
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRAPED_DIR = path.resolve(process.env.SCRAPED_DIR || path.join(__dirname, '../../scraped'));
const CONTENT_ROOT = path.join(__dirname, '../src/content');
const IMAGE_MAP_PATH = path.join(__dirname, '../src/data/image-map.json');

let imageMap = {};

/** Maps scraped filename (without .html) to output path relative to CONTENT_ROOT */
function getOutputPath(filename) {
  const base = filename.replace(/\.html$/i, '');
  const parts = base.split('__');
  if (parts.length < 2) {
    return path.join('pages', `${base}.md`);
  }
  const section = parts[0];
  const contentType = parts[1];
  const rest = parts.slice(2).join('__');
  const slug = rest || contentType;
  return path.join(section, contentType, `${slug}.md`);
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  if (m) return m[1].replace(/\s*—\s*Bakken Shale Play\s*$/i, '').trim();
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  if (og) return og[1].trim();
  return 'Untitled';
}

function extractDescription(html) {
  const meta = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
  if (meta && meta[1]) return meta[1].trim();
  const og = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  if (og) return og[1].trim();
  return '';
}

function extractMainContent(html) {
  // Remove head and scripts
  let body = html.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
  body = body.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  body = body.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  body = body.replace(/<!--[\s\S]*?-->/g, '');

  // Find main content - Squarespace uses various wrappers
  const mainMatch = body.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
    || body.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
    || body.match(/<div[^>]+class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  const raw = mainMatch ? mainMatch[1] : body.replace(/<body[^>]*>|<\/body>/gi, '');

  // Strip data-* attributes (Brizzy/Squarespace cruft)
  let cleaned = raw
    .replace(/\s+data-brz-[^=]+="[^"]*"/g, '')
    .replace(/\s+data-uniq-id="[^"]*"/g, '')
    .replace(/\s+data-generated-css="[^"]*"/g, '')
    .replace(/\s+id="[^"]*"/g, '')
    .replace(/\s+style="[^"]*"/g, '')
    .replace(/\s+class="[^"]*"/g, '');

  // Replace image URLs with local paths (base URL + optional query)
  const baseToLocal = new Map();
  for (const [orig, local] of Object.entries(imageMap)) {
    baseToLocal.set(orig.replace(/\?.*$/, ''), local);
  }
  const entries = [...baseToLocal.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [base, local] of entries) {
    const esc = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(esc + '(?:\\?[^"\'\\s]*)?', 'g');
    cleaned = cleaned.replace(re, local);
  }

  // Convert internal links: /path/to/page -> /path/to/page (no .html)
  cleaned = cleaned.replace(/href=["'](https?:\/\/www\.bakkenshale\.com)?(\/[^"']+?)\.html(["'])/gi, 'href="$2$3');

  return cleaned.trim();
}

function escapeYaml(str) {
  if (!str) return '';
  return str.replace(/"/g, '\\"').replace(/\n/g, ' ');
}

async function main() {
  const mapRaw = await fs.readFile(IMAGE_MAP_PATH, 'utf8').catch(() => '{}');
  imageMap = JSON.parse(mapRaw);

  const files = await fs.readdir(SCRAPED_DIR);
  const htmlFiles = files.filter((f) => f.endsWith('.html'));

  let count = 0;
  for (const f of htmlFiles) {
    const html = await fs.readFile(path.join(SCRAPED_DIR, f), 'utf8');
    const relPath = getOutputPath(f);
    const dest = path.join(CONTENT_ROOT, relPath);
    const destDir = path.dirname(dest);

    const title = extractTitle(html);
    const description = extractDescription(html) || title;
    const content = extractMainContent(html);

    const frontmatter = `---
title: "${escapeYaml(title)}"
description: "${escapeYaml(description)}"
---

`;
    const body = content ? `<div class="content-body">\n${content}\n</div>` : '';
    const md = frontmatter + body;

    await fs.mkdir(destDir, { recursive: true });
    await fs.writeFile(dest, md, 'utf8');
    count++;
    if (count % 100 === 0) process.stdout.write(`.`);
  }

  console.log(`\nConverted ${count} pages to ${CONTENT_ROOT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
