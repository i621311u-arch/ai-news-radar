import nodemailer from 'nodemailer';
import { prisma } from './db.js';

export function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : '';
  const pass = process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.replace(/\s+/g, '').replace(/['"]/g, '') : '';

  if (!host || !user || !pass) {
    return null;
  }

  // Gmail SMTP optimization
  if (host.includes('gmail')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // General SMTP (Brevo, Hostinger, SendGrid, etc.)
  return nodemailer.createTransport({
    host: host,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: user,
      pass: pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

/**
 * Generate HTML and Text body for the daily digest
 */
export function generateDigestContent(topEvents, researchEvents, openSourceEvents, dateStr) {
  const top5 = topEvents.slice(0, 5);
  const otherEvents = topEvents.slice(5, 12);

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px; border: 1px solid #e2e8f0; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
    .title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px; }
    .subtitle { color: #64748b; font-size: 14px; margin-top: 4px; }
    .section-title { font-size: 14px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-top: 28px; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
    .card { margin-bottom: 20px; padding: 16px; background: #f8fafc; border-radius: 6px; border-left: 4px solid #3b82f6; }
    .card-title { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-decoration: none; display: block; }
    .card-why { font-size: 14px; color: #334155; margin-bottom: 8px; line-height: 1.5; }
    .card-meta { font-size: 12px; color: #64748b; }
    .card-meta a { color: #2563eb; text-decoration: none; font-weight: 600; }
    .bullet-list { padding-left: 20px; margin: 0; }
    .bullet-item { font-size: 14px; color: #334155; margin-bottom: 10px; line-height: 1.4; }
    .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 13px; color: #94a3b8; }
    .btn { display: inline-block; background: #0f172a; color: #ffffff !important; padding: 10px 20px; border-radius: 6px; font-weight: 600; text-decoration: none; font-size: 14px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">AI NEWS RADAR</h1>
      <div class="subtitle">Your Verified AI Intelligence Briefing — ${dateStr}</div>
    </div>

    <p style="font-size: 15px; color: #334155; line-height: 1.6;">Good morning.<br>Here are the most important AI developments detected since your previous briefing.</p>

    <div class="section-title">TOP DEVELOPMENTS</div>
    ${top5.map(e => {
      const primaryArticle = e.eventArticles?.[0]?.article;
      const sourceName = primaryArticle?.source?.name || 'Verified Source';
      const sourceUrl = primaryArticle?.url || '#';
      return `
        <div class="card">
          <a href="${sourceUrl}" class="card-title">${e.canonicalTitle}</a>
          <div class="card-why"><strong>Why it matters:</strong> ${e.whyItMatters || e.summary}</div>
          <div class="card-meta">Source: <a href="${sourceUrl}">${sourceName}</a> • Score: ${e.importanceScore}/100 • Status: ${e.verificationStatus}</div>
        </div>
      `;
    }).join('')}

    ${otherEvents.length > 0 ? `
      <div class="section-title">OTHER IMPORTANT DEVELOPMENTS</div>
      <ul class="bullet-list">
        ${otherEvents.map(e => `
          <li class="bullet-item">
            <strong>${e.canonicalTitle}</strong> — ${e.summary}
          </li>
        `).join('')}
      </ul>
    ` : ''}

    ${researchEvents.length > 0 ? `
      <div class="section-title">RESEARCH WATCH</div>
      <ul class="bullet-list">
        ${researchEvents.map(e => `
          <li class="bullet-item">
            <strong>${e.canonicalTitle}</strong>: ${e.summary}
          </li>
        `).join('')}
      </ul>
    ` : ''}

    ${openSourceEvents.length > 0 ? `
      <div class="section-title">OPEN SOURCE WATCH</div>
      <ul class="bullet-list">
        ${openSourceEvents.map(e => `
          <li class="bullet-item">
            <strong>${e.canonicalTitle}</strong>: ${e.summary}
          </li>
        `).join('')}
      </ul>
    ` : ''}

    <div style="text-align: center; margin-top: 28px;">
      <a href="https://ubiquitous-dodol-ec4889.netlify.app" class="btn">Read Full Dashboard →</a>
    </div>

    <div class="footer">
      Generated automatically by AI News Radar • RSS-first verified intelligence
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * Send the daily digest email
 */
export async function sendDailyDigest(force = false) {
  const todayStr = new Date().toISOString().split('T')[0];

  if (prisma) {
    try {
      const existing = await prisma.dailyDigest.findUnique({
        where: { digestDate: todayStr }
      });
      if (existing && existing.status === 'SENT' && !force) {
        return { success: true, message: 'Already sent today' };
      }
    } catch (e) {
      console.warn('[Digest] DailyDigest table query skipped');
    }
  }

  const { getEvents } = await import('./dataStore.js');
  const topEvents = await getEvents({ priority: 'Top', limit: 15 });
  const researchEvents = await getEvents({ category: 'Research', limit: 5 });
  const openSourceEvents = await getEvents({ category: 'Open Source', limit: 5 });

  const htmlContent = generateDigestContent(topEvents, researchEvents, openSourceEvents, todayStr);
  const transporter = createTransporter();

  if (!transporter) {
    return { success: false, error: 'SMTP configuration missing in Environment Variables.' };
  }

  try {
    const toEmail = process.env.SMTP_TO || process.env.SMTP_USER;
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;

    const mailOptions = {
      from: `AI News Radar <${fromEmail}>`,
      to: toEmail,
      subject: `AI News Radar — Your AI Briefing — ${todayStr}`,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);

    if (prisma) {
      try {
        await prisma.dailyDigest.upsert({
          where: { digestDate: todayStr },
          update: { sentAt: new Date(), status: 'SENT' },
          create: { digestDate: todayStr, contentJson: JSON.stringify({ topEvents }), sentAt: new Date(), status: 'SENT' }
        });
      } catch (e) {
        console.warn('[Digest] Upsert skipped');
      }
    }

    return { success: true, sentTo: toEmail };
  } catch (err) {
    console.error('[Email Error]:', err.message || err);
    return { success: false, error: err.message };
  }
}
