/**
 * Extract featured image from a content entry.
 * Priority: ogImage > heroImage > first image in body (markdown or HTML).
 */

/** Extract first image URL from body (markdown or HTML). */
export function extractFirstImageFromBody(body: string): string | null {
  if (!body?.trim()) return null;
  // Markdown: ![alt](url) or ![alt](url "title")
  const mdMatch = body.match(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/);
  if (mdMatch) return mdMatch[1].trim();
  // HTML: <img src="url" ...> or <img ... src='url' ...>
  const htmlMatch = body.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (htmlMatch) return htmlMatch[1].trim();
  return null;
}

/** Normalize image value: Decap image widget may save string or { path?: string; src?: string }. */
function normalizeImageValue(val: unknown): string | null {
  if (typeof val === 'string' && val.trim()) return val.trim();
  if (val && typeof val === 'object' && 'path' in val && typeof (val as { path?: string }).path === 'string')
    return (val as { path: string }).path; // Decap image widget object format
  if (val && typeof val === 'object' && 'src' in val && typeof (val as { src?: string }).src === 'string')
    return (val as { src: string }).src;
  return null;
}

export function getFeaturedImage(entry: {
  data?: { heroImage?: unknown; ogImage?: unknown };
  body?: string;
}): string | undefined {
  const bodyImage = entry.body ? extractFirstImageFromBody(entry.body) : null;
  const og = normalizeImageValue(entry.data?.ogImage);
  const hero = normalizeImageValue(entry.data?.heroImage);
  const img = og ?? hero ?? bodyImage ?? undefined;
  return img || undefined;
}
