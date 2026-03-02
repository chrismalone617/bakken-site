#!/usr/bin/env node
/**
 * Test EIA API v2 endpoints for WTI and natural gas prices.
 * Run: node scripts/test-eia-api.js
 * Requires EIA_API_KEY in .env or environment.
 * EIA limits: 9000 req/hour, 5 req/sec.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env');

let eiaKey = process.env.EIA_API_KEY;
if (!eiaKey && existsSync(envPath)) {
  const env = readFileSync(envPath, 'utf-8');
  const m = env.match(/EIA_API_KEY=(.+)/);
  if (m) eiaKey = m[1].trim();
}

if (!eiaKey) {
  console.error('No EIA_API_KEY found in .env or environment');
  process.exit(1);
}

console.log('Testing EIA API v2 (30s timeout per request)...\n');

// Build URL with proper encoding (brackets can cause issues in some clients)
function buildUrl(path, params) {
  const base = `https://api.eia.gov/v2/${path}`;
  const search = new URLSearchParams(params).toString();
  return `${base}?${search}`;
}

const tests = [
  ['Smoke test (metadata, no /data)', buildUrl('petroleum/pri/spt', { api_key: eiaKey })],
  ['WTI (petroleum/pri/spt)', buildUrl('petroleum/pri/spt/data/', {
    api_key: eiaKey,
    'data[0]': 'value',
    frequency: 'daily',
    'facets[series][]': 'RWTC',
    'sort[0][column]': 'period',
    'sort[0][direction]': 'desc',
    length: '1',
  })],
  ['Nat gas (natural-gas/pri/fut duoarea=RGC)', buildUrl('natural-gas/pri/fut/data/', {
    api_key: eiaKey,
    'data[0]': 'value',
    frequency: 'daily',
    'facets[duoarea][]': 'RGC',
    'sort[0][column]': 'period',
    'sort[0][direction]': 'desc',
    length: '1',
  })],
  ['WTI (seriesid, no /data)', buildUrl('seriesid/PET.RWTC.D', { api_key: eiaKey })],
];

function testWithHttps(url) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const opts = { hostname: u.hostname, path: u.pathname + u.search, method: 'GET' };
    const req = https.request(opts, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          const val = json?.response?.data?.[0]?.value ?? json?.response?.id;
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, value: val, error: json?.error });
        } catch {
          const snippet = body.slice(0, 600).replace(/\s+/g, ' ').trim();
          resolve({ ok: false, status: res.statusCode, error: `HTML (${res.statusCode})`, body: snippet });
        }
      });
    });
    req.on('error', (e) => resolve({ ok: false, status: null, error: e.message }));
    req.setTimeout(30000, () => { req.destroy(); resolve({ ok: false, status: null, error: 'timeout' }); });
    req.end();
  });
}

for (const [label, url] of tests) {
  const result = await testWithHttps(url);
  console.log(label);
  console.log('   Status:', result.status, '| OK:', result.ok);
  if (result.value != null) console.log('   Value:', result.value);
  if (result.error) console.log('   Error:', result.error);
  if (result.body) console.log('   Body:', result.body);
  console.log('');
  await new Promise((r) => setTimeout(r, 1500));
}
