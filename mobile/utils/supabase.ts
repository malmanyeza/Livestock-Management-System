import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://butvnybdghgzkiapitop.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1dHZueWJkZ2hnemtpYXBpdG9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU0ODM1ODksImV4cCI6MjExMTA1OTU4OX0.eCqGLQzPb468cscyDYAPmQkBnbbtw20DtYpacY8QOS0';

console.log("[supabase.ts] url:", supabaseUrl);
console.log("[supabase.ts] key prefix:", supabaseAnonKey ? supabaseAnonKey.substring(0, 15) : "none");

const isUrlValid = (url: string) => {
  return url.startsWith('http://') || url.startsWith('https://');
};

const isValidConfig =
  isUrlValid(supabaseUrl) &&
  supabaseAnonKey &&
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

console.log("[supabase.ts] isValidConfig:", isValidConfig);

if (!isValidConfig) {
  console.warn(
    'Supabase environment variables (EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY) are not set or are invalid. App will operate in offline mock mode.'
  );
}

export const supabase = isValidConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
