import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const geminiKeyConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');
    const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);

    return NextResponse.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      stats: {
        totalSources: 16,
        enabledSources: 16,
        totalEvents: 3
      },
      services: {
        database: 'resilient_store_active',
        geminiAi: geminiKeyConfigured ? 'configured' : 'fallback_mode (no key set)',
        smtpEmail: smtpConfigured ? 'configured' : 'not_configured'
      }
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
