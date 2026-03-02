#!/usr/bin/env node
/** Remove duplicate consecutive figure blocks from news posts */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, '../src/content/bsp-news/news');

const dupPattern = /(<figure class="mb-8 -mx-6 md:mx-0">\s*\n\s*<img src="\/images\/unsplash-[^"]+"[^>]*\/>\s*\n\s*<\/figure>)\s*\n\s*\1/g;

async function main() {
  const files = await fs.readdir(CONTENT_DIR);
  for (const f of files.filter((x) => x.endsWith('.md'))) {
    const fp = path.join(CONTENT_DIR, f);
    let content = await fs.readFile(fp, 'utf8');
    const before = content;
    content = content.replace(dupPattern, '$1');
    if (content !== before) {
      await fs.writeFile(fp, content);
      console.log('Fixed:', f);
    }
  }
  console.log('Done.');
}

main().catch(console.error);
