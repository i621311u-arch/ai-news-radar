import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const sourcesCount = await prisma.source.count();
    const enabledSources = await prisma.source.count({ where: { enabled: true } });
    const articlesCount = await prisma.article.count();
    const eventsCount = await prisma.event.count();
    const recentLogs = await prisma.fetchLog.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: { source: true }
    });

    const failedSources = await prisma.source.findMany({
      where: { lastError: { not: null } },
      select: { id: true, name: true, lastError: true }
    });

    const lastIngestLog = await prisma.fetchLog.findFirst({
      orderBy: { timestamp: 'desc' }
    });

    const lastDigest = await prisma.dailyDigest.findFirst({
      orderBy: { sentAt: 'desc' }
    });

    const geminiKeyConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');
    const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);

    return NextResponse.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      stats: {
        totalSources: sourcesCount,
        enabledSources: enabledSources,
        failingSourcesCount: failedSources.length,
        totalArticles: articlesCount,
        totalEvents: eventsCount
      },
      services: {
        database: 'connected',
        geminiAi: geminiKeyConfigured ? 'configured' : 'fallback_mode (no key set)',
        smtpEmail: smtpConfigured ? 'configured' : 'not_configured'
      },
      lastIngest: lastIngestLog ? lastIngestLog.timestamp : null,
      lastDigest: lastDigest ? { date: lastDigest.digestDate, status: lastDigest.status, sentAt: lastDigest.sentAt } : null,
      failedSources,
      recentLogs
    });
  } catch (err) {
    console.error('[API /api/health Error]:', err);
    return NextResponse.json({
      success: false,
      status: 'unhealthy',
      error: err.message
    }, { status: 500 });
  }
}
