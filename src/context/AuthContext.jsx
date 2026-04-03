// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

const PROFILE_SELECT = 'id, full_name, phone, role, is_active, avatar_url, subscription_plan, subscription_until'

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select(PROFILE_SELECT)
        .eq('id', userId)
        .single()
      return data || null
    } catch {
      return null
    }
  }

  async function refreshProfile() {
    if (!user) return
    const p = await fetchProfile(user.id)
    setProfile(p)
  }

  useEffect(() => {
    let isMounted = true
    // fetchId prevents race conditions between concurrent auth events
    let fetchId = 0

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          if (isMounted) setLoading(false)
          return
        }

        if (['INITIAL_SESSION', 'SIGNED_IN', 'TOKEN_REFRESHED', 'PASSWORD_RECOVERY'].includes(event)) {
          const u = session?.user ?? null
          setUser(u)

          if (!u) {
            setProfile(null)
            if (isMounted) setLoading(false)
            return
          }

          // Single fast fetch — no retries that cause slowness
          const myId = ++fetchId
          const p = await fetchProfile(u.id)
          if (isMounted && myId === fetchId) {
            setProfile(p)
            setLoading(false)
          }
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
    try { await supabase.auth.signOut() } catch { /* ignore */ }
    setUser(null)
    setProfile(null)
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      signIn, signUp, signOut, resetPassword, refreshProfile,
      isOwner: profile?.role === 'owner',
      isAdmin: profile?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
