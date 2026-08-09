import { normalizeUrl, normalizeText, hashString } from '../src/lib/rss.js';
import { calculateTitleSimilarity } from '../src/lib/clustering.js';
import { generateDigestContent } from '../src/lib/email.js';

console.log('🧪 RUNNING AI NEWS RADAR UNIT TESTS...');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

// Test 1: URL Normalization
const dirtyUrl = 'https://openai.com/index/o3?utm_source=twitter&utm_medium=social&fbclid=12345';
const cleanUrl = normalizeUrl(dirtyUrl);
assert(cleanUrl === 'https://openai.com/index/o3', `URL tracking params removed cleanly (${cleanUrl})`);

// Test 2: Text Normalization
const messyText = '  OpenAI   launches\n\n  new   model  ';
const cleanText = normalizeText(messyText);
assert(cleanText === 'OpenAI launches new model', `Text whitespace normalized cleanly ("${cleanText}")`);

// Test 3: Hash String Consistency
const hash1 = hashString('OpenAI launches GPT-5');
const hash2 = hashString('openai launches gpt-5 ');
assert(hash1 === hash2, `Hash string is case and whitespace insensitive`);

// Test 4: Duplicate Title Similarity (Anti-duplicate detection)
const titleA = 'OpenAI launches new o3 reasoning model';
const titleB = 'OpenAI unveils new o3 reasoning model';
const titleC = 'Google DeepMind announces Gemini 2.5 update';

const simSame = calculateTitleSimilarity(titleA, titleB);
const simDiff = calculateTitleSimilarity(titleA, titleC);

assert(simSame > 0.60, `High similarity detected for duplicate coverage (${(simSame*100).toFixed(0)}%)`);
assert(simDiff < 0.20, `Low similarity detected for distinct stories (${(simDiff*100).toFixed(0)}%)`);

// Test 5: Email Digest Generation
const dummyEvent = [{
  id: 'ev-1',
  canonicalTitle: 'OpenAI o3 Released',
  summary: 'OpenAI released its o3 model.',
  whyItMatters: 'Advances AI reasoning.',
  importanceScore: 98,
  verificationStatus: 'CONFIRMED',
  eventArticles: [{ article: { source: { name: 'OpenAI' }, url: 'https://openai.com' } }]
}];
const html = generateDigestContent(dummyEvent, [], [], '2026-08-09');
assert(html.includes('OpenAI o3 Released'), 'Digest HTML contains event title');
assert(html.includes('Why it matters'), 'Digest HTML contains Why It Matters section');

console.log(`\n📊 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);

if (failed > 0) {
  process.exit(1);
}
