import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        eventArticles: {
          include: {
            article: {
              include: {
                source: true
              }
            }
          },
          orderBy: { addedAt: 'asc' }
        },
        claims: true
      }
    });

    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, event });
  } catch (err) {
    console.error('[API /api/events/[id] Error]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
