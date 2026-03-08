import type { Metadata } from 'next';
import { AuthProvider } from '@royea/shared-utils/auth-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LanguageProvider } from '@/lib/language-context';
import { EventsQueueProvider } from '@/lib/events-queue-context';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ProjectLearner } from '@/components/ProjectLearner';
import { ShareButton } from '@/components/ShareButton';
import { CookieConsent } from '@/components/CookieConsent';
import './globals.css';

export const metadata: Metadata = {
  title: 'PostPilot — AI Social Media Copilot',
  description: 'Upload content, pick a style, publish everywhere. AI learns your voice.',
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
      </body>
    </html>
  );
}
