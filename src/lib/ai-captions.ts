// AI Caption Generator — generates 3 style-matched caption options

interface StyleProfile {
  tone?: string | null;
  emojiStyle?: string | null;
  hashtagStyle?: string | null;
  captionLength?: string | null;
  favoriteEmojis?: string | null;
  favoriteHashtags?: string | null;
  sampleCaptions?: string | null;
}

interface GenerateOptions {
  format: 'story' | 'post' | 'reel';
  platforms: string[];
  mediaType: 'photo' | 'video';
  brandName: string;
  industry?: string | null;
  language: string;
  styleProfile?: StyleProfile | null;
  customPrompt?: string;
}

interface CaptionOption {
  caption: string;
  hashtags: string[];
  style: string; // "on-brand", "trendy", "minimal"
}

export interface CaptionResult {
  options: CaptionOption[];
  aiUsage?: { inputTokens: number; outputTokens: number; model: string };
}

function buildStyleContext(profile: StyleProfile | null | undefined): string {
  if (!profile) return 'No style profile available. Generate diverse options.';

  const parts: string[] = [];
  if (profile.tone) parts.push(`Tone: ${profile.tone}`);
  if (profile.emojiStyle) parts.push(`Emoji usage: ${profile.emojiStyle}`);
  if (profile.hashtagStyle) parts.push(`Hashtag style: ${profile.hashtagStyle}`);
  if (profile.captionLength) parts.push(`Caption length: ${profile.captionLength}`);
  if (profile.favoriteEmojis) {
    try { parts.push(`Favorite emojis: ${JSON.parse(profile.favoriteEmojis).join(' ')}`); } catch { /* skip */ }
  }
  if (profile.favoriteHashtags) {
    try { parts.push(`Go-to hashtags: ${JSON.parse(profile.favoriteHashtags).join(', ')}`); } catch { /* skip */ }
  }
  if (profile.sampleCaptions) {
    try {
      const samples = JSON.parse(profile.sampleCaptions) as string[];
      if (samples.length > 0) {
        parts.push(`Sample past captions:\n${samples.slice(0, 5).map((s, i) => `  ${i + 1}. "${s}"`).join('\n')}`);
      }
    } catch { /* skip */ }
  }
  return parts.length > 0 ? parts.join('\n') : 'No style profile available.';
}

export async function generateCaptions(options: GenerateOptions): Promise<CaptionResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  const styleContext = buildStyleContext(options.styleProfile);
  const langInstruction = options.language === 'he'
    ? 'Write ALL captions in Hebrew. Use right-to-left text direction.'
    : 'Write captions in English.';

  const prompt = `You are a social media expert. Generate exactly 3 caption options for a ${options.mediaType} ${options.format} on ${options.platforms.join(', ')}.

Brand: ${options.brandName}
${options.industry ? `Industry: ${options.industry}` : ''}
${options.customPrompt ? `Client notes: ${options.customPrompt}` : ''}

${langInstruction}

Style profile:
${styleContext}

Generate 3 distinct options:
1. "on-brand" — matches their existing style closely
2. "trendy" — uses current social media trends, hooks, and viral patterns
3. "minimal" — clean, short, impactful

For each option, provide:
- caption (the actual post text, without hashtags)
- hashtags (array of 3-8 relevant hashtags without #)
- style (one of: "on-brand", "trendy", "minimal")

Respond ONLY with valid JSON array:
[{"caption":"...","hashtags":["..."],"style":"..."},...]`;

  // If no API key, generate smart fallback options
  if (!apiKey) {
    return { options: generateFallbackCaptions(options) };
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      console.error('AI API error:', res.status);
      return { options: generateFallbackCaptions(options) };
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || '';

    // Extract token usage from Anthropic response
    const aiUsage = data.usage ? {
      inputTokens: data.usage.input_tokens as number,
      outputTokens: data.usage.output_tokens as number,
      model: 'claude-haiku-4',
    } : undefined;

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return { options: generateFallbackCaptions(options) };

    const parsed = JSON.parse(jsonMatch[0]) as CaptionOption[];
    if (!Array.isArray(parsed) || parsed.length < 3) return { options: generateFallbackCaptions(options) };

    return { options: parsed.slice(0, 3), aiUsage };
  } catch (err) {
    console.error('AI caption generation failed:', err);
    return { options: generateFallbackCaptions(options) };
  }
}

function generateFallbackCaptions(options: GenerateOptions): CaptionOption[] {
  const isHe = options.language === 'he';
  const name = options.brandName;

  if (isHe) {
    return [
      {
        caption: `תוכן חדש מ-${name}! עקבו אחרינו לעוד עדכונים`,
        hashtags: ['תוכן', 'חדש', 'עסקים', name.replace(/\s/g, '')],
        style: 'on-brand',
      },
      {
        caption: `שמרו את הפוסט הזה! ${name} מביאים לכם משהו מיוחד`,
        hashtags: ['טרנדי', 'חייביםלראות', 'ישראל', name.replace(/\s/g, '')],
        style: 'trendy',
      },
      {
        caption: name,
        hashtags: [name.replace(/\s/g, '')],
        style: 'minimal',
      },
    ];
  }

  return [
    {
      caption: `New from ${name}! Follow us for more updates and behind-the-scenes content.`,
      hashtags: ['new', 'content', 'brand', name.replace(/\s/g, '').toLowerCase()],
      style: 'on-brand',
    },
    {
      caption: `Save this post! ${name} is bringing you something special. Stay tuned.`,
      hashtags: ['trending', 'mustfollow', 'viral', name.replace(/\s/g, '').toLowerCase()],
      style: 'trendy',
    },
    {
      caption: name,
      hashtags: [name.replace(/\s/g, '').toLowerCase()],
      style: 'minimal',
    },
  ];
}
