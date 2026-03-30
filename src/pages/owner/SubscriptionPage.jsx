// src/pages/owner/SubscriptionPage.jsx
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, Clock, AlertCircle, Loader2,
  ArrowRight, CreditCard, Upload, X, Zap
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const PLANS = [
  {
    id: 'monthly', label: '1 Mois', months: 1,
    price: 500, priceLabel: '500', unit: 'DH/mois',
    save: null,
    popular: false,
    features: [
      'Accès complet au tableau de bord',
      'Gestion de terrains illimitée',
      'Système de réservation en ligne',
      'Support email',
    ],
  },
  {
    id: 'quarterly', label: '3 Mois', months: 3,
    price: 1300, priceLabel: '1,300', unit: 'DH/total',
    save: 'Économie de 200 DH',
    popular: false,
    features: [
      'Tout le plan mensuel',
      'Économie de 200 DH',
      'Système de tournois',
      'Statistiques avancées',
    ],
  },
  {
    id: 'biannual', label: '6 Mois', months: 6,
    price: 2400, priceLabel: '2,400', unit: 'DH/total',
    save: 'Économie de 600 DH',
    popular: true,
    features: [
      'Tout le plan trimestriel',
      'Économie de 600 DH',
      'Lien de réservation personnalisé',
      'Notifications WhatsApp',
    ],
  },
  {
    id: 'annual', label: '12 Mois', months: 12,
    price: 4200, priceLabel: '4,200', unit: 'DH/total',
    save: 'Économie de 1,800 DH',
    popular: false,
    features: [
      'Tout le plan 6 mois',
      'Économie de 1,800 DH',
      'Support prioritaire 24/7',
      'Nouvelles fonctionnalités en premier',
    ],
  },
]

// Bank info loaded dynamically from app_settings

export default function SubscriptionPage() {
  const { user, loading: authLoading } = useAuth()
  const [sub, setSub]                  = useState(null)
  const [loading, setLoading]          = useState(true)
  const [selected, setSelected]        = useState(null)
  const [showPayment, setShowPayment]  = useState(false)
  const [showSuccess, setShowSuccess]  = useState(false)

  useEffect(() => {
    // Attendre que l'auth soit prête avant de charger
    if (authLoading) return
    if (user) {
      fetchSub()
    } else {
      setLoading(false)
    }
  }, [user, authLoading])

  async function fetchSub() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('subscriptions').select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1).single()
      setSub(data || null)
    } catch { setSub(null) }
    finally { setLoading(false) }
  }

  if (loading) return (
    <div className="flex justify-center py-24">
      <Loader2 size={24} className="animate-spin text-gray-300"/>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* ── Statut actuel ── */}
      {sub && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-2xl"
          style={{ border: '1px solid #f0f0f0' }}>
          <CreditCard size={16} className="text-gray-400"/>
          <span className="text-sm font-bold text-gray-700">Abonnement actuel :</span>

          {sub.status === 'active' && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
              <CheckCircle2 size={12}/> Actif — {sub.plan}
            </span>
          )}
          {sub.status === 'pending' && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
              <Clock size={12}/> En attente de validation
            </span>
          )}
          {sub.status === 'rejected' && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
              <AlertCircle size={12}/> Refusé
            </span>
          )}
          {sub.expires_at && sub.status === 'active' && (
            <span className="text-xs text-gray-400">
              · Expire le {new Date(sub.expires_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          )}
        </motion.div>
      )}

      {/* ── Titre ── */}
      <div className="text-center">
        <p className="text-xs font-black tracking-widest text-green-500 uppercase mb-2">Tarifs transparents</p>
        <h1 className="text-3xl font-black text-gray-900">Choisissez votre plan</h1>
        <p className="text-gray-400 text-sm mt-2">
          Paiement par virement bancaire marocain. Aucune carte requise.
        </p>
      </div>

      {/* ── Grille des plans ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {PLANS.map((plan, i) => {
          const isCurrent = sub?.plan === plan.id && sub?.status === 'active'
          const isSelected = selected?.id === plan.id

          return (
            <motion.div key={plan.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => !isCurrent && setSelected(plan)}
              className="relative bg-white rounded-2xl p-5 cursor-pointer transition-all"
              style={{
                border: isCurrent
                  ? '2px solid #16a34a'
                  : isSelected
                    ? '2px solid #111827'
                    : '1px solid #f0f0f0',
                boxShadow: isSelected && !isCurrent ? '0 4px 20px rgba(0,0,0,0.08)' : 'none',
              }}>

              {/* Badge populaire */}
              {plan.popular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-black px-3 py-1 rounded-full bg-green-500 text-white whitespace-nowrap">
                  ⭐ Populaire
                </div>
              )}

              {/* Badge actuel */}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-black px-3 py-1 rounded-full bg-green-600 text-white whitespace-nowrap flex items-center gap-1">
                  <CheckCircle2 size={10}/> Actuel
                </div>
              )}

              <p className="font-black text-gray-900 text-lg mb-1">{plan.label}</p>

              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-black text-gray-900">{plan.priceLabel}</span>
                <span className="text-xs text-gray-400 font-semibold">{plan.unit}</span>
              </div>

              {plan.save && (
                <p className="text-xs font-bold text-green-600 mb-4">{plan.save}</p>
              )}
              {!plan.save && <div className="mb-4"/>}

              <button
                disabled={isCurrent}
                onClick={e => { e.stopPropagation(); if (!isCurrent) { setSelected(plan); setShowPayment(true) } }}
                className="w-full py-2.5 rounded-xl text-sm font-black transition-all"
                style={{
                  background: isCurrent ? '#f0fdf4' : plan.popular ? '#16a34a' : '#111827',
                  color: isCurrent ? '#16a34a' : '#fff',
                  cursor: isCurrent ? 'default' : 'pointer',
                }}>
                {isCurrent ? '✓ Plan actuel' : 'Choisir ce plan'}
              </button>

              <div className="mt-4 pt-4 space-y-2" style={{ borderTop: '1px solid #f5f5f5' }}>
                {plan.features.map(f => (
                  <div key={f} className="flex items-start gap-2">
                    <CheckCircle2 size={11} className="text-green-500 shrink-0 mt-0.5"/>
                    <p className="text-xs text-gray-500">{f}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>

      <p className="text-center text-xs text-gray-300">
        ✓ Accès complet dès activation · Paiement par virement CIH, Attijariwafa, BCP, etc.
      </p>

      {/* ── Modal paiement ── */}
      <AnimatePresence>
        {showPayment && selected && (
          <PaymentModal
            plan={selected}
            userId={user.id}
            onClose={() => setShowPayment(false)}
            onSuccess={() => {
              setShowPayment(false)
              setShowSuccess(true)
              fetchSub()
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Message succès ── */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowSuccess(false)}/>
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1,    opacity: 1, y: 0  }}
              exit={{    scale: 0.85, opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative bg-white rounded-3xl p-8 flex flex-col items-center gap-4 shadow-2xl max-w-sm w-full text-center"
            >
              {/* Icône animée */}
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '3px solid #86efac' }}
              >
                <CheckCircle2 size={40} className="text-green-500"/>
              </motion.div>

              <div>
                <h3 className="text-xl font-black text-gray-900 mb-1">Demande envoyée !</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Votre demande d'abonnement a bien été reçue.<br/>
                  L'administrateur va valider votre paiement <strong>sous 24–48h</strong>.
                </p>
              </div>

              <div className="w-full px-4 py-3 rounded-2xl text-sm font-semibold text-amber-700 flex items-center gap-2"
                style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                <Clock size={14} className="shrink-0"/>
                Statut actuel : <span className="font-black">En attente de validation</span>
              </div>

              <button onClick={() => setShowSuccess(false)}
                className="w-full py-3 rounded-2xl font-black text-sm text-white transition-all"
                style={{ background: '#111827' }}>
                Compris
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Modal paiement ───────────────────────────────────────────
function PaymentModal({ plan, userId, onClose, onSuccess }) {
  const [file, setFile]               = useState(null)
  const [preview, setPreview]         = useState(null)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState('')
  const [copied, setCopied]           = useState('')
  const [banks, setBanks]             = useState([])
  const [loadingBank, setLoadingBank] = useState(true)
  const [activeBank, setActiveBank]   = useState(0)

  useEffect(() => {
    supabase.from('bank_accounts').select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .then(({ data }) => { setBanks(data || []); setLoadingBank(false) })
  }, [])

  function handleFile(f) {
    if (!f) return
    setFile(f)
    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = e => setPreview(e.target.result)
      reader.readAsDataURL(f)
    } else {
      setPreview(null)
    }
  }

  function copyText(text, key) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  async function handleSubmit() {
    if (!file) { setError('Veuillez joindre un reçu de virement.'); return }
    setError(''); setSubmitting(true)
    try {
      // ── Upload image ──
      let receiptUrl = null
      const ext  = file.name.split('.').pop()
      const path = `receipts/${userId}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('receipts').upload(path, file)
      if (upErr) {
        console.warn('Storage upload failed (continuing without receipt URL):', upErr.message)
      } else {
        const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(path)
        receiptUrl = urlData?.publicUrl
      }

      // ── Upsert subscription ──
      const expires = new Date()
      expires.setMonth(expires.getMonth() + plan.months)

      const { data: upsertData, error: upsertErr } = await supabase
        .from('subscriptions')
        .upsert({
          owner_id:   userId,
          plan:       plan.id,
          status:     'pending',
          amount:     plan.price,
          proof_url:  receiptUrl,
          expires_at: expires.toISOString(),
        }, { onConflict: 'owner_id' })
        .select()

      console.log('Upsert result:', { upsertData, upsertErr })

      if (upsertErr) throw new Error(`Erreur: ${upsertErr.message} (code: ${upsertErr.code})`)

      onSuccess()
    } catch (e) {
      console.error('handleSubmit error:', e)
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const b = banks[activeBank]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}/>

      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="relative w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden"
        style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>

        {/* ── Barre verte top ── */}
        <div className="h-1 bg-gradient-to-r from-green-400 to-green-600 shrink-0"/>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid #f0f0f0' }}>
          <div>
            <h3 className="font-black text-gray-900 text-base">Paiement — {plan.label}</h3>
            <p className="text-xs text-gray-400">{plan.priceLabel} DH · Virement bancaire</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">
            <X size={18}/>
          </button>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Montant */}
          <div className="flex items-center justify-between px-4 py-3 rounded-2xl"
            style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1px solid #86efac' }}>
            <div className="flex items-center gap-2">
              <CreditCard size={15} className="text-green-600"/>
              <span className="text-sm font-bold text-green-800">Montant à virer</span>
            </div>
            <span className="text-xl font-black text-green-700">{plan.priceLabel} DH</span>
          </div>

          {/* ── Sélecteur de banque (tabs) ── */}
          {loadingBank ? (
            <div className="flex justify-center py-6">
              <Loader2 size={20} className="animate-spin text-gray-300"/>
            </div>
          ) : banks.length === 0 ? (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
              <AlertCircle size={15} className="text-amber-500 shrink-0"/>
              <p className="text-xs font-semibold text-amber-700">
                Aucun compte bancaire configuré par l'administrateur.
              </p>
            </div>
          ) : (
            <div>
              {/* Tabs */}
              {banks.length > 1 && (
                <div className="flex gap-2 mb-3 p-1 rounded-xl" style={{ background: '#f3f4f6' }}>
                  {banks.map((bk, i) => (
                    <button key={bk.id} onClick={() => setActiveBank(i)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: activeBank === i ? '#fff' : 'transparent',
                        color:      activeBank === i ? '#111827' : '#9ca3af',
                        boxShadow:  activeBank === i ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                      }}>
                      <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                        style={{ background: activeBank === i ? '#111827' : '#e5e7eb' }}>
                        <span className="text-[9px] font-black"
                          style={{ color: activeBank === i ? '#4ade80' : '#9ca3af' }}>
                          {bk.bank_name.slice(0,2).toUpperCase()}
                        </span>
                      </div>
                      {bk.bank_name}
                    </button>
                  ))}
                </div>
              )}

              {/* Détails banque sélectionnée */}
              {b && (
                <AnimatePresence mode="wait">
                  <motion.div key={b.id}
                    initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}
                    className="rounded-2xl overflow-hidden"
                    style={{ border: '1px solid #e5e7eb' }}>

                    {/* Header banque */}
                    <div className="flex items-center gap-3 px-4 py-3"
                      style={{ background: '#111827' }}>
                      <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-black text-green-400">
                          {b.bank_name.slice(0,2).toUpperCase()}
                        </span>
                      </div>
                      <p className="font-black text-white text-sm">{b.bank_name}</p>
                    </div>

                    {/* Champs */}
                    <div className="bg-white px-4 py-3 space-y-3">
                      {[
                        { label: 'RIB',       value: b.rib,        key: `rib-${b.id}`, mono: true  },
                        { label: 'Titulaire', value: b.owner_name, key: `own-${b.id}`, mono: false },
                        { label: 'Tél',       value: b.phone,      key: `tel-${b.id}`, mono: false },
                      ].filter(r => r.value).map(({ label, value, key, mono }) => (
                        <div key={key} className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-gray-400 mb-0.5 font-semibold uppercase tracking-wide">{label}</p>
                            <p className={`text-sm font-bold text-gray-900 truncate ${mono ? 'font-mono tracking-wider' : ''}`}>
                              {value}
                            </p>
                          </div>
                          <button onClick={() => copyText(value, key)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0"
                            style={{
                              background: copied === key ? '#f0fdf4' : '#f3f4f6',
                              color:      copied === key ? '#16a34a' : '#6b7280',
                              border:     copied === key ? '1px solid #86efac' : '1px solid #e5e7eb',
                            }}>
                            {copied === key ? '✓ Copié' : '📋 Copier'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          )}

          {/* ── Upload reçu ── */}
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Reçu de virement</p>
            <label className="block cursor-pointer">
              <input type="file" className="hidden" accept="image/*,.pdf"
                onChange={e => handleFile(e.target.files[0])}/>

              {preview ? (
                /* Prévisualisation image */
                <div className="relative rounded-2xl overflow-hidden group"
                  style={{ border: '2px solid #86efac' }}>
                  <img src={preview} alt="reçu"
                    className="w-full object-cover rounded-2xl"
                    style={{ maxHeight: 200 }}/>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-1 rounded-2xl">
                    <Upload size={20} className="text-white"/>
                    <p className="text-xs font-bold text-white">Changer l'image</p>
                  </div>
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black">
                    <CheckCircle2 size={10}/> Ajouté
                  </div>
                </div>
              ) : file ? (
                /* PDF ou autre fichier */
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{ border: '2px solid #86efac', background: '#f0fdf4' }}>
                  <CheckCircle2 size={20} className="text-green-500 shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-green-700 truncate">{file.name}</p>
                    <p className="text-xs text-green-500">Cliquez pour changer</p>
                  </div>
                </div>
              ) : (
                /* Zone vide */
                <div className="flex flex-col items-center justify-center gap-2 py-7 rounded-2xl transition-all"
                  style={{ border: '2px dashed #e2e8f0', background: '#fafafa' }}>
                  <Upload size={22} className="text-gray-300"/>
                  <p className="text-sm font-semibold text-gray-400">Cliquez pour joindre le reçu</p>
                  <p className="text-xs text-gray-300">JPG, PNG ou PDF</p>
                </div>
              )}
            </label>
          </div>

        </div>

        {/* ── Footer fixe ── */}
        <div className="px-5 pb-5 pt-3 shrink-0" style={{ borderTop: '1px solid #f0f0f0' }}>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5 text-xs mb-3">
              <AlertCircle size={13} className="shrink-0"/> {error}
            </div>
          )}
          <button onClick={handleSubmit} disabled={submitting}
            className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all"
            style={{ background: '#111827', color: '#fff', opacity: submitting ? 0.7 : 1 }}>
            {submitting
              ? <><Loader2 size={15} className="animate-spin"/> Envoi en cours...</>
              : <><Zap size={15}/> Envoyer ma demande</>
            }
          </button>
          <p className="text-center text-xs text-gray-300 mt-2">
            L'administrateur validera votre paiement sous 24–48h
          </p>
        </div>

      </motion.div>
    </div>
  )
}
