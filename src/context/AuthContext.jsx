// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, phone, role, is_active, avatar_url, subscription_plan, subscription_until')
        .eq('id', userId)
        .single()
      setProfile(data || null)
    } catch {
      setProfile(null)
    }
  }

  async function refreshProfile() {
    if (user) await loadProfile(user.id)
  }

  useEffect(() => {
    let isMounted = true

    // Une seule source de vérité — onAuthStateChange gère INITIAL_SESSION en interne
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        if (
          event === 'INITIAL_SESSION' ||
          event === 'SIGNED_IN'       ||
          event === 'TOKEN_REFRESHED'
        ) {
          const u = session?.user ?? null
          setUser(u)
          if (u) await loadProfile(u.id)
          else setProfile(null)
          if (isMounted) setLoading(false)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          if (isMounted) setLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])
  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signUp({ email, password, fullName, phone, role = 'owner' }) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (data.user) {
      await supabase.from('profiles').update({
        role, phone: phone || '', full_name: fullName || ''
      }).eq('id', data.user.id)
    }
    return data
  }

  async function signOut() {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.warn('signOut error ignored:', e)
    }
    // ✅ toujours vider le state
    setUser(null)
    setProfile(null)
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      signIn, signUp, signOut, resetPassword,
      refreshProfile,
      isOwner: profile?.role === 'owner',
      isAdmin: profile?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
