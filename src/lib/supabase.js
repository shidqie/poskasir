import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabasePublishableKey || supabaseUrl.includes('your-project')) {
  console.warn(
    '[Kasir Sembako] Kredensial Supabase belum dikonfigurasi. Harap periksa file .env dan masukkan VITE_SUPABASE_URL serta VITE_SUPABASE_PUBLISHABLE_KEY yang valid.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabasePublishableKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
