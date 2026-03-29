'use client';

import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean; error: string | null }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-12 h-12 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-[#ef4444] text-xl font-bold">!</span>
            </div>
            <h2 className="text-lg font-bold text-[#e5e5e5] mb-2">Something went wrong</h2>
            <p className="text-sm text-[#9ca3af] mb-4">{this.state.error}</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
