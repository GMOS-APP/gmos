import { createClient } from '@supabase/supabase-js';

// Trim — the deployed env secret can carry trailing whitespace/newline, which is
// tolerated by HTTP headers but corrupts the Realtime WebSocket apikey query
// param (spaces → "+"), breaking live updates. Trimming keeps realtime working.
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
