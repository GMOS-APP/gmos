import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

// Friendly inline error state for a failed query. Pass the query's `error` and
// its `refetch` so the user can retry without a full reload.
export default function QueryError({ error, onRetry, title = "Couldn't load this", className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 gap-3 ${className}`}>
      <AlertTriangle className="w-7 h-7 text-amber-500" />
      <div>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{title}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5 max-w-xs">
          {error?.message || 'Something went wrong fetching this data.'}
        </p>
      </div>
      {onRetry && (
        <button onClick={() => onRetry()}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 font-medium">
          <RotateCw className="w-3.5 h-3.5" /> Try again
        </button>
      )}
    </div>
  );
}
