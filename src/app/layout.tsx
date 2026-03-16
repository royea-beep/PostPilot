import type { Metadata } from 'next';
import { AuthProvider } from '@royea/shared-utils/auth-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LanguageProvider } from '@/lib/language-context';
import { EventsQueueProvider } from '@/lib/events-queue-context';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ProjectLearner } from '@/components/ProjectLearner';
import { ShareButton } from '@/components/ShareButton';
import { BugReporterInit } from '@/components/BugReporterInit';
import { ErrorLoggerInit } from '@/components/ErrorLoggerInit';
import { CookieConsent } from '@/components/CookieConsent';
import './globals.css';

export const metadata: Metadata = {
  title: 'PostPilot — Social Media Scheduling',
  description: 'Schedule and manage social media posts across platforms with AI-powered captions',
  openGraph: {
    title: 'PostPilot — Social Media Scheduling',
    description: 'Schedule and manage social media posts across platforms with AI-powered captions',
    url: 'https://postpilot.ftable.co.il',
    siteName: 'PostPilot',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PostPilot — Social Media Scheduling',
    description: 'Schedule and manage social media posts across platforms with AI-powered captions',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <LanguageProvider>
          <EventsQueueProvider>
            <ErrorBoundary><AuthProvider storageKey="postpilot_auth" refreshEndpoint="/api/auth/refresh">{children as never}</AuthProvider></ErrorBoundary>
            <LanguageToggle />
          </EventsQueueProvider>
        </LanguageProvider>
        <ProjectLearner />
        <CookieConsent />
        <ShareButton />
        <BugReporterInit />
        <ErrorLoggerInit />
      </body>
    </html>
  );
}
