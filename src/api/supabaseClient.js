import { createClient } from '@supabase/supabase-js';

// Strip ALL whitespace (not just the ends): a pasted env secret can carry a
// line-break in the MIDDLE (long JWTs wrap on paste), which .trim() leaves in
// place. That corrupts the `apikey` request header → fetch throws "Invalid
// value" and auth/realtime silently break. URLs and JWTs contain no legitimate
// whitespace, so removing all of it is safe and makes us env-paste-proof.
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\s+/g, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').replace(/\s+/g, '');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
