import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Variabel lingkungan Supabase tidak ditemukan. Pastikan file .env.local berada di root folder proyek dan berisi URL serta ANON_KEY."
  );
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);