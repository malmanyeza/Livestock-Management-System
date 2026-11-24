import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://butvnybdghgzkiapitop.supabase.co'
export const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1dHZueWJkZ2hnemtpYXBpdG9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU0ODM1ODksImV4cCI6MjExMTA1OTU4OX0.eCqGLQzPb468cscyDYAPmQkBnbbtw20DtYpacY8QOS0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
