#!/usr/bin/env node
/**
 * Clean up legacy content: replace Squarespace URLs and fix protocol-relative links.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_ROOT = path.join(__dirname, '../src/content');

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

async function main() {
  const files = await findMdFiles(CONTENT_ROOT);
  let totalReplaced = 0;

  // Known Squarespace URL -> internal path mappings
  const SQUARESPACE_REPLACEMENTS = [
    [
      /http:\/\/static1\.squarespace\.com\/static\/56ccbdb3a3360c75e6843e94\/573f18565f21e0f3cf529e16\/573f18585f21e0f3cf529e3c\/1463752792598\/\?format=original/gi,
      '/advertising',
    ],
    [
      /http:\/\/static1\.squarespace\.com\/static\/56ccbdb3a3360c75e6843e94\/573f41e26dc6951d90c43bbf\/573f42016dc6951d90c43d8f\/1463763457975\/\?format=original/gi,
      '/drilling',
    ],
    [
      /http:\/\/static1\.squarespace\.com\/static\/56ccbdb3a3360c75e6843e94\/573f41e26dc6951d90c43bbf\/573f42026dc6951d90c43e02\/1463763458914\/\?format=original/gi,
      '/bsp-news',
    ],
    [
      /http:\/\/static1\.squarespace\.com\/static\/56ccbdb3a3360c75e6843e94\/573f41e26dc6951d90c43bbf\/573f42026dc6951d90c43ded\/1463763458779\/\?format=original/gi,
      '/drilling',
    ],
  ];

  // Replace any remaining static1.squarespace.com in href attributes (dead links)
  const SQUARESPACE_FALLBACK = [
    [/href="http:\/\/static1\.squarespace\.com\/[^"]*"/gi, 'href="/"'],
  ];

  // Fix protocol-relative internal links
  const PROTOCOL_RELATIVE = [
    [/href="\/\/(bsp-news|press|drilling|companies|pages)\//gi, 'href="/$1/'],
  ];

  for (const file of files) {
    let content = await fs.readFile(file, 'utf8');
    const original = content;

    // Apply known replacements
    for (const [pattern, replacement] of SQUARESPACE_REPLACEMENTS) {
      content = content.replace(pattern, replacement);
    }

    // Apply fallback for remaining Squarespace URLs
    for (const [pattern, replacement] of SQUARESPACE_FALLBACK) {
      content = content.replace(pattern, replacement);
    }

    // Fix protocol-relative links
    for (const [pattern, replacement] of PROTOCOL_RELATIVE) {
      content = content.replace(pattern, replacement);
    }

    // Strip Squarespace data attributes (cruft from migration)
    const squarespaceAttrs = [
      'data-animation-role', 'data-animation-override', 'data-stretch',
      'data-src', 'data-image', 'data-image-dimensions', 'data-image-focal-point',
      'data-load', 'data-loader', 'data-system-data-id', 'data-asset-url',
      'data-record-type', 'data-full-url', 'data-item-id', 'data-like-count',
      'elementtiming',
    ];
    for (const attr of squarespaceAttrs) {
      content = content.replace(new RegExp(`\\s+${attr}="[^"]*"`, 'gi'), '');
    }

    if (content !== original) {
      const count = (original.match(/static1\.squarespace\.com|href="\/\/(bsp-news|press|drilling)/g) || []).length;
      totalReplaced += count;
      await fs.writeFile(file, content, 'utf8');
      console.log('Updated:', path.relative(CONTENT_ROOT, file));
    }
  }

  console.log(`\nContent cleanup complete. Files updated.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
