import { createClient } from '@supabase/supabase-js'

let supabaseClient = null

export const useSupabase = () => {
  if (!supabaseClient) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey)
  }

  return { supabase: supabaseClient }
}
