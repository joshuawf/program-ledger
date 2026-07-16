import { createClient } from '@supabase/supabase-js';

// These come from a .env.local file (for local dev) or from GitHub Actions
// secrets injected as build-time env vars (for the deployed site). Neither
// value is secret in a security sense — the anon key is meant to be public
// and is safe to ship in client-side code, as long as Row Level Security
// policies on the tables are set correctly (see supabase-setup.sql).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = supabaseEnabled
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!supabaseEnabled && typeof window !== 'undefined') {
  console.warn(
    'Supabase env vars are missing — retirements and lineage links will only persist in this browser tab, not across sessions. See README.md.'
  );
}
