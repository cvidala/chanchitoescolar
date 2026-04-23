import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Node.js v25 expone localStorage como global pero sin archivo configurado falla.
// Usamos un storage no-op para que Supabase no lo toque.
const noopStorage = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {},
}

const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storage: noopStorage,
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, clientOptions)

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, clientOptions)
