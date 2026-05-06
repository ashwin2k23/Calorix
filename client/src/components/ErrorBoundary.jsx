import { Component } from 'react';
import { Button } from '@/components/ui/button';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center p-8 rounded-2xl bg-card/40 border border-white/10 backdrop-blur-md">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-muted-foreground text-sm mb-6 font-mono bg-black/20 p-3 rounded-xl">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => this.setState({ hasError: false, error: null })} variant="outline" className="rounded-xl border-white/10">
                Try Again
              </Button>
              <Button onClick={() => window.location.reload()} className="rounded-xl bg-gradient-to-r from-primary to-[#00c2ff]">
                Reload App
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
