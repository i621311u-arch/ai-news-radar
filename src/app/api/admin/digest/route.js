import { NextResponse } from 'next/server';
import { sendDailyDigest } from '@/lib/email';

export async function POST() {
  try {
    const result = await sendDailyDigest(true); // force send
    return NextResponse.json({
      success: result.success,
      result
    });
  } catch (err) {
    console.error('[API /api/admin/digest Error]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
