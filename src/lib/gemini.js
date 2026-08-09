import { GoogleGenAI } from '@google/genai';

/**
 * Perform rule-based fallback analysis if Gemini API key is not set or fails.
 */
function fallbackAnalysis(article, source) {
  const title = article.title || '';
  const text = `${title} ${article.description || ''}`.toLowerCase();

  // Basic category detection
  let category = 'Other';
  if (text.includes('paper') || text.includes('arxiv') || text.includes('research') || text.includes('study')) category = 'Research';
  else if (text.includes('model') || text.includes('gpt') || text.includes('claude') || text.includes('gemini') || text.includes('llama')) category = 'Models';
  else if (text.includes('open source') || text.includes('weights') || text.includes('github') || text.includes('huggingface')) category = 'Open Source';
  else if (text.includes('agent') || text.includes('autonomous')) category = 'Agents';
  else if (text.includes('chip') || text.includes('gpu') || text.includes('nvidia') || text.includes('tpu') || text.includes('hardware')) category = 'Hardware';
  else if (text.includes('security') || text.includes('safety') || text.includes('vulnerability') || text.includes('jailbreak')) category = 'Safety';
  else if (text.includes('policy') || text.includes('regulation') || text.includes('law') || text.includes('eu ai act')) category = 'Policy';

  // Priority and Importance
  let priority = 'MEDIUM';
  let importanceScore = 50;

  if (source.credibilityTier === 1 || source.type === 'primary') {
    importanceScore += 25;
    if (category === 'Models' || category === 'Research' || category === 'Open Source') {
      priority = 'HIGH';
      importanceScore += 15;
    }
  }

  // Anti-hype check in fallback
  const hypeWords = ['revolutionary', 'shocking', 'insane', 'destroys', 'kills', 'game changer', 'agi achieved', 'human-level'];
  const containsHype = hypeWords.some(w => text.includes(w));
  if (containsHype) {
    importanceScore = Math.max(20, importanceScore - 20); // Penalty for hype
  }

  importanceScore = Math.min(100, Math.max(10, importanceScore));

  const verificationStatus = source.type === 'primary' ? 'PRIMARY_SOURCE_ONLY' : 'REPORTED';

  // Clean anti-hype title
  let cleanTitle = title;
  hypeWords.forEach(word => {
    const reg = new RegExp(word, 'gi');
    cleanTitle = cleanTitle.replace(reg, '');
  });
  cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();

  return {
    canonical_title: cleanTitle || title,
    summary: article.description || article.title,
    detailed_summary: article.content || article.description || article.title,
    why_it_matters: `Published by ${source.name}. Relevant to ${category.toLowerCase()} developments.`,
    category: category,
    priority: priority,
    importance_score: importanceScore,
    confidence_score: source.type === 'primary' ? 95 : 75,
    verification_status: verificationStatus,
    claims: [
      {
        claim_text: `Published update on: "${title}"`,
        claim_type: source.type === 'primary' ? 'COMPANY_CLAIM' : 'MEDIA_REPORT',
        verified: source.type === 'primary',
        confidence: source.reliabilityScore || 80
      }
    ]
  };
}

/**
 * Analyze an article cluster using Gemini AI
 */
export async function analyzeEventWithGemini(articles, primarySource) {
  const apiKey = process.env.GEMINI_API_KEY;

  const leadArticle = articles[0];
  const sourceName = primarySource?.name || leadArticle.source?.name || 'Unknown Source';
  const sourceType = primarySource?.type || 'secondary';

  // If no Gemini API Key, return rule-based fallback immediately
  if (!apiKey || apiKey.trim() === '') {
    console.log('[Gemini] No GEMINI_API_KEY provided. Using rule-based fallback analysis.');
    return fallbackAnalysis(leadArticle, { name: sourceName, type: sourceType, credibilityTier: primarySource?.credibilityTier || 2 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });

    const articleContexts = articles.map(a => `
Title: ${a.title}
Source: ${a.source?.name || sourceName} (${a.source?.type || sourceType})
URL: ${a.url}
Snippet/Content: ${a.description || a.content || 'N/A'}
`).join('\n---\n');

    const prompt = `
You are an expert AI intelligence analyst and news radar architect.
Analyze the following article coverage about an AI development and produce a structured, factual intelligence summary.

STRICT REQUIREMENTS:
1. ANTI-HYPE & ANTI-CLICKBAIT: De-sensationalize headlines. Transform titles like "THIS AI DESTROYS EVERYTHING" into factual statements like "New model reports benchmark improvements in reasoning".
2. CLASSIFICATION: Choose primary category from: [Models, Research, Products, Agents, Open Source, Dev Tools, Infrastructure, Hardware, Robotics, Multimodal, Benchmarks, Safety, Security, Policy, Regulation, Funding, Science, Industry, Other].
3. PRIORITY: Select from [CRITICAL, HIGH, MEDIUM, LOW]. High/Critical reserved for major model releases, major papers, open-source releases, or significant breakthroughs. Downrank generic listicles ("10 prompts to try") to LOW.
4. IMPORTANCE SCORE: Integer 0-100 based on technical novelty, developer impact, and source credibility. DO NOT rely on sensational wording or article volume alone.
5. VERIFICATION STATUS: Select from [CONFIRMED, MULTI_SOURCE_REPORTED, PRIMARY_SOURCE_ONLY, REPORTED, UNVERIFIED, CONTRADICTED]. Use CONFIRMED/PRIMARY_SOURCE_ONLY if official primary source (OpenAI, DeepMind, Anthropic, Meta, arXiv) exists.
6. WHY IT MATTERS: 1-2 concise sentences explaining why a developer, researcher, or executive should care.
7. CLAIMS: Extract 1-3 distinct factual claims and classify their type: [FACT, COMPANY_CLAIM, MEDIA_REPORT, SPECULATION, OPINION].
8. NO HALLUCINATIONS: Do not invent stats, dates, URLs, or bench results not in the source text. If missing, specify "Not established by available sources."

Articles Coverage:
${articleContexts}

Return ONLY valid JSON matching this schema:
{
  "canonical_title": "Factual non-clickbait title",
  "summary": "2-3 sentence clear summary of what occurred",
  "detailed_summary": "In-depth summary including facts, specs, or context",
  "why_it_matters": "Why this matters to AI practitioners",
  "category": "Category name",
  "priority": "CRITICAL | HIGH | MEDIUM | LOW",
  "importance_score": 85,
  "confidence_score": 90,
  "verification_status": "CONFIRMED | PRIMARY_SOURCE_ONLY | MULTI_SOURCE_REPORTED | REPORTED | UNVERIFIED | CONTRADICTED",
  "claims": [
    {
      "claim_text": "Factual statement",
      "claim_type": "FACT | COMPANY_CLAIM | MEDIA_REPORT | SPECULATION | OPINION",
      "verified": true,
      "confidence": 90
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const jsonText = response.text();
    const result = JSON.parse(jsonText);
    return result;

  } catch (err) {
    console.error('[Gemini Analysis Error]:', err.message || err);
    // Fall back safely if API call fails
    return fallbackAnalysis(leadArticle, { name: sourceName, type: sourceType, credibilityTier: primarySource?.credibilityTier || 2 });
  }
}
