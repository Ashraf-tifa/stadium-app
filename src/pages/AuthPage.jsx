// src/pages/AuthPage.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Lock, Eye, EyeOff, ArrowRight,
  Loader2, CheckCircle2, AlertCircle,
  ChevronLeft, User, Phone, Zap
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
export default function AuthPage() {
  const [mode, setMode]         = useState('login')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConf, setShowConf] = useState(false)
  const { signIn, signUp, resetPassword, user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const didNavigate = useRef(false)

  // Redirect once when user + profile are ready — guarded by ref to avoid loop
  useEffect(() => {
    if (authLoading) return
    if (!user || !profile) { setLoading(false); return }
    if (didNavigate.current) return
    didNavigate.current = true
    if (profile.role === 'admin') navigate('/admin', { replace: true })
    else navigate('/dashboard/owner', { replace: true })
  }, [user, profile, authLoading, location.pathname])

  function switchMode(m) { setMode(m); setError(''); setSuccess('') }
  
async function handleLogin(e) {
  e.preventDefault()
  setError('')
  setLoading(true)
  const fd = new FormData(e.target)
  try {
    await signIn({ email: fd.get('email'), password: fd.get('password') })
    // navigation is handled by the useEffect above once user+profile are ready
  } catch (err) {
    setError(err.message)
    setLoading(false)
  }
}

  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fd = new FormData(e.target)
    if (fd.get('password') !== fd.get('confirmPassword')) {
      setError('Les mots de passe ne correspondent pas.')
      setLoading(false); return
    }
    if (fd.get('password').length < 8) {
      setError('Minimum 8 caractères.')
      setLoading(false); return
    }
    try {
      await signUp({
        email:    fd.get('email'),
        password: fd.get('password'),
        fullName: fd.get('fullName'),
        phone:    fd.get('phone'),
        role:     'owner',
      })
      setSuccess('Compte créé ! Vérifiez votre email pour confirmer.')
      switchMode('login')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fd = new FormData(e.target)
    try {
      await resetPassword(fd.get('email'))
      setSuccess('Lien envoyé ! Consultez votre boîte mail.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{
      background: 'linear-gradient(135deg, #080c08 0%, #0d1a0d 50%, #060d12 100%)',
      fontFamily: "'Outfit', sans-serif",
    }}>
      {/* Panneau gauche */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(74,222,128,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(74,222,128,0.04) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}/>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(74,222,128,0.06) 0%, transparent 70%)' }}/>

        <div className="relative z-10 flex items-center gap-4">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-3 group transition-all">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ background: 'linear-gradient(135deg, #4ade80, #16a34a)' }}>
              <Zap size={20} className="text-black" fill="black"/>
            </div>
            <span className="text-white font-black text-xl group-hover:text-green-400 transition-colors">StadiumPro</span>
          </button>
          <button onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
            style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'rgba(74,222,128,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
            ← Accueil
          </button>
        </div>

        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }} className="relative z-10">
          <p className="text-5xl font-black text-white leading-tight mb-4">
            Gérez vos<br/>
            <span style={{ color: '#4ade80' }}>terrains</span><br/>
            comme un pro.
          </p>
          <p className="text-base leading-relaxed max-w-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Réservations en ligne, gestion des tournois, tableau de bord complet.
          </p>
          <div className="flex gap-8 mt-10">
            {[['500+','Terrains'],['12K+','Réservations'],['98%','Satisfaction']].map(([v,l]) => (
              <div key={l}>
                <p className="text-2xl font-black" style={{ color: '#4ade80' }}>{v}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{l}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="relative z-10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Plateforme sécurisée — SSL & RLS activés
          </span>
        </div>
      </div>

      {/* Panneau droit */}
      <div className="w-full lg:w-[480px] flex items-center justify-center p-6 lg:p-10">
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }} className="w-full max-w-sm">

          {/* Logo mobile */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: 'linear-gradient(135deg, #4ade80, #16a34a)' }}>
                <Zap size={16} className="text-black" fill="black"/>
              </div>
              <span className="text-white font-black text-lg group-hover:text-green-400 transition-colors">StadiumPro</span>
            </button>
            <button onClick={() => navigate('/')}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl"
              style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
              ← Accueil
            </button>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-black text-white mb-1">
              {mode === 'login' ? 'Connexion' : mode === 'register' ? 'Créer un compte' : 'Mot de passe oublié'}
            </h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {mode === 'login' ? 'Accédez à votre espace propriétaire' :
               mode === 'register' ? 'Inscrivez votre terrain sur StadiumPro' :
               'Réinitialisez votre accès'}
            </p>
          </div>

          {/* Tabs */}
          {mode !== 'reset' && (
            <div className="flex mb-6 rounded-xl p-1"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {[['login','Connexion'],['register','Inscription']].map(([k,l]) => (
                <button key={k} onClick={() => switchMode(k)}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={mode === k
                    ? { background: 'linear-gradient(135deg,#4ade80,#16a34a)', color: '#000' }
                    : { color: 'rgba(255,255,255,0.4)' }}>
                  {l}
                </button>
              ))}
            </div>
          )}

          {/* Alertes */}
          <AnimatePresence>
            {error && (
              <motion.div key="err" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm mb-4"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                <AlertCircle size={14}/> {error}
              </motion.div>
            )}
            {success && (
              <motion.div key="ok" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm mb-4"
                style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80' }}>
                <CheckCircle2 size={14}/> {success}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">

            {/* LOGIN */}
            {mode === 'login' && (
              <motion.form key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onSubmit={handleLogin} className="space-y-4">
                <Field label="Email" name="email" type="email" placeholder="votre@email.com"
                  icon={<Mail size={15}/>}/>
                <Field label="Mot de passe" name="password"
                  type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  icon={<Lock size={15}/>}
                  suffix={
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  }/>
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#4ade80,#16a34a)', color: '#000', opacity: loading ? 0.7 : 1 }}>
                  {loading ? <><Loader2 size={16} className="animate-spin"/> Connexion...</> : <><span>Se connecter</span><ArrowRight size={15}/></>}
                </button>
                <button type="button" onClick={() => switchMode('reset')}
                  className="w-full text-center text-xs py-1"
                  style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Mot de passe oublié ?
                </button>
              </motion.form>
            )}

            {/* REGISTER */}
            {mode === 'register' && (
              <motion.form key="register" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onSubmit={handleRegister} className="space-y-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
                  <div className="w-2 h-2 rounded-full bg-green-400"/>
                  <p className="text-xs font-semibold" style={{ color: '#4ade80' }}>
                    Inscription Propriétaire de terrain
                  </p>
                </div>
                <Field label="Nom complet" name="fullName" type="text" placeholder="Prénom Nom" icon={<User size={15}/>}/>
                <Field label="Email" name="email" type="email" placeholder="votre@email.com" icon={<Mail size={15}/>}/>
                <Field label="Téléphone" name="phone" type="tel" placeholder="+212 6XX XXX XXX" icon={<Phone size={15}/>}/>
                <Field label="Mot de passe" name="password"
                  type={showPass ? 'text' : 'password'} placeholder="Min. 8 caractères"
                  icon={<Lock size={15}/>}
                  suffix={<button type="button" onClick={() => setShowPass(!showPass)} style={{ color: 'rgba(255,255,255,0.3)' }}>{showPass ? <EyeOff size={15}/> : <Eye size={15}/>}</button>}/>
                <Field label="Confirmer" name="confirmPassword"
                  type={showConf ? 'text' : 'password'} placeholder="••••••••"
                  icon={<Lock size={15}/>}
                  suffix={<button type="button" onClick={() => setShowConf(!showConf)} style={{ color: 'rgba(255,255,255,0.3)' }}>{showConf ? <EyeOff size={15}/> : <Eye size={15}/>}</button>}/>
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#4ade80,#16a34a)', color: '#000', opacity: loading ? 0.7 : 1 }}>
                  {loading ? <><Loader2 size={16} className="animate-spin"/> Création...</> : <><span>Créer mon compte</span><ArrowRight size={15}/></>}
                </button>
                <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Après inscription, choisissez un plan d'abonnement pour activer votre compte.
                </p>
              </motion.form>
            )}

            {/* RESET */}
            {mode === 'reset' && (
              <motion.form key="reset" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onSubmit={handleReset} className="space-y-4">
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Entrez votre email pour recevoir un lien de réinitialisation.
                </p>
                <Field label="Email" name="email" type="email" placeholder="votre@email.com" icon={<Mail size={15}/>}/>
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#4ade80,#16a34a)', color: '#000' }}>
                  {loading ? <><Loader2 size={16} className="animate-spin"/> Envoi...</> : <><span>Envoyer le lien</span><ArrowRight size={15}/></>}
                </button>
                <button type="button" onClick={() => switchMode('login')}
                  className="w-full text-center text-xs py-1 flex items-center justify-center gap-1"
                  style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <ChevronLeft size={13}/> Retour
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

function Field({ label, name, type, placeholder, icon, suffix }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {label}
      </label>
      <div className="relative flex items-center">
        <span className="absolute left-3.5 pointer-events-none" style={{ color: 'rgba(255,255,255,0.25)' }}>
          {icon}
        </span>
        <input name={name} type={type} placeholder={placeholder} required
          className="w-full pl-10 pr-10 py-3 rounded-xl text-sm text-white outline-none transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          onFocus={e => { e.target.style.border = '1px solid rgba(74,222,128,0.5)'; e.target.style.background = 'rgba(74,222,128,0.05)' }}
          onBlur={e =>  { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
        />
        {suffix && <span className="absolute right-3.5">{suffix}</span>}
      </div>
    </div>
  )
}
