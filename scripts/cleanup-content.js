#!/usr/bin/env node
/**
 * Content cleanup script:
 * 1. Removes Squarespace share widget spans (data-system-data-id, data-asset-url)
 * 2. Replaces http://bakkenshale.com and https://bakkenshale.com with / for internal links
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const CONTENT_DIR = join(process.cwd(), 'src', 'content');

function getAllMdFiles(dir, files = []) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      getAllMdFiles(full, files);
    } else if (e.name.endsWith('.md')) {
      files.push(full);
    }
  }
  return files;
}

// Squarespace share span - match by unique ending (Share</div></div><div><div></div></div></div></div></span>)
const SQUARESPACE_SPAN = /<span\s+[^>]*data-system-data-id[^>]*data-asset-url[^>]*>[\s\S]*?Share<\/div><\/div><div><div><\/div><\/div><\/div><\/div><\/span>/g;

function removeSquarespaceSpans(content) {
  return content.replace(SQUARESPACE_SPAN, '');
}

function fixBakkenshaleLinks(content) {
  return content
    .replace(/http:\/\/bakkenshale\.com/g, '')
    .replace(/https:\/\/bakkenshale\.com/g, '')
    .replace(/href="\/\/([a-zA-Z0-9/-]+)"/g, 'href="/$1"'); // fix protocol-relative paths
}

const files = getAllMdFiles(CONTENT_DIR);
let squarespaceRemoved = 0;
let linksFixed = 0;

for (const file of files) {
  const original = readFileSync(file, 'utf8');
  let content = original;

  const beforeSquarespace = content;
  content = removeSquarespaceSpans(content);
  if (content !== beforeSquarespace) squarespaceRemoved++;

  const beforeLinks = content;
  content = fixBakkenshaleLinks(content);
  if (content !== beforeLinks) linksFixed++;

  if (content !== original) {
    writeFileSync(file, content);
    console.log('Updated:', file.replace(process.cwd(), '.'));
  }
}

console.log(`\nDone. Squarespace spans removed from ${squarespaceRemoved} files, bakkenshale links fixed in ${linksFixed} files.`);
