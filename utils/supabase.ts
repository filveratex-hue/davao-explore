import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: {
      getItem: (key) => {
        if (typeof document === 'undefined') return null;
        const cookie = document.cookie.split('; ').find(row => row.trim().startsWith(`${key}=`));
        if (!cookie) return null;
        return decodeURIComponent(cookie.split('=')[1]);
      },
      setItem: (key, value) => {
        if (typeof document !== 'undefined') {
          document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`;
        }
      },
      removeItem: (key) => {
        if (typeof document !== 'undefined') {
          document.cookie = `${key}=; path=/; max-age=-1; SameSite=Lax`;
        }
      },
    },
  },
});