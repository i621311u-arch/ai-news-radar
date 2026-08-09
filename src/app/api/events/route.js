import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');
    const q = searchParams.get('q');
    const since = searchParams.get('since');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where = {};

    if (category && category !== 'All') {
      where.category = category;
    }

    if (priority && priority !== 'All') {
      if (priority === 'Top') {
        where.priority = { in: ['CRITICAL', 'HIGH'] };
      } else {
        where.priority = priority;
      }
    }

    if (status && status !== 'All') {
      where.verificationStatus = status;
    }

    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        where.lastUpdatedAt = { gte: sinceDate };
      }
    }

    if (q && q.trim() !== '') {
      const query = q.trim();
      where.OR = [
        { canonicalTitle: { contains: query } },
        { summary: { contains: query } },
        { whyItMatters: { contains: query } },
        { category: { contains: query } }
      ];
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        eventArticles: {
          include: {
            article: {
              include: {
                source: true
              }
            }
          }
        },
        claims: true
      },
      orderBy: [
        { importanceScore: 'desc' },
        { lastUpdatedAt: 'desc' }
      ],
      take: limit
    });

    return NextResponse.json({ success: true, count: events.length, events });
  } catch (err) {
    console.error('[API /api/events Error]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
