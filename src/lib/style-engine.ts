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

const CTA_PATTERNS = /\b(click|tap|link|swipe|check out|visit|shop|buy|order|dm|comment|share|follow|subscribe|sign up|learn more|get|grab)\b/i;
const SOFT_CTA_PATTERNS = /\b(what do you think|let me know|thoughts|tag a friend|save this|double tap)\b/i;

const HEBREW_REGEX = /[\u0590-\u05FF]/;
const ENGLISH_REGEX = /[a-zA-Z]/;

// Matches most Unicode emoji (covers emoji presentation sequences)
const EMOJI_REGEX = /\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu;

// --- Helpers ---

function extractEmojis(text: string): string[] {
  return text.match(EMOJI_REGEX) ?? [];
}

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

function classifyEmojiStyle(captions: string[]): string {
  if (captions.length === 0) return 'none';
  const total = captions.reduce((sum, c) => sum + extractEmojis(c).length, 0);
  const avg = total / captions.length;
  if (avg > 3) return 'heavy';
  if (avg > 0.5) return 'moderate';
  return 'none';
}

function classifyHashtagStyle(hashtagCounts: number[]): string {
  if (hashtagCounts.length === 0) return 'none';
  const total = hashtagCounts.reduce((sum, n) => sum + n, 0);
  const avg = total / hashtagCounts.length;
  if (avg > 7) return 'many';
  if (avg > 2) return 'moderate';
  if (avg > 0) return 'minimal';
  return 'none';
}

function classifyCaptionLength(captions: string[]): string {
  if (captions.length === 0) return 'short';
  const total = captions.reduce((sum, c) => sum + c.length, 0);
  const avg = total / captions.length;
  if (avg < 50) return 'short';
  if (avg < 150) return 'medium';
  return 'long';
}

function classifyCtaStyle(captions: string[]): string {
  if (captions.length === 0) return 'none';
  let direct = 0;
  let soft = 0;
  for (const c of captions) {
    if (CTA_PATTERNS.test(c)) direct++;
    else if (SOFT_CTA_PATTERNS.test(c)) soft++;
  }
  if (direct / captions.length > 0.4) return 'direct';
  if ((direct + soft) / captions.length > 0.3) return 'soft';
  return 'none';
}

function classifyLanguageMix(captions: string[]): string {
  let heCount = 0;
  let enCount = 0;
  for (const c of captions) {
    const hasHe = HEBREW_REGEX.test(c);
    const hasEn = ENGLISH_REGEX.test(c);
    if (hasHe && hasEn) { heCount++; enCount++; }
    else if (hasHe) heCount++;
    else if (hasEn) enCount++;
  }
  if (heCount > 0 && enCount > 0) {
    const ratio = Math.min(heCount, enCount) / Math.max(heCount, enCount);
    if (ratio > 0.3) return 'mixed';
  }
  if (heCount > enCount) return 'hebrew_only';
  return 'english_only';
}

function extractOpeners(captions: string[]): string[] {
  const openers: string[] = [];
  for (const c of captions) {
    const firstLine = c.split('\n')[0]?.trim();
    if (firstLine && firstLine.length > 0) {
      openers.push(firstLine.slice(0, 60));
    }
  }
  return topN(openers, 5);
}

function extractClosers(captions: string[]): string[] {
  const closers: string[] = [];
  for (const c of captions) {
    const lines = c.split('\n').filter(Boolean);
    const lastLine = lines[lines.length - 1]?.trim();
    if (lastLine && lastLine.length > 0) {
      closers.push(lastLine.slice(0, 60));
    }
  }
  return topN(closers, 5);
}

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

function computePostingPatterns(dates: Date[]): {
  avgPostsPerWeek: number;
  mostActiveDay: number;
  mostActiveHour: number;
} {
  if (dates.length === 0) {
    return { avgPostsPerWeek: 0, mostActiveDay: 0, mostActiveHour: 0 };
  }
  const dayFreq = new Array<number>(7).fill(0);
  const hourFreq = new Array<number>(24).fill(0);
  for (const d of dates) {
    dayFreq[d.getDay()]++;
    hourFreq[d.getHours()]++;
  }
  const mostActiveDay = dayFreq.indexOf(Math.max(...dayFreq));
  const mostActiveHour = hourFreq.indexOf(Math.max(...hourFreq));
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const spanMs = sorted[sorted.length - 1].getTime() - sorted[0].getTime();
  const spanWeeks = Math.max(spanMs / (7 * 24 * 60 * 60 * 1000), 1);
  const avgPostsPerWeek = Math.round((dates.length / spanWeeks) * 10) / 10;
  return { avgPostsPerWeek, mostActiveDay, mostActiveHour };
}

// --- Main export ---

export async function analyzeAndUpdateStyleProfile(brandId: string): Promise<void> {
  // Fetch all successfully published posts (supports both old and new status values)
  const posts = await prisma.post.findMany({
    where: {
      brandId,
      status: { in: ['SUCCESS', 'PUBLISHED'] },
    },
    orderBy: { publishedAt: 'desc' },
    select: {
      caption: true,
      hashtags: true,
      publishedAt: true,
    },
  });

  // Also fetch StyleEvents for richer data (user edits, chosen variants)
  const styleEvents = await prisma.styleEvent.findMany({
    where: { brandId, eventType: 'PUBLISH' },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      chosenCaption: true,
      finalCaption: true,
      chosenVariantIndex: true,
      detectedPatterns: true,
    },
  });

  if (posts.length === 0) {
    await prisma.styleProfile.upsert({
      where: { brandId },
      create: { brandId, analyzedPostCount: 0, lastAnalyzedAt: new Date() },
      update: { analyzedPostCount: 0, lastAnalyzedAt: new Date() },
    });
    return;
  }

  // Use finalCaption from StyleEvents where available (reflects user edits)
  const captions = styleEvents.length > 0
    ? styleEvents
        .map((e) => e.finalCaption || e.chosenCaption)
        .filter((c): c is string => !!c)
    : posts.map((p) => p.caption);

  // Use all captions if StyleEvents are few
  const allCaptions = captions.length >= 3 ? captions : posts.map((p) => p.caption);

  const hashtagArrays = posts.map((p) => {
    try { return JSON.parse(p.hashtags) as string[]; } catch { return [] as string[]; }
  });
  const allHashtags = hashtagArrays.flat();
  const hashtagCounts = hashtagArrays.map((arr) => arr.length);
  const allEmojis = allCaptions.flatMap(extractEmojis);
  const publishDates = posts.map((p) => p.publishedAt).filter((d): d is Date => d !== null);

  // Analyze patterns
  const tone = classifyTone(allCaptions);
  const emojiStyle = classifyEmojiStyle(allCaptions);
  const hashtagStyle = classifyHashtagStyle(hashtagCounts);
  const captionLength = classifyCaptionLength(allCaptions);
  const ctaStyle = classifyCtaStyle(allCaptions);
  const languageMix = classifyLanguageMix(allCaptions);
  const preferredOpeners = JSON.stringify(extractOpeners(allCaptions));
  const preferredClosers = JSON.stringify(extractClosers(allCaptions));
  const favoriteEmojis = JSON.stringify(topN(allEmojis, 5));
  const favoriteHashtags = JSON.stringify(topN(allHashtags, 10));
  const sampleCaptions = JSON.stringify(allCaptions.slice(0, 10));
  const postingPatterns = JSON.stringify(computePostingPatterns(publishDates));

  await prisma.styleProfile.upsert({
    where: { brandId },
    create: {
      brandId,
      tone,
      emojiStyle,
      hashtagStyle,
      captionLength,
      ctaStyle,
      languageMix,
      preferredOpeners,
      preferredClosers,
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
      ctaStyle,
      languageMix,
      preferredOpeners,
      preferredClosers,
      favoriteEmojis,
      favoriteHashtags,
      sampleCaptions,
      postingPatterns,
      analyzedPostCount: posts.length,
      lastAnalyzedAt: new Date(),
    },
  });
}
