'use client';

import { useEffect } from 'react';

export function BugReporterInit() {
  useEffect(() => {
    // PostPilot uses Neon/Prisma, not Supabase.
    // Bug reporter sends directly to the analyzer Supabase project.
    const url = process.env.NEXT_PUBLIC_BUG_REPORTER_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_BUG_REPORTER_SUPABASE_KEY;
    if (!url || !key) return;

    import('../../../analyzer-standalone/packages/bug-reporter').then(({ initBugReporter }) => {
      initBugReporter({
        supabaseUrl: url,
        supabaseKey: key,
        projectName: 'postpilot',
        version: '1.0.1',
        position: 'bottom-left',
      });
    });

    return () => {
      import('../../../analyzer-standalone/packages/bug-reporter').then(({ destroyBugReporter }) => {
        destroyBugReporter();
      });
    };
  }, []);

  return null;
}
