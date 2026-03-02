/**
 * API cache with timeout and fallback.
 * Caches homepage data (EIA, Indeed) to avoid slow/failing APIs blocking the page.
 * Uses native https for EIA (Node fetch can timeout on api.eia.gov).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import https from 'node:https';

const CACHE_DIR = join(process.cwd(), 'cache');
const CACHE_FILE = join(CACHE_DIR, 'homepage-data.json');
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const FETCH_TIMEOUT_MS = 8_000; // 8 seconds per request

/** Fetch JSON via native https (avoids Node fetch timeout on EIA). */
export function fetchJsonHttps(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<Record<string, unknown> | null> {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const opts = { hostname: u.hostname, path: u.pathname + u.search, method: 'GET' };
      const req = https.request(opts, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(body) as Record<string, unknown>);
          } catch {
            resolve(null);
          }
        });
      });
      req.on('error', () => resolve(null));
      req.setTimeout(timeoutMs, () => {
        req.destroy();
        resolve(null);
      });
      req.end();
    } catch {
      resolve(null);
    }
  });
}

export interface HomepageCache {
  fetchedAt: string;
  eia: {
    wtiPrice: number | null;
    gasPrice: number | null;
    productionMbpd: number | null;
    rigCount: number | null;
    chartData: Array<{ name: string; value: number }>;
    productionYoY: number | null;
  };
  indeedJobs: Array<{
    title: string;
    link: string;
    company?: string;
    location?: string;
    description?: string;
    pubDate?: string;
  }>;
}

const DEFAULT_CACHE: HomepageCache = {
  fetchedAt: new Date(0).toISOString(),
  eia: {
    wtiPrice: null,
    gasPrice: null,
    productionMbpd: null,
    rigCount: null,
    chartData: [{ name: '—', value: 0 }],
    productionYoY: null,
  },
  indeedJobs: [],
};

function readCache(): HomepageCache {
  try {
    if (existsSync(CACHE_FILE)) {
      const raw = readFileSync(CACHE_FILE, 'utf-8');
      const data = JSON.parse(raw) as HomepageCache;
      if (data?.eia && data?.indeedJobs) return data;
    }
  } catch {}
  return { ...DEFAULT_CACHE };
}

function writeCache(data: HomepageCache): void {
  try {
    if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(CACHE_FILE, JSON.stringify(data, null, 0), 'utf-8');
  } catch {}
}

function isCacheStale(cache: HomepageCache): boolean {
  const fetched = new Date(cache.fetchedAt).getTime();
  return Date.now() - fetched > CACHE_TTL_MS;
}

/** Fetch with timeout. Returns null on timeout or error. */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = FETCH_TIMEOUT_MS
): Promise<Response | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    return res;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

export async function getHomepageData(
  fetchEia: () => Promise<Partial<HomepageCache['eia']>>,
  fetchIndeed: () => Promise<HomepageCache['indeedJobs']>
): Promise<HomepageCache> {
  const cached = readCache();
  const useCache = !isCacheStale(cached);

  // If cache is fresh and has data, return immediately (no blocking)
  if (useCache && (cached.eia.wtiPrice != null || cached.indeedJobs.length > 0)) {
    // Still try to refresh in background, but don't await
    Promise.all([fetchEia(), fetchIndeed()])
      .then(([eia, indeedJobs]) => {
        if (eia && Object.keys(eia).length) {
          writeCache({
            fetchedAt: new Date().toISOString(),
            eia: { ...cached.eia, ...eia },
            indeedJobs: indeedJobs?.length ? indeedJobs : cached.indeedJobs,
          });
        }
      })
      .catch(() => {});
    return cached;
  }

  // Cache stale or missing: fetch with timeout, fall back to cache
  try {
    const [eia, indeedJobs] = await Promise.all([
      fetchEia().catch(() => cached.eia),
      fetchIndeed().catch(() => cached.indeedJobs),
    ]);

    const result: HomepageCache = {
      fetchedAt: new Date().toISOString(),
      eia: {
        wtiPrice: eia?.wtiPrice ?? cached.eia.wtiPrice,
        gasPrice: eia?.gasPrice ?? cached.eia.gasPrice,
        productionMbpd: eia?.productionMbpd ?? cached.eia.productionMbpd,
        rigCount: eia?.rigCount ?? cached.eia.rigCount,
        chartData:
          eia?.chartData?.length ?? 0
            ? (eia.chartData as HomepageCache['eia']['chartData'])
            : cached.eia.chartData,
        productionYoY: eia?.productionYoY ?? cached.eia.productionYoY,
      },
      indeedJobs: indeedJobs?.length ? indeedJobs : cached.indeedJobs,
    };

    writeCache(result);
    return result;
  } catch {
    return cached;
  }
}
