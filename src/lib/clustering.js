import { prisma } from './db.js';
import { analyzeEventWithGemini } from './gemini.js';

/**
 * Calculate Jaccard text similarity between two title strings
 */
export function calculateTitleSimilarity(title1, title2) {
  if (!title1 || !title2) return 0;
  
  const clean1 = title1.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const clean2 = title2.toLowerCase().replace(/[^a-z0-9\s]/g, '');

  const words1 = new Set(clean1.split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(clean2.split(/\s+/).filter(w => w.length > 2));

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Process pending articles and cluster them into Events
 */
export async function processUnclusteredArticles() {
  console.log('[Clustering] Checking for unclustered articles...');

  // Find articles that do not belong to any event_article relation
  const unclusteredArticles = await prisma.article.findMany({
    where: {
      eventArticles: {
        none: {}
      }
    },
    include: {
      source: true
    },
    orderBy: {
      publishedAt: 'asc'
    }
  });

  if (unclusteredArticles.length === 0) {
    console.log('[Clustering] No new unclustered articles found.');
    return { eventsCreated: 0, eventsUpdated: 0 };
  }

  console.log(`[Clustering] Found ${unclusteredArticles.length} unclustered articles.`);

  let eventsCreated = 0;
  let eventsUpdated = 0;

  for (const article of unclusteredArticles) {
    const twoDaysAgo = new Date(article.publishedAt.getTime() - 48 * 60 * 60 * 1000);

    // Fetch recent events to see if this article belongs to one
    const recentEvents = await prisma.event.findMany({
      where: {
        lastUpdatedAt: {
          gte: twoDaysAgo
        }
      },
      include: {
        eventArticles: {
          include: {
            article: {
              include: {
                source: true
              }
            }
          }
        }
      }
    });

    let matchedEvent = null;
    let highestSimilarity = 0;

    for (const event of recentEvents) {
      // Compare with event canonical title
      const sim = calculateTitleSimilarity(article.title, event.canonicalTitle);
      
      // Also compare with titles of existing articles in this event cluster
      let maxArticleSim = 0;
      for (const ea of event.eventArticles) {
        const itemSim = calculateTitleSimilarity(article.title, ea.article.title);
        if (itemSim > maxArticleSim) maxArticleSim = itemSim;
      }

      const effectiveSim = Math.max(sim, maxArticleSim);

      if (effectiveSim >= 0.40 && effectiveSim > highestSimilarity) {
        highestSimilarity = effectiveSim;
        matchedEvent = event;
      }
    }

    if (matchedEvent) {
      // Attach to existing event
      const isPrimary = article.source?.type === 'primary' || article.source?.credibilityTier === 1;

      await prisma.eventArticle.create({
        data: {
          eventId: matchedEvent.id,
          articleId: article.id,
          isPrimary: isPrimary
        }
      });

      // Recalculate verification status if primary source arrived
      let newVerificationStatus = matchedEvent.verificationStatus;
      if (isPrimary && matchedEvent.verificationStatus !== 'CONFIRMED') {
        newVerificationStatus = 'CONFIRMED';
      } else if (matchedEvent.eventArticles.length + 1 >= 2 && matchedEvent.verificationStatus === 'REPORTED') {
        newVerificationStatus = 'MULTI_SOURCE_REPORTED';
      }

      await prisma.event.update({
        where: { id: matchedEvent.id },
        update: {
          lastUpdatedAt: new Date(),
          verificationStatus: newVerificationStatus,
          importanceScore: Math.min(100, matchedEvent.importanceScore + (isPrimary ? 10 : 3))
        }
      });

      console.log(`[Clustering] Appended article "${article.title}" to existing Event: "${matchedEvent.canonicalTitle}" (Similarity: ${(highestSimilarity * 100).toFixed(0)}%)`);
      eventsUpdated++;
    } else {
      // Create new event!
      console.log(`[Clustering] Creating new Event for article: "${article.title}"`);

      const isPrimary = article.source?.type === 'primary' || article.source?.credibilityTier === 1;

      // Run Gemini / Fallback analysis
      const analysis = await analyzeEventWithGemini([article], article.source);

      const newEvent = await prisma.event.create({
        data: {
          canonicalTitle: analysis.canonical_title,
          summary: analysis.summary,
          detailedSummary: analysis.detailed_summary,
          whyItMatters: analysis.why_it_matters,
          category: analysis.category,
          priority: analysis.priority,
          importanceScore: analysis.importance_score,
          confidenceScore: analysis.confidence_score,
          verificationStatus: analysis.verification_status,
          firstSeenAt: article.publishedAt || new Date(),
          lastUpdatedAt: new Date(),
          primaryArticleId: isPrimary ? article.id : null,
          eventArticles: {
            create: {
              articleId: article.id,
              isPrimary: isPrimary
            }
          },
          claims: {
            create: (analysis.claims || []).map(c => ({
              claimText: c.claim_text,
              claimType: c.claim_type,
              verified: c.verified,
              confidence: c.confidence
            }))
          }
        }
      });

      console.log(`[Clustering] Created Event ID ${newEvent.id}: "${newEvent.canonicalTitle}" [Score: ${newEvent.importanceScore}, Priority: ${newEvent.priority}]`);
      eventsCreated++;
    }
  }

  return { eventsCreated, eventsUpdated };
}
