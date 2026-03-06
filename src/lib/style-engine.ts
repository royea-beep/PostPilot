import { prisma } from '@/lib/db';

// --- Keyword sets for tone classification ---

const CASUAL_WORDS = new Set([
  'hey', 'lol', 'vibes', 'chill', 'gonna', 'wanna', 'yep', 'nope',
  'btw', 'tbh', 'imo', 'fyi', 'haha', 'omg', 'brb', 'ngl',
]);

const PROFESSIONAL_WORDS = new Set([
  'professional', 'strategy', 'growth', 'business', 'enterprise',
  'revenue', 'optimize', 'leverage', 'innovate', 'solution',
  'analytics', 'insights', 'roi', 'kpi', 'stakeholder',
]);

const PLAYFUL_WORDS = new Set([
  'amazing', 'love', 'wow', 'awesome', 'incredible', 'yay',
  'gorgeous', 'stunning', 'obsessed', 'perfect', 'dreamy', 'magical',
]);

// Matches most Unicode emoji (covers emoji presentation sequences)
const EMOJI_REGEX = /\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu;

// --- Helper: extract all emojis from a string ---
function extractEmojis(text: string): string[] {
  return text.match(EMOJI_REGEX) ?? [];
}

// --- Helper: classify tone from captions ---
function classifyTone(captions: string[]): string {
  const scores = { casual: 0, professional: 0, playful: 0 };

  for (const caption of captions) {
    const words = caption.toLowerCase().split(/\s+/);
    for (const word of words) {
      const cleaned = word.replace(/[^a-z]/g, '');
      if (CASUAL_WORDS.has(cleaned)) scores.casual++;
      if (PROFESSIONAL_WORDS.has(cleaned)) scores.professional++;
      if (PLAYFUL_WORDS.has(cleaned)) scores.playful++;
    }
  }

  const max = Math.max(scores.casual, scores.professional, scores.playful);
  if (max === 0) return 'casual';
  if (scores.professional === max) return 'professional';
  if (scores.playful === max) return 'playful';
  return 'casual';
}

// --- Helper: classify emoji usage ---
function classifyEmojiStyle(captions: string[]): string {
  if (captions.length === 0) return 'none';
  const total = captions.reduce((sum, c) => sum + extractEmojis(c).length, 0);
  const avg = total / captions.length;
  if (avg > 3) return 'heavy';
  if (avg > 0.5) return 'moderate';
  return 'none';
}

// --- Helper: classify hashtag density ---
function classifyHashtagStyle(hashtagCounts: number[]): string {
  if (hashtagCounts.length === 0) return 'none';
  const total = hashtagCounts.reduce((sum, n) => sum + n, 0);
  const avg = total / hashtagCounts.length;
  if (avg > 7) return 'many';
  if (avg > 2) return 'moderate';
  if (avg > 0) return 'minimal';
  return 'none';
}

// --- Helper: classify caption length ---
function classifyCaptionLength(captions: string[]): string {
  if (captions.length === 0) return 'short';
  const total = captions.reduce((sum, c) => sum + c.length, 0);
  const avg = total / captions.length;
  if (avg < 50) return 'short';
  if (avg < 150) return 'medium';
  return 'long';
}

// --- Helper: top N from frequency map ---
function topN<T>(items: T[], n: number): T[] {
  const freq = new Map<T, number>();
  for (const item of items) {
    freq.set(item, (freq.get(item) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([val]) => val);
}

// --- Helper: compute posting patterns ---
function computePostingPatterns(dates: Date[]): {
  avgPostsPerWeek: number;
  mostActiveDay: number;
  mostActiveHour: number;
} {
  if (dates.length === 0) {
    return { avgPostsPerWeek: 0, mostActiveDay: 0, mostActiveHour: 0 };
  }

  // Day-of-week and hour frequency
  const dayFreq = new Array<number>(7).fill(0);
  const hourFreq = new Array<number>(24).fill(0);

  for (const d of dates) {
    dayFreq[d.getDay()]++;
    hourFreq[d.getHours()]++;
  }

  const mostActiveDay = dayFreq.indexOf(Math.max(...dayFreq));
  const mostActiveHour = hourFreq.indexOf(Math.max(...hourFreq));

  // Average posts per week
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const spanMs = sorted[sorted.length - 1].getTime() - sorted[0].getTime();
  const spanWeeks = Math.max(spanMs / (7 * 24 * 60 * 60 * 1000), 1);
  const avgPostsPerWeek = Math.round((dates.length / spanWeeks) * 10) / 10;

  return { avgPostsPerWeek, mostActiveDay, mostActiveHour };
}

// --- Main export ---

export async function analyzeAndUpdateStyleProfile(brandId: string): Promise<void> {
  // 1. Fetch all published posts for the brand
  const posts = await prisma.post.findMany({
    where: {
      brandId,
      status: 'PUBLISHED',
    },
    orderBy: { publishedAt: 'desc' },
    select: {
      caption: true,
      hashtags: true,
      publishedAt: true,
    },
  });

  if (posts.length === 0) {
    // Upsert with zeroed-out profile
    await prisma.styleProfile.upsert({
      where: { brandId },
      create: { brandId, analyzedPostCount: 0, lastAnalyzedAt: new Date() },
      update: { analyzedPostCount: 0, lastAnalyzedAt: new Date() },
    });
    return;
  }

  // 2. Extract data
  const captions = posts.map((p) => p.caption);
  const hashtagArrays = posts.map((p) => {
    try {
      return JSON.parse(p.hashtags) as string[];
    } catch {
      return [] as string[];
    }
  });
  const allHashtags = hashtagArrays.flat();
  const hashtagCounts = hashtagArrays.map((arr) => arr.length);
  const allEmojis = captions.flatMap(extractEmojis);
  const publishDates = posts
    .map((p) => p.publishedAt)
    .filter((d): d is Date => d !== null);

  // 3. Analyze patterns
  const tone = classifyTone(captions);
  const emojiStyle = classifyEmojiStyle(captions);
  const hashtagStyle = classifyHashtagStyle(hashtagCounts);
  const captionLength = classifyCaptionLength(captions);
  const favoriteEmojis = JSON.stringify(topN(allEmojis, 5));
  const favoriteHashtags = JSON.stringify(topN(allHashtags, 10));
  const sampleCaptions = JSON.stringify(captions.slice(0, 10));
  const postingPatterns = JSON.stringify(computePostingPatterns(publishDates));

  // 4. Upsert the style profile
  await prisma.styleProfile.upsert({
    where: { brandId },
    create: {
      brandId,
      tone,
      emojiStyle,
      hashtagStyle,
      captionLength,
      favoriteEmojis,
      favoriteHashtags,
      sampleCaptions,
      postingPatterns,
      analyzedPostCount: posts.length,
      lastAnalyzedAt: new Date(),
    },
    update: {
      tone,
      emojiStyle,
      hashtagStyle,
      captionLength,
      favoriteEmojis,
      favoriteHashtags,
      sampleCaptions,
      postingPatterns,
      analyzedPostCount: posts.length,
      lastAnalyzedAt: new Date(),
    },
  });
}
