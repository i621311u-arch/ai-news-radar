import Parser from 'rss-parser';
import crypto from 'crypto';
import { prisma } from './db.js';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AINewsRadar/1.0 Intelligence Agent',
    'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*'
  },
  customFields: {
    item: [
      ['content:encoded', 'contentEncoded'],
      ['dc:creator', 'creator'],
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail']
    ]
  }
});

/**
 * Clean and normalize a URL (strip tracking parameters like utm_*)
 */
export function normalizeUrl(rawUrl) {
  if (!rawUrl) return '';
  try {
    const parsed = new URL(rawUrl.trim());
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'];
    trackingParams.forEach(param => parsed.searchParams.delete(param));
    return parsed.toString();
  } catch (e) {
    return rawUrl.trim();
  }
}

/**
 * Clean string whitespace
 */
export function normalizeText(text) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Generate SHA-256 hash for deduplication
 */
export function hashString(str) {
  return crypto.createHash('sha256').update(str.toLowerCase().trim()).digest('hex');
}

/**
 * Fetch and process a single RSS source
 */
export async function fetchAndProcessSource(source) {
  if (!source.rssUrl || !source.enabled) {
    return { success: false, itemsFetched: 0, error: 'No RSS URL or source disabled' };
  }

  try {
    console.log(`[Ingest] Fetching RSS feed for: ${source.name} (${source.rssUrl})`);
    const feed = await parser.parseURL(source.rssUrl);

    let itemsFetched = 0;
    const newArticles = [];

    for (const item of feed.items || []) {
      const title = normalizeText(item.title);
      const url = normalizeUrl(item.link || item.guid);
      
      if (!title || !url) continue;

      const titleHash = hashString(title);
      const contentSnippet = normalizeText(item.contentSnippet || item.summary || item.contentEncoded || item.description || '');
      const contentHash = hashString(`${title}:${contentSnippet.substring(0, 300)}`);

      // Check if article already exists by URL or titleHash or contentHash
      const existing = await prisma.article.findFirst({
        where: {
          OR: [
            { url: url },
            { titleHash: titleHash },
            { contentHash: contentHash }
          ]
        }
      });

      if (!existing) {
        let pubDate = new Date();
        if (item.isoDate || item.pubDate) {
          const parsedDate = new Date(item.isoDate || item.pubDate);
          if (!isNaN(parsedDate.getTime())) {
            pubDate = parsedDate;
          }
        }

        // Try extracting image URL
        let imageUrl = null;
        if (item.mediaContent?.$?.url) {
          imageUrl = item.mediaContent.$.url;
        } else if (item.mediaThumbnail?.$?.url) {
          imageUrl = item.mediaThumbnail.$.url;
        } else if (item.enclosure?.url) {
          imageUrl = item.enclosure.url;
        }

        const article = await prisma.article.create({
          data: {
            sourceId: source.id,
            title: title,
            url: url,
            canonicalUrl: url,
            author: item.creator || item.author || null,
            publishedAt: pubDate,
            description: item.contentSnippet || item.summary || null,
            content: item.contentEncoded || item.content || item.description || null,
            imageUrl: imageUrl,
            titleHash: titleHash,
            contentHash: contentHash,
            rawMetadata: JSON.stringify({ guid: item.guid, categories: item.categories || [] })
          }
        });

        newArticles.push(article);
        itemsFetched++;
      }
    }

    // Update source status
    await prisma.source.update({
      where: { id: source.id },
      update: {
        lastSuccessfulFetch: new Date(),
        lastError: null
      }
    });

    // Log success
    await prisma.fetchLog.create({
      data: {
        sourceId: source.id,
        status: 'SUCCESS',
        itemsFetched: itemsFetched,
        errorMessage: null
      }
    });

    console.log(`[Ingest] ${source.name}: Fetched ${itemsFetched} new articles`);
    return { success: true, itemsFetched, newArticles };
  } catch (err) {
    const errorMsg = err.message || String(err);
    console.error(`[Ingest Error] ${source.name}:`, errorMsg);

    // Update source with last error
    await prisma.source.update({
      where: { id: source.id },
      update: { lastError: errorMsg }
    });

    // Log failure
    await prisma.fetchLog.create({
      data: {
        sourceId: source.id,
        status: 'ERROR',
        itemsFetched: 0,
        errorMessage: errorMsg
      }
    });

    return { success: false, itemsFetched: 0, error: errorMsg };
  }
}

/**
 * Fetch all active sources in parallel with safe concurrency
 */
export async function fetchAllActiveSources() {
  const sources = await prisma.source.findMany({
    where: { enabled: true },
    orderBy: { priority: 'desc' }
  });

  const results = [];
  for (const source of sources) {
    const res = await fetchAndProcessSource(source);
    results.push({ source: source.name, ...res });
  }

  return results;
}
