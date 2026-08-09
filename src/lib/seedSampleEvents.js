import { prisma } from './db.js';

export async function seedSampleEvents() {
  console.log('[Seed] Populating sample AI intelligence events...');

  // 1. OpenAI o3 Reasoning Model Release
  const event1 = await prisma.event.create({
    data: {
      canonicalTitle: "OpenAI Announces o3 Reasoning Model with Frontier Benchmark Performance",
      summary: "OpenAI introduced o3, its next-generation reasoning model demonstrating state-of-the-art results on competitive programming, math benchmarks, and complex reasoning tasks.",
      detailedSummary: "OpenAI announced the official release of its o3 model series. In competitive programming (Codeforces), o3 achieved an Elo rating of 2727, placing it in the 99.6th percentile of human competitors. The model also scored 96.7% on ARC-AGI benchmarks under high-compute evaluation.",
      whyItMatters: "Materially advances AI reasoning capabilities for developers and researchers, significantly shifting cost-to-performance tradeoffs for complex software engineering and scientific workflows.",
      category: "Models",
      priority: "CRITICAL",
      importanceScore: 98,
      confidenceScore: 99,
      verificationStatus: "CONFIRMED",
      firstSeenAt: new Date(Date.now() - 20 * 60 * 1000), // 20 mins ago
      lastUpdatedAt: new Date(Date.now() - 10 * 60 * 1000),
      claims: {
        create: [
          {
            claimText: "OpenAI o3 achieved 2727 Elo on Codeforces benchmark.",
            claimType: "FACT",
            verified: true,
            confidence: 99
          },
          {
            claimText: "Model is accessible via API for tier-5 developer accounts.",
            claimType: "COMPANY_CLAIM",
            verified: true,
            confidence: 95
          }
        ]
      }
    }
  });

  // Attach sample articles to Event 1
  const srcOpenAI = await prisma.source.findFirst({ where: { name: { contains: 'OpenAI' } } });
  const srcTC = await prisma.source.findFirst({ where: { name: { contains: 'TechCrunch' } } });

  if (srcOpenAI) {
    const art1 = await prisma.article.create({
      data: {
        sourceId: srcOpenAI.id,
        title: "Introducing OpenAI o3",
        url: "https://openai.com/index/introducing-o3/",
        canonicalUrl: "https://openai.com/index/introducing-o3/",
        publishedAt: new Date(Date.now() - 20 * 60 * 1000),
        description: "OpenAI o3 represents our latest breakthrough in AI reasoning.",
        titleHash: "hash-o3-official",
        contentHash: "chash-o3-official"
      }
    });

    await prisma.eventArticle.create({
      data: { eventId: event1.id, articleId: art1.id, isPrimary: true }
    });

    await prisma.event.update({
      where: { id: event1.id },
      data: { primaryArticleId: art1.id }
    });
  }

  if (srcTC) {
    const art2 = await prisma.article.create({
      data: {
        sourceId: srcTC.id,
        title: "OpenAI launches o3 reasoning model with insane coding capabilities",
        url: "https://techcrunch.com/2026/08/openai-launches-o3",
        canonicalUrl: "https://techcrunch.com/2026/08/openai-launches-o3",
        publishedAt: new Date(Date.now() - 15 * 60 * 1000),
        description: "TechCrunch breakdown of OpenAI's new o3 model launch.",
        titleHash: "hash-o3-tc",
        contentHash: "chash-o3-tc"
      }
    });

    await prisma.eventArticle.create({
      data: { eventId: event1.id, articleId: art2.id, isPrimary: false }
    });
  }

  // 2. Open Source Model Weights Release
  const event2 = await prisma.event.create({
    data: {
      canonicalTitle: "DeepSeek Releases Open-Weight 67B Reasoning Model under MIT License",
      summary: "DeepSeek has open-sourced its new 67B parameter reasoning model with permissive MIT licensing, enabling local deployment and fine-tuning.",
      detailedSummary: "The newly released model provides open weights, complete architecture specifications, and training receipts. On MATH-500, it approaches closed-model performance while requiring significantly reduced VRAM footprint for inference.",
      whyItMatters: "Provides high-grade reasoning capabilities to open-source developers and local enterprise deployments without reliance on proprietary API endpoints.",
      category: "Open Source",
      priority: "HIGH",
      importanceScore: 92,
      confidenceScore: 95,
      verificationStatus: "CONFIRMED",
      firstSeenAt: new Date(Date.now() - 45 * 60 * 1000),
      lastUpdatedAt: new Date(Date.now() - 30 * 60 * 1000),
      claims: {
        create: [
          {
            claimText: "Model weights are distributed freely under the MIT License.",
            claimType: "FACT",
            verified: true,
            confidence: 100
          }
        ]
      }
    }
  });

  const srcHF = await prisma.source.findFirst({ where: { name: { contains: 'Hugging' } } });
  if (srcHF) {
    const art3 = await prisma.article.create({
      data: {
        sourceId: srcHF.id,
        title: "DeepSeek 67B Open Weights Available on Hugging Face Hub",
        url: "https://huggingface.co/blog/deepseek-67b-open-release",
        publishedAt: new Date(Date.now() - 45 * 60 * 1000),
        description: "Explore and download the new open weights for DeepSeek 67B.",
        titleHash: "hash-deepseek-hf",
        contentHash: "chash-deepseek-hf"
      }
    });

    await prisma.eventArticle.create({
      data: { eventId: event2.id, articleId: art3.id, isPrimary: true }
    });
  }

  // 3. arXiv Research Breakthrough
  const event3 = await prisma.event.create({
    data: {
      canonicalTitle: "Researchers Demonstrate Test-Time Scaling Law Optimization for Complex Theorem Proving",
      summary: "A joint research paper demonstrates how compute scaling during test-time inference yields exponential efficiency gains in automated mathematical proof generation.",
      detailedSummary: "The authors propose an adaptive search algorithm that dynamically allocates inference compute based on step-wise uncertainty estimation. Tested on Lean 4 mathematical theorem datasets, the approach achieves a 40% reduction in token consumption.",
      whyItMatters: "Shows a practical computational path to scale AI reasoning without relying solely on larger pre-training parameter counts.",
      category: "Research",
      priority: "HIGH",
      importanceScore: 89,
      confidenceScore: 90,
      verificationStatus: "PRIMARY_SOURCE_ONLY",
      firstSeenAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      lastUpdatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      claims: {
        create: [
          {
            claimText: "Adaptive search algorithm reduced Lean 4 theorem verification tokens by 40%.",
            claimType: "FACT",
            verified: true,
            confidence: 90
          }
        ]
      }
    }
  });

  const srcArxiv = await prisma.source.findFirst({ where: { name: { contains: 'arXiv' } } });
  if (srcArxiv) {
    const art4 = await prisma.article.create({
      data: {
        sourceId: srcArxiv.id,
        title: "[2508.01234] Test-Time Compute Scaling Laws in Formal Theorem Proving",
        url: "https://arxiv.org/abs/2508.01234",
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        description: "Abstract and full PDF for Test-Time Compute Scaling Laws.",
        titleHash: "hash-arxiv-scaling",
        contentHash: "chash-arxiv-scaling"
      }
    });

    await prisma.eventArticle.create({
      data: { eventId: event3.id, articleId: art4.id, isPrimary: true }
    });
  }

  console.log('[Seed] Sample events created successfully!');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('seedSampleEvents.js')) {
  seedSampleEvents()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
