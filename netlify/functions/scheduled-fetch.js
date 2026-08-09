import { fetchAllActiveSources } from '../../src/lib/rss.js';
import { processUnclusteredArticles } from '../../src/lib/clustering.js';

export default async function handler(req, context) {
  console.log('[Netlify Scheduled Fetch] Ingestion triggered...');
  try {
    const fetchResults = await fetchAllActiveSources();
    const clusterResults = await processUnclusteredArticles();

    return new Response(JSON.stringify({
      success: true,
      message: 'Netlify cron RSS fetch & clustering complete',
      fetchResults,
      clusterResults
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('[Netlify Scheduled Fetch Error]:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
