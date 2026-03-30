// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

// Singleton — survit aux rechargements HMR de Vite
// Sans ça, chaque HMR crée un nouveau client qui attend 5000ms pour le lock de l'ancien
const KEY = '__supabase_stadium__'

if (!globalThis[KEY]) {
  globalThis[KEY] = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      auth: {
        storageKey:         'sb-stadium-auth',
        persistSession:     true,
        autoRefreshToken:   true,
        detectSessionInUrl: false,
        // Désactive navigator.locks pour éviter les conflits de lock
        // (safe pour usage single-tab)
        lock: (_name, _timeout, fn) => fn(),
      }
    }
  )
}

export const supabase = globalThis[KEY]