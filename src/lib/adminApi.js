import { supabase } from '@/api/supabaseClient';

// Calls the server-verified admin-api edge function and unwraps its result.
// Shared by AdminConsole and the per-section admin components.
export function callAdmin(body) {
  return supabase.functions.invoke('admin-api', { body }).then(({ data, error }) => {
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  });
}

// Shared input/card/row styling — light/dark aware.
export const INPUT = 'rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500/50';
export const CARD = 'rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40';
export const ROW = 'rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40';
