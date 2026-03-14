/**
 * PostPilot Learning Hooks
 *
 * Fire-and-forget event tracking — never throws, never blocks.
 * Batched queue: flushes at 20 events or every 10 seconds.
 * Uses sendBeacon on page unload (web).
 */

const PROJECT = 'postpilot';
const VERSION = '1.0.0';

interface LearningEvent {
  project: string;
  version: string;
  event: string;
  category: string;
  value?: number;
  metadata?: Record<string, unknown>;
  sessionId: string;
  ts: string;
}

let queue: LearningEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let sessionId: string = '';

function getSessionId(): string {
  if (sessionId) return sessionId;
  sessionId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return sessionId;
}

function enqueue(event: string, category: string, value?: number, metadata?: Record<string, unknown>): void {
  try {
    queue.push({
      project: PROJECT,
      version: VERSION,
      event,
      category,
      value,
      metadata,
      sessionId: getSessionId(),
      ts: new Date().toISOString(),
    });

    if (queue.length >= 20) {
      flush();
    }
  } catch {
    // Fire-and-forget: never throw
  }
}

function flush(): void {
  if (queue.length === 0) return;

  const batch = [...queue];
  queue = [];

  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(batch)], { type: 'application/json' });
      navigator.sendBeacon('/api/learn', blob);
    } else {
      fetch('/api/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      }).catch(() => {});
    }
  } catch {
    // Fire-and-forget: never throw
  }
}

/** Initialize timer and unload listener (call once on app mount) */
function init(): void {
  if (typeof window === 'undefined') return;

  if (!flushTimer) {
    flushTimer = setInterval(flush, 10_000);
  }

  window.addEventListener('beforeunload', () => {
    flush();
  });
}

// ─── Public Learning Hooks ───────────────────────────────────────────

function postGenerated(platform: string, style: string, captionLength: number): void {
  enqueue('post_generated', 'content', captionLength, { platform, style });
}

function postCopied(platform: string): void {
  enqueue('post_copied', 'engagement', undefined, { platform });
}

function postPublished(platform: string, engagement?: number): void {
  enqueue('post_published', 'engagement', engagement, { platform });
}

function styleAnalyzed(postsCount: number, dnaScore: number): void {
  enqueue('style_analyzed', 'intelligence', dnaScore, { postsCount });
}

function scheduledPost(platform: string, scheduledFor: string): void {
  enqueue('scheduled_post', 'content', undefined, { platform, scheduledFor });
}

function brandCreated(brandName: string): void {
  enqueue('brand_created', 'onboarding', undefined, { brandName });
}

function platformConnected(platform: string): void {
  enqueue('platform_connected', 'onboarding', undefined, { platform });
}

function planUpgraded(fromPlan: string, toPlan: string): void {
  enqueue('plan_upgraded', 'billing', undefined, { fromPlan, toPlan });
}

export const PostPilotHooks = {
  init,
  flush,
  postGenerated,
  postCopied,
  postPublished,
  styleAnalyzed,
  scheduledPost,
  brandCreated,
  platformConnected,
  planUpgraded,
} as const;

// ─── Server-side helper (import in API routes) ──────────────────────

/**
 * Server-side learning event emitter.
 * Sends directly to the learn endpoint without batching.
 */
export function emitServerEvent(
  event: string,
  category: string,
  value?: number,
  metadata?: Record<string, unknown>,
): void {
  try {
    const payload: LearningEvent = {
      project: PROJECT,
      version: VERSION,
      event,
      category,
      value,
      metadata,
      sessionId: `server-${Date.now()}`,
      ts: new Date().toISOString(),
    };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    fetch(`${appUrl}/api/learn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([payload]),
    }).catch(() => {});
  } catch {
    // Fire-and-forget: never throw
  }
}
