// src/pages/owner/SettingsPage.jsx
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Phone, Lock, Eye, EyeOff, Camera,
  CheckCircle2, AlertCircle, Loader2, Save,
  Crown, Zap, Shield, ChevronRight, LogOut
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const PLANS = [
  {
    id:       'free',
    label:    'Gratuit',
    price:    '0 DH',
    icon:     Zap,
    color:    'text-gray-500',
    bg:       'bg-gray-100',
    features: ['1 terrain', '50 réservations/mois', 'Support email'],
  },
  {
    id:       'pro',
    label:    'Pro',
    price:    '299 DH/mois',
    icon:     Crown,
    color:    'text-amber-600',
    bg:       'bg-amber-100',
    features: ['5 terrains', 'Réservations illimitées', 'Tournois illimités', 'Support prioritaire'],
  },
  {
    id:       'business',
    label:    'Business',
    price:    '599 DH/mois',
    icon:     Shield,
    color:    'text-purple-600',
    bg:       'bg-purple-100',
    features: ['Terrains illimités', 'Analytics avancés', 'API access', 'Support dédié 24/7'],
  },
]

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('profile')

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-gray-100">
        {[
          { key: 'profile',  label: 'Profil'   },
          { key: 'security', label: 'Sécurité' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setActiveSection(key)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeSection === key
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeSection}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>

          {activeSection === 'profile'  && <ProfileSection user={user} profile={profile}/>}
          {activeSection === 'security' && <SecuritySection user={user}/>}
        </motion.div>
      </AnimatePresence>

      {/* Déconnexion */}
      <button onClick={async () => { await signOut(); navigate('/auth') }}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 border border-red-100 transition-all">
        <LogOut size={15}/> Se déconnecter
      </button>
    </div>
  )
}

// ─── Section Profil ───────────────────────────────────────────
function ProfileSection({ user, profile }) {
  const [form, setForm]         = useState({ full_name: '', phone: '' })
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState('')
  const [error, setError]       = useState('')
  const [avatar, setAvatar]     = useState(null)
  const [preview, setPreview]   = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    if (profile) {
      setForm({ full_name: profile.full_name || '', phone: profile.phone || '' })
      setPreview(profile.avatar_url || '')
    }
  }, [profile])

  async function handleAvatarSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setError('Image max 2MB'); return }
    setAvatar(file)
    setPreview(URL.createObjectURL(file))
  }

  async function uploadAvatar() {
    if (!avatar) return preview
    setUploading(true)
    try {
      const ext  = avatar.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`
      await supabase.storage.from('avatars').remove([path])
      const { data, error } = await supabase.storage
        .from('avatars').upload(path, avatar, { upsert: true })
      if (error) throw error
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(data.path)
      return pub.publicUrl
    } finally { setUploading(false) }
  }

  async function handleSave() {
    setError(''); setSuccess(''); setLoading(true)
    try {
      const avatarUrl = await uploadAvatar()
      const { error } = await supabase.from('profiles').update({
        full_name:  form.full_name.trim(),
        phone:      form.phone.trim(),
        avatar_url: avatarUrl,
      }).eq('id', user.id)
      if (error) throw error
      setSuccess('Profil mis à jour avec succès !')
      setAvatar(null)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f0' }}>
      <div className="px-6 py-4" style={{ borderBottom: '1px solid #f5f5f5' }}>
        <p className="font-black text-gray-900">Informations personnelles</p>
        <p className="text-xs text-gray-400 mt-0.5">Modifiez votre nom, téléphone et photo</p>
      </div>

      <div className="p-6 space-y-5">
        <AnimatePresence>
          {error && <Alert type="error" message={error}/>}
          {success && <Alert type="success" message={success}/>}
        </AnimatePresence>

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center">
              {preview
                ? <img src={preview} alt="" className="w-full h-full object-cover"/>
                : <span className="text-2xl font-black text-gray-400">
                    {form.full_name?.[0]?.toUpperCase() || 'P'}
                  </span>
              }
            </div>
            <button onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-gray-900 rounded-xl flex items-center justify-center hover:bg-gray-700 transition-colors">
              <Camera size={13} className="text-white"/>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect}/>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{form.full_name || 'Propriétaire'}</p>
            <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
            <button onClick={() => fileRef.current?.click()}
              className="text-xs text-green-600 hover:text-green-700 font-semibold mt-1">
              Changer la photo
            </button>
          </div>
        </div>

        {/* Champs */}
        <Field label="Nom complet" icon={<User size={15}/>}>
          <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
            placeholder="Prénom Nom" className="sp-field"/>
        </Field>

        <Field label="Téléphone" icon={<Phone size={15}/>}>
          <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
            placeholder="+212 6XX XXX XXX" className="sp-field"/>
        </Field>

        <Field label="Email (non modifiable)" icon={<User size={15}/>}>
          <input value={user?.email || ''} disabled
            className="sp-field opacity-50 cursor-not-allowed"/>
        </Field>

        <button onClick={handleSave} disabled={loading || uploading}
          className="w-full py-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
          {loading || uploading
            ? <><Loader2 size={15} className="animate-spin"/> {uploading ? 'Upload...' : 'Enregistrement...'}</>
            : <><Save size={15}/> Enregistrer les modifications</>
          }
        </button>
      </div>
    </div>
  )
}

// ─── Section Sécurité ─────────────────────────────────────────
function SecuritySection({ user }) {
  const [form, setForm]       = useState({ current: '', newPass: '', confirm: '' })
  const [show, setShow]       = useState({ current: false, newPass: false, confirm: false })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError]     = useState('')

  async function handleChangePassword() {
    setError(''); setSuccess('')
    if (form.newPass.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return }
    if (form.newPass !== form.confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: form.newPass })
      if (error) throw error
      setSuccess('Mot de passe modifié avec succès !')
      setForm({ current: '', newPass: '', confirm: '' })
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f0' }}>
      <div className="px-6 py-4" style={{ borderBottom: '1px solid #f5f5f5' }}>
        <p className="font-black text-gray-900">Sécurité du compte</p>
        <p className="text-xs text-gray-400 mt-0.5">Modifiez votre mot de passe</p>
      </div>
      <div className="p-6 space-y-4">
        <AnimatePresence>
          {error && <Alert type="error" message={error}/>}
          {success && <Alert type="success" message={success}/>}
        </AnimatePresence>

        {[
          { key: 'newPass', label: 'Nouveau mot de passe', placeholder: 'Min. 8 caractères' },
          { key: 'confirm', label: 'Confirmer',            placeholder: '••••••••'           },
        ].map(({ key, label, placeholder }) => (
          <Field key={key} label={label} icon={<Lock size={15}/>}>
            <div className="relative">
              <input
                type={show[key] ? 'text' : 'password'}
                value={form[key]}
                onChange={e => setForm({...form, [key]: e.target.value})}
                placeholder={placeholder}
                className="sp-field pr-10"
              />
              <button type="button"
                onClick={() => setShow(s => ({...s, [key]: !s[key]}))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {show[key] ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
          </Field>
        ))}

        {/* Indicateur force */}
        {form.newPass && (
          <div>
            <div className="flex gap-1 mt-1">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex-1 h-1 rounded-full transition-all" style={{
                  background: i <= getStrength(form.newPass)
                    ? i <= 1 ? '#ef4444' : i <= 2 ? '#f59e0b' : i <= 3 ? '#3b82f6' : '#16a34a'
                    : '#e5e7eb'
                }}/>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {['', 'Faible', 'Moyen', 'Fort', 'Très fort'][getStrength(form.newPass)]}
            </p>
          </div>
        )}

        <button onClick={handleChangePassword} disabled={loading}
          className="w-full py-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
          {loading ? <><Loader2 size={15} className="animate-spin"/> Modification...</> : <><Lock size={15}/> Changer le mot de passe</>}
        </button>
      </div>
    </div>
  )
}

function getStrength(pass) {
  let s = 0
  if (pass.length >= 8)             s++
  if (/[A-Z]/.test(pass))           s++
  if (/[0-9]/.test(pass))           s++
  if (/[^A-Za-z0-9]/.test(pass))    s++
  return s
}

// ─── Section Plan ─────────────────────────────────────────────
function PlanSection({ profile }) {
  const [current, setCurrent] = useState('free')
  const [loading, setLoading] = useState(null)
  const [success, setSuccess] = useState('')

  async function handleSelect(planId) {
    if (planId === current) return
    setLoading(planId)
    // Simulation — en production connecter à Stripe / CMI
    await new Promise(r => setTimeout(r, 1500))
    setCurrent(planId)
    setSuccess(`Plan ${planId} activé avec succès !`)
    setLoading(null)
    setTimeout(() => setSuccess(''), 3000)
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {success && <Alert type="success" message={success}/>}
      </AnimatePresence>

      {PLANS.map(({ id, label, price, icon: Icon, color, bg, features }) => (
        <motion.div key={id}
          whileHover={{ y: -1 }}
          className="bg-white rounded-2xl p-5 cursor-pointer transition-all"
          style={{
            border: current === id ? '2px solid #111827' : '1px solid #f0f0f0',
            boxShadow: current === id ? '0 4px 20px rgba(0,0,0,0.08)' : 'none',
          }}
          onClick={() => handleSelect(id)}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon size={18} className={color}/>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-black text-gray-900">{label}</p>
                  {current === id && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-900 text-white">
                      Actuel
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-gray-500 mt-0.5">{price}</p>
              </div>
            </div>
            {loading === id
              ? <Loader2 size={18} className="animate-spin text-gray-400"/>
              : current === id
                ? <CheckCircle2 size={18} className="text-green-600"/>
                : <ChevronRight size={18} className="text-gray-300"/>
            }
          </div>
          <div className="mt-4 space-y-1.5">
            {features.map(f => (
              <div key={f} className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                <CheckCircle2 size={12} className="text-green-500 shrink-0"/>
                {f}
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      <p className="text-xs text-center text-gray-400">
        Les paiements sont sécurisés. Changez de plan à tout moment.
      </p>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────
function Field({ label, icon, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">{icon}</span>
        <div className="[&_input]:pl-9 [&_input]:w-full [&_input]:px-3 [&_input]:py-3 [&_input]:rounded-xl [&_input]:text-sm [&_input]:border [&_input]:border-gray-200 [&_input]:bg-gray-50 [&_input]:text-gray-900 [&_input]:font-medium [&_input]:outline-none [&_input:focus]:border-gray-900 [&_input:focus]:bg-white [&_input:focus]:transition-all">
          {children}
        </div>
      </div>
    </div>
  )
}

function Alert({ type, message }) {
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${
        type === 'error'
          ? 'bg-red-50 border border-red-200 text-red-700'
          : 'bg-green-50 border border-green-200 text-green-700'
      }`}>
      {type === 'error' ? <AlertCircle size={14}/> : <CheckCircle2 size={14}/>}
      {message}
    </motion.div>
  )
}
