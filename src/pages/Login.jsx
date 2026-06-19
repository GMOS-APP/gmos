import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import AuthPanel from '@/components/layout/AuthPanel';
import BetaBadge from '@/components/common/BetaBadge';
import { ArrowLeft } from 'lucide-react';

// Dedicated sign-in page. The landing page links here instead of an inline form.
export default function Login() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { document.title = 'Sign in — GM/OS'; }, []);

  // Already signed in → bounce into the app.
  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, isLoadingAuth, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-zinc-950 px-4 py-10">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <span className="text-2xl font-bold tracking-wide text-zinc-900 dark:text-zinc-100">
          GM<span className="text-amber-500">/OS</span>
        </span>
        <BetaBadge />
      </Link>

      <AuthPanel />

      <Link to="/" className="mt-6 inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to home
      </Link>
    </div>
  );
}
