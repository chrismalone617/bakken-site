#!/usr/bin/env node
/**
 * Fix image URLs in content: replace Squarespace URLs with local paths from image-map.
 * Run on existing markdown files in src/content.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_ROOT = path.join(__dirname, '../src/content');
const IMAGE_MAP_PATH = path.join(__dirname, '../src/data/image-map.json');

async function findMdFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...(await findMdFiles(full)));
    } else if (e.name.endsWith('.md')) {
      files.push(full);
    }
  }
  return files;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function main() {
  const mapRaw = await fs.readFile(IMAGE_MAP_PATH, 'utf8');
  const imageMap = JSON.parse(mapRaw);

  // Build base URL (no query) -> local path
  const baseToLocal = new Map();
  for (const [orig, local] of Object.entries(imageMap)) {
    baseToLocal.set(orig.replace(/\?.*$/, ''), local);
  }

  // Sort by base length descending so we match longer URLs first
  const entries = [...baseToLocal.entries()].sort((a, b) => b[0].length - a[0].length);

  const files = await findMdFiles(CONTENT_ROOT);
  let totalReplaced = 0;

  for (const file of files) {
    let content = await fs.readFile(file, 'utf8');
    let changed = false;

    for (const [base, local] of entries) {
      // Match base URL optionally followed by query (?format=100w etc) - until quote, space, or end
      const pattern = escapeRegex(base) + '(?:\\?[^"\'\\s]*)?';
      const re = new RegExp(pattern, 'g');
      const newContent = content.replace(re, local);
      if (newContent !== content) {
        const count = (content.match(re) || []).length;
        totalReplaced += count;
        content = newContent;
        changed = true;
      }
    }

    if (changed) {
      await fs.writeFile(file, content, 'utf8');
    }
  }

  console.log(`Fixed image URLs in ${files.length} files. Total replacements: ${totalReplaced}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
