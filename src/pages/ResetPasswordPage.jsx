// src/pages/ResetPasswordPage.jsx
// صفحة إعادة تعيين كلمة السر — تُستدعى من رابط الإيميل
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword]       = useState('')
  const [confirm, setConfirm]         = useState('')
  const [showPass, setShowPass]       = useState(false)
  const [showConf, setShowConf]       = useState(false)
  const [loading, setLoading]         = useState(false)
  const [success, setSuccess]         = useState(false)
  const [error, setError]             = useState('')
  const [sessionReady, setSessionReady] = useState(false)

  // Supabase gère automatiquement le token depuis le hash de l'URL
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setSessionReady(true)
      }
    })

    // Vérifier si déjà connecté (cas où le token est déjà consommé)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password })
      if (updateErr) throw updateErr
      setSuccess(true)
      setTimeout(() => navigate('/auth'), 3000)
    } catch (err) {
      setError(err.message || 'Erreur lors de la mise à jour.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #080c08 0%, #0d1a0d 50%, #060d12 100%)',
        fontFamily: "'Outfit', sans-serif",
      }}>

      {/* Grille d'arrière-plan */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(74,222,128,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(74,222,128,0.04) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }}/>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-green-400 to-green-600"/>

          <div className="p-8">
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center">
                <Zap size={16} className="text-green-400" fill="#4ade80"/>
              </div>
              <span className="font-black text-gray-900 text-lg">StadiumPro</span>
            </div>

            {success ? (
              /* ── Succès ── */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-green-600"/>
                </div>
                <h2 className="text-xl font-black text-gray-900 mb-2">
                  Mot de passe mis à jour !
                </h2>
                <p className="text-sm text-gray-400">
                  Redirection vers la connexion dans 3 secondes...
                </p>
              </motion.div>

            ) : !sessionReady ? (
              /* ── Attente token ── */
              <div className="text-center py-8">
                <Loader2 size={32} className="animate-spin text-green-500 mx-auto mb-4"/>
                <p className="text-sm text-gray-500 font-medium">
                  Vérification du lien de réinitialisation...
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Si cette page reste bloquée, le lien a peut-être expiré.
                </p>
                <button onClick={() => navigate('/auth')}
                  className="mt-4 text-xs font-bold text-green-600 hover:underline flex items-center gap-1 mx-auto">
                  <ArrowLeft size={12}/> Retour à la connexion
                </button>
              </div>

            ) : (
              /* ── Formulaire nouveau mot de passe ── */
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-gray-900">Nouveau mot de passe</h2>
                  <p className="text-sm text-gray-400 mt-1">Choisissez un mot de passe sécurisé</p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 mb-4">
                    <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5"/>
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Nouveau mot de passe */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Min. 8 caractères"
                        required
                        className="w-full pl-4 pr-10 py-3 rounded-xl border-2 border-gray-200 focus:border-gray-900 text-sm font-medium outline-none transition-all"
                      />
                      <button type="button" onClick={() => setShowPass(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                        {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    </div>
                    {/* Barre de force */}
                    {password && (
                      <div className="mt-1.5 flex gap-1">
                        {[1,2,3].map(i => (
                          <div key={i} className="h-1 flex-1 rounded-full transition-all"
                            style={{
                              background: password.length >= i * 4
                                ? i === 1 ? '#ef4444' : i === 2 ? '#f59e0b' : '#16a34a'
                                : '#f3f4f6'
                            }}/>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirmer */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Confirmer le mot de passe
                    </label>
                    <div className="relative">
                      <input
                        type={showConf ? 'text' : 'password'}
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        placeholder="••••••••"
                        required
                        className={`w-full pl-4 pr-10 py-3 rounded-xl border-2 text-sm font-medium outline-none transition-all ${
                          confirm && confirm !== password
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-200 focus:border-gray-900'
                        }`}
                      />
                      <button type="button" onClick={() => setShowConf(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                        {showConf ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    </div>
                    {confirm && confirm !== password && (
                      <p className="text-xs text-red-500 mt-1 font-medium">Les mots de passe ne correspondent pas</p>
                    )}
                  </div>

                  <button type="submit" disabled={loading || password !== confirm || password.length < 8}
                    className="w-full py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                    style={{ background: '#111827' }}>
                    {loading
                      ? <><Loader2 size={16} className="animate-spin"/> Mise à jour...</>
                      : <><CheckCircle2 size={16}/> Mettre à jour le mot de passe</>
                    }
                  </button>
                </form>

                <button onClick={() => navigate('/auth')}
                  className="w-full mt-4 text-sm text-gray-400 hover:text-gray-700 font-semibold flex items-center justify-center gap-1 transition-colors">
                  <ArrowLeft size={14}/> Retour à la connexion
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
