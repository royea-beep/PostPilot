'use client';

import { useState, useEffect, useCallback } from 'react';

interface FeedbackWidgetProps {
  appName: string;
}

export function FeedbackWidget({ appName }: FeedbackWidgetProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<'prompt' | 'negative' | 'done'>('prompt');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Never show again if already submitted
    if (localStorage.getItem('feedback_widget_done')) return;

    // Track page visits
    const visits = parseInt(localStorage.getItem('feedback_widget_visits') || '0', 10) + 1;
    localStorage.setItem('feedback_widget_visits', String(visits));

    if (visits >= 3) {
      // Small delay so it doesn't pop in immediately on page load
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const submit = useCallback(
    async (rating: 'positive' | 'negative', msg?: string) => {
      setSubmitting(true);
      try {
        // PostPilot uses Neon — send feedback to analyzer's Supabase (same as bug reporter)
        const supabaseUrl = process.env.NEXT_PUBLIC_BUG_REPORTER_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_BUG_REPORTER_SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseKey) return;

        await fetch(`${supabaseUrl}/rest/v1/user_feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            app_name: appName,
            rating,
            message: msg || null,
            url: location.href,
          }),
        });
      } catch {
        // Silently fail — feedback is non-critical
      } finally {
        localStorage.setItem('feedback_widget_done', '1');
        setStep('done');
        setSubmitting(false);
        setTimeout(() => setVisible(false), 2000);
      }
    },
    [appName],
  );

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 72,
        right: 16,
        zIndex: 9998,
        maxWidth: 280,
        width: '100%',
        background: 'rgba(15, 17, 25, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 14,
        padding: '14px 16px',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {step === 'prompt' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, marginBottom: 10, opacity: 0.9 }}>?מה דעתך</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => submit('positive')}
              disabled={submitting}
              style={{
                fontSize: 28,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 8,
                transition: 'transform 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              aria-label="Positive feedback"
            >
              👍
            </button>
            <button
              onClick={() => setStep('negative')}
              disabled={submitting}
              style={{
                fontSize: 28,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 8,
                transition: 'transform 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              aria-label="Negative feedback"
            >
              👎
            </button>
          </div>
          <button
            onClick={() => {
              localStorage.setItem('feedback_widget_done', '1');
              setVisible(false);
            }}
            style={{
              marginTop: 8,
              fontSize: 11,
              color: 'rgba(255,255,255,0.4)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            לא עכשיו
          </button>
        </div>
      )}

      {step === 'negative' && (
        <div>
          <div style={{ fontSize: 13, marginBottom: 8, opacity: 0.9 }}>?מה אפשר לשפר</div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            dir="rtl"
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              color: '#fff',
              padding: 8,
              fontSize: 13,
              resize: 'none',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            placeholder="כתבו כאן..."
          />
          <button
            onClick={() => submit('negative', message)}
            disabled={submitting || !message.trim()}
            style={{
              marginTop: 8,
              width: '100%',
              padding: '8px 0',
              background: submitting || !message.trim() ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.8)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              cursor: submitting || !message.trim() ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {submitting ? '...שולח' : 'שלח'}
          </button>
        </div>
      )}

      {step === 'done' && (
        <div style={{ textAlign: 'center', fontSize: 16, padding: '4px 0' }}>
          תודה! 🙏
        </div>
      )}
    </div>
  );
}
