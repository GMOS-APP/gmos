import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Waypoints, ChevronRight } from 'lucide-react';

export default function ActiveThreads({ threads = [] }) {
  if (threads.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-600 text-sm">
        No active threads yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {threads.map((thread) => (
        <Link
          key={thread.id}
          to={createPageUrl('EntityDetail') + `?id=${thread.id}&campaign_id=${thread.campaign_id}`}
          className="flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors group"
        >
          <Waypoints className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100">
              {thread.name}
            </p>
            {thread.summary && (
              <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{thread.summary}</p>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-500 mt-0.5" />
        </Link>
      ))}
    </div>
  );
}