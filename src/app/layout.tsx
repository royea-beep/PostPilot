import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import './globals.css';

export const metadata: Metadata = {
  title: 'PostPilot — AI Social Media Copilot',
  description: 'Upload content, pick a style, publish everywhere. AI learns your voice.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <ErrorBoundary><AuthProvider>{children}</AuthProvider></ErrorBoundary>
      </body>
    </html>
  );
}
