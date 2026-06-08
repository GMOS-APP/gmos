import React from 'react';
import { reportError } from '@/lib/reportError';

// Catches render/runtime errors in its subtree and shows a friendly fallback
// instead of a white screen. `scope="window"` renders a compact inline fallback
// (so one crashing desktop window doesn't take down the whole app); the default
// renders a full-screen fallback. Pass `resetKey` (e.g. a route/url) to auto-
// recover when the user navigates elsewhere.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    reportError(error, { componentStack: info?.componentStack, scope: this.props.scope });
  }

  componentDidUpdate(prev) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(() => this.setState({ error: null }));

    if (this.props.scope === 'window') {
      return (
        <div className="h-full flex flex-col items-center justify-center gap-2 p-6 text-center bg-white dark:bg-zinc-950">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">This window hit a snag.</p>
          <button onClick={() => this.setState({ error: null })}
            className="text-xs px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 font-medium">Try again</button>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center bg-zinc-950 text-zinc-100">
        <p className="text-amber-500 font-bold tracking-widest text-xs">GM/OS</p>
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="text-sm text-zinc-500 max-w-sm">An unexpected error knocked things over. Your data is safe — reloading usually fixes it.</p>
        <div className="flex gap-2 mt-1">
          <button onClick={() => window.location.reload()}
            className="px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-medium">Reload</button>
          <a href={import.meta.env.BASE_URL}
            className="px-3 py-1.5 rounded-md border border-zinc-700 hover:bg-zinc-800 text-sm">Back to campaigns</a>
        </div>
      </div>
    );
  }
}
