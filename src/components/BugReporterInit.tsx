'use client';

import { BugReporterButton } from './BugReporterModal';

export function BugReporterInit() {
  const url = process.env.NEXT_PUBLIC_BUG_REPORTER_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_BUG_REPORTER_SUPABASE_KEY;
  if (!url || !key) return null;

  return (
    <BugReporterButton options={{
      supabaseUrl: url,
      supabaseAnonKey: key,
      projectName: 'postpilot',
      appVersion: '1.0.5',
      githubRepo: 'royea-beep/PostPilot',
      language: 'he',
    }} />
  );
}
