import { NextResponse } from 'next/server';
import { getEvents } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');
    const q = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '50');

    const events = await getEvents({ category, priority, status, q, limit });

    return NextResponse.json({ success: true, count: events.length, events });
  } catch (err) {
    console.error('[API /api/events Error]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
