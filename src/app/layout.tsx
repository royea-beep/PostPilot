import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LanguageProvider } from '@/lib/language-context';
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
    <html lang="en">
      <body className="min-h-screen antialiased">
        <LanguageProvider>
          <ErrorBoundary><AuthProvider>{children}</AuthProvider></ErrorBoundary>
          <LanguageToggle />
        </LanguageProvider>
        <ProjectLearner />
        <CookieConsent />
        <ShareButton />
      </body>
    </html>
  );
}
