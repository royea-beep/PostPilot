'use client';

import { useEffect } from 'react';
import { initErrorLogger } from '@/lib/error-logger';

export function ErrorLoggerInit() {
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_BUG_REPORTER_SUPABASE_URL;
    if (url) initErrorLogger('postpilot', url);
  }, []);

  return null;
}
