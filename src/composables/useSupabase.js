import { createClient } from '@supabase/supabase-js'

let supabaseClient = null

/**
 * Composable for accessing the Supabase client instance
 * @returns {Object} Object containing the Supabase client
 * @throws {Error} If required environment variables are missing
 */
export const useSupabase = () => {
  if (!supabaseClient) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    // Validate environment variables with specific error messages
    const missingVars = []
    if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL')
    if (!supabaseKey) missingVars.push('VITE_SUPABASE_ANON_KEY')

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}. ` +
        'Please copy .env.example to .env and add your Supabase credentials.'
      )
    }

    // Validate URL format
    try {
      new URL(supabaseUrl)
    } catch {
      throw new Error(
        'VITE_SUPABASE_URL is not a valid URL. ' +
        'Expected format: https://your-project-ref.supabase.co'
      )
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey)
  }

  return { supabase: supabaseClient }
}
