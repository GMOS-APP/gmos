import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PageNotFound() {
  return (
    <div className="dark min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl font-bold text-zinc-800">404</p>
        <p className="text-sm text-zinc-500 mt-3">Page not found</p>
        <Link
          to={createPageUrl('CampaignList')}
          className="inline-block mt-6 text-xs text-amber-400 hover:text-amber-300 underline underline-offset-4"
        >
          Back to campaigns
        </Link>
      </div>
    </div>
  );
}