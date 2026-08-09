import { NextResponse } from 'next/server';
import { getEvents } from '@/lib/dataStore';

export async function GET() {
  try {
    const topEvents = await getEvents({ priority: 'Top', limit: 5 });

    const bullets = topEvents.slice(0, 5).map(e => ({
      id: e.id,
      title: e.canonicalTitle,
      summary: e.summary,
      whyItMatters: e.whyItMatters,
      importanceScore: e.importanceScore,
      category: e.category
    }));

    return NextResponse.json({
      success: true,
      totalEvents: topEvents.length,
      count: bullets.length,
      overviewMessage: bullets.length > 0 
        ? `Since your last update, ${topEvents.length} significant AI events were detected.` 
        : "Nothing major happened in the monitored sources.",
      bullets
    });
  } catch (err) {
    console.error('[API /api/summary Error]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
