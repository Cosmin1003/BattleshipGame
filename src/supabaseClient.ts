// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// Citim variabilele de mediu (Vite necesită prefixul VITE_)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Verificăm dacă cheile sunt prezente
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or ANON Key missing in environment variables. Check your .env file.')
}

// Inițializăm clientul și îl exportăm pentru a fi folosit în toată aplicația
export const supabase = createClient(supabaseUrl, supabaseAnonKey)