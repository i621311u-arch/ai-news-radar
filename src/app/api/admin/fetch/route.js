import { NextResponse } from 'next/server';
import { fetchAllActiveSources } from '@/lib/rss';
import { processUnclusteredArticles } from '@/lib/clustering';

export async function POST() {
  try {
    const fetchResults = await fetchAllActiveSources();
    const clusterResults = await processUnclusteredArticles();

    return NextResponse.json({
      success: true,
      message: 'Manual fetch and clustering pipeline completed successfully',
      fetchResults,
      clusterResults
    });
  } catch (err) {
    console.error('[API /api/admin/fetch Error]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
