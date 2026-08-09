import cron from 'node-cron';
import dotenv from 'dotenv';
import { seedSources } from './src/lib/seed.js';
import { fetchAllActiveSources } from './src/lib/rss.js';
import { processUnclusteredArticles } from './src/lib/clustering.js';
import { sendDailyDigest } from './src/lib/email.js';

dotenv.config();

const timezone = process.env.TIMEZONE || 'Asia/Kolkata';

console.log('====================================================');
console.log('🤖 AI NEWS RADAR INGESTION & SCHEDULER WORKER STARTED');
console.log(`⏰ Timezone: ${timezone}`);
console.log('====================================================');

async function runIngestionPipeline() {
  console.log(`\n[Worker Pipeline Run] ${new Date().toISOString()}`);
  try {
    // 1. Ensure sources are seeded
    await seedSources();

    // 2. Ingest RSS feeds
    const fetchResults = await fetchAllActiveSources();
    const totalFetched = fetchResults.reduce((acc, r) => acc + (r.itemsFetched || 0), 0);
    console.log(`[Worker Pipeline] Ingested total ${totalFetched} new articles across sources.`);

    // 3. Cluster into events
    const clusterResults = await processUnclusteredArticles();
    console.log(`[Worker Pipeline] Clustering finished. Created: ${clusterResults.eventsCreated}, Updated: ${clusterResults.eventsUpdated}`);

  } catch (err) {
    console.error('[Worker Pipeline Error]:', err);
  }
}

// 1. Immediate execution on worker launch
runIngestionPipeline();

// 2. Cron schedule: Fetch RSS & cluster every 5 minutes
cron.schedule('*/5 * * * *', () => {
  console.log('\n[Cron Trigger] Running 5-minute RSS Ingestion & Clustering...');
  runIngestionPipeline();
});

// 3. Cron schedule: Send Daily Email Digest at 07:00 AM (Asia/Kolkata)
cron.schedule('0 7 * * *', async () => {
  console.log('\n[Cron Trigger] Running 07:00 AM Daily Email Digest job...');
  await sendDailyDigest();
}, {
  timezone: timezone
});
