import { XMLParser } from 'fast-xml-parser';
import { fetchWithTimeout } from './api-cache';

export interface IndeedJob {
  title: string;
  link: string;
  company?: string;
  location?: string;
  description?: string;
  pubDate?: string;
}

const INDEED_RSS_URL = 'https://rss.indeed.com/rss?q=oil+gas&l=Williston%2C+ND&sort=date';

export async function fetchIndeedJobs(limit = 20): Promise<IndeedJob[]> {
  try {
    const res = await fetchWithTimeout(
      INDEED_RSS_URL,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BakkenShale/1.0; +https://bakkenshale.com)',
          Accept: 'application/rss+xml, application/xml, text/xml',
        },
      },
      8_000
    );

    if (!res?.ok) return [];

    const xml = await res!.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xml);

    const channel = parsed?.rss?.channel;
    if (!channel) return [];

    let items = channel.item;
    if (!items) return [];
    if (!Array.isArray(items)) items = [items];

    return items.slice(0, limit).map((item: Record<string, string>) => {
      const title = item.title ?? '';
      const link = item.link ?? item.guid ?? '';
      const desc = item.description ?? '';
      const company = extractCompany(desc);
      const location = extractLocation(desc) ?? 'Williston, ND';
      return {
        title: stripHtml(title),
        link,
        company: company || undefined,
        location: location || undefined,
        description: stripHtml(desc).slice(0, 200),
        pubDate: item.pubDate,
      };
    });
  } catch {
    return [];
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

function extractCompany(desc: string): string | null {
  const match = desc.match(/- ([^-]+) \d/);
  return match ? stripHtml(match[1]).trim() : null;
}

function extractLocation(desc: string): string | null {
  const match = desc.match(/(?:in|at) ([A-Za-z\s,]+?)(?:\s*-|$)/);
  return match ? stripHtml(match[1]).trim() : null;
}

export const INDEED_SEARCH_URL = 'https://www.indeed.com/jobs?q=oil+gas&l=Williston%2C+ND';
