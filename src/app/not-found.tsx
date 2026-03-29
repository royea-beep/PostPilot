import { Rocket } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Rocket className="w-6 h-6 text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-[#e5e5e5] mb-2">Page not found</h1>
        <p className="text-sm text-[#9ca3af] mb-6">The page you're looking for doesn't exist or has been moved.</p>
        <a href="/" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors">
          Back to Home
        </a>
      </div>
    </div>
  );
}
