import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://odtlbpsjwhlmiwgmkrxa.supabase.co'
export const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kdGxicHNqd2hsbWl3Z21rcnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNjIyMDEsImV4cCI6MjA5NjczODIwMX0.owMEl-lvuaRE8stDdCoAH0q3ln4EDxNZ5PhJy0trozA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
