import { sendDailyDigest } from '../../src/lib/email.js';

export default async function handler(req, context) {
  console.log('[Netlify Scheduled Email] 07:00 AM Daily briefing triggered...');
  try {
    const result = await sendDailyDigest(true);
    return new Response(JSON.stringify({
      success: result.success,
      result
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('[Netlify Scheduled Email Error]:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
