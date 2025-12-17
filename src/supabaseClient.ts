import { createClient } from '@supabase/supabase-js'

// Read environment variables (Vite requires the VITE_ prefix)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Verify if the keys are present in the environment
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or ANON Key missing in environment variables. Check your .env file.')
}

// Initialize the client and export it to be used throughout the application
export const supabase = createClient(supabaseUrl, supabaseAnonKey)