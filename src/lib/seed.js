import fs from 'fs';
import path from 'path';
import { prisma } from './db.js';

export async function seedSources() {
  const sourcesFilePath = path.join(process.cwd(), 'config', 'sources.json');
  if (!fs.existsSync(sourcesFilePath)) {
    console.warn('sources.json not found at:', sourcesFilePath);
    return;
  }

  const sourcesData = JSON.parse(fs.readFileSync(sourcesFilePath, 'utf8'));

  for (const src of sourcesData) {
    await prisma.source.upsert({
      where: { id: src.id || src.name.toLowerCase().replace(/[^a-z0-9]/g, '-') },
      update: {
        name: src.name,
        url: src.url,
        rssUrl: src.rssUrl,
        type: src.type,
        credibilityTier: src.credibilityTier,
        reliabilityScore: src.reliabilityScore,
        pollingInterval: src.pollingInterval,
        priority: src.priority,
        enabled: src.enabled
      },
      create: {
        id: src.id || src.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: src.name,
        url: src.url,
        rssUrl: src.rssUrl,
        type: src.type,
        credibilityTier: src.credibilityTier,
        reliabilityScore: src.reliabilityScore,
        pollingInterval: src.pollingInterval,
        priority: src.priority,
        enabled: src.enabled
      }
    });
  }

  console.log(`Seeded ${sourcesData.length} sources successfully.`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('seed.js')) {
  seedSources()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
