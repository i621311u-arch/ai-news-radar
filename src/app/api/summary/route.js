import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const topEvents = await prisma.event.findMany({
      where: {
        priority: { in: ['CRITICAL', 'HIGH'] }
      },
      orderBy: [
        { importanceScore: 'desc' },
        { lastUpdatedAt: 'desc' }
      ],
      take: 5
    });

    const totalCount = await prisma.event.count();

    const bullets = topEvents.map(e => ({
      id: e.id,
      title: e.canonicalTitle,
      summary: e.summary,
      whyItMatters: e.whyItMatters,
      importanceScore: e.importanceScore,
      category: e.category
    }));

    return NextResponse.json({
      success: true,
      totalEvents: totalCount,
      count: bullets.length,
      overviewMessage: bullets.length > 0 
        ? `Since your last update, ${totalCount} significant AI events were detected.` 
        : "Nothing major happened in the monitored sources.",
      bullets
    });
  } catch (err) {
    console.error('[API /api/summary Error]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
