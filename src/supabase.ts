import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

function isSupabaseConfigValid(url: string | undefined, key: string | undefined) {
  if (!url || !key || url.includes('your-project') || key.startsWith('your-supabase-')) return false

  try {
    const parsedUrl = new URL(url)
    return parsedUrl.protocol === 'https:' || parsedUrl.hostname === 'localhost'
  } catch {
    return false
  }
}

export const supabaseConfigured = isSupabaseConfigValid(supabaseUrl, supabaseAnonKey)
export const supabase = supabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null
