// src/components/StadiumModal.jsx
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, MapPin, DollarSign, Users, Layers,
  X, CheckCircle2, AlertCircle, Loader2, Clock,
  Plus, Trash2, Image, Upload
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const SIZES    = ['5v5', '7v7', '11v11']
const SURFACES = [
  { value: 'turf',     label: 'Synthétique' },
  { value: 'grass',    label: 'Naturel'     },
  { value: 'concrete', label: 'Béton'       },
]
const AMENITIES_LIST = [
  { value: 'lighting',  label: '💡 Éclairage'  },
  { value: 'parking',   label: '🚗 Parking'    },
  { value: 'showers',   label: '🚿 Vestiaires' },
  { value: 'cafeteria', label: '☕ Cafétéria'  },
  { value: 'wifi',      label: '📶 Wi-Fi'      },
  { value: 'tribune',   label: '🪑 Tribune'    },
]
const DAYS = [
  { value: 1, label: 'Lun' }, { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' }, { value: 4, label: 'Jeu' },
  { value: 5, label: 'Ven' }, { value: 6, label: 'Sam' },
  { value: 0, label: 'Dim' },
]

const STEPS = [
  { n: 1, label: 'Infos'    },
  { n: 2, label: 'Créneaux' },
  { n: 3, label: 'Photos'   },
]

const EMPTY_FORM = {
  name: '', description: '', city: '', address: '',
  price_per_hour: '', size: '5v5', surface: 'turf',
  amenities: [], is_active: true,
}

export default function StadiumModal({ isOpen, stadium = null, onClose, onSuccess }) {
  const isEdit = Boolean(stadium)
  const { user } = useAuth()
  const fileRef = useRef()

  const [step, setStep]           = useState(1)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [form, setForm]           = useState(EMPTY_FORM)
  const [slots, setSlots]         = useState([
    { day_of_week: 1, start_time: '08:00', end_time: '22:00', is_available: true }
  ])
  const [imageUrl, setImageUrl]   = useState('')   // URL saisie manuellement
  const [imageFile, setImageFile] = useState(null) // Fichier à uploader
  const [preview, setPreview]     = useState('')   // Preview local
  const [uploading, setUploading] = useState(false)

  // Reset à l'ouverture
  useEffect(() => {
    if (!isOpen) return
    setStep(1); setError('')
    setImageFile(null); setPreview('')

    if (stadium) {
      setForm({
        name:           stadium.name           || '',
        description:    stadium.description    || '',
        city:           stadium.city           || '',
        address:        stadium.address        || '',
        price_per_hour: stadium.price_per_hour || '',
        size:           stadium.size           || '5v5',
        surface:        stadium.surface        || 'turf',
        amenities:      stadium.amenities      || [],
        is_active:      stadium.is_active      ?? true,
      })
      setImageUrl(stadium.images?.[0] || '')
      setPreview(stadium.images?.[0] || '')
      if (stadium.id) loadSlots(stadium.id)
    } else {
      setForm(EMPTY_FORM)
      setImageUrl(''); setSlots([
        { day_of_week: 1, start_time: '08:00', end_time: '22:00', is_available: true }
      ])
    }
  }, [isOpen, stadium])

  async function loadSlots(id) {
    const { data } = await supabase.from('time_slots').select('*').eq('stadium_id', id)
    if (data?.length > 0) setSlots(data)
  }

  // Sélection image locale
  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { setError('Image max 3MB.'); return }
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
    setError('')
  }

  // Upload image vers Supabase Storage
  async function uploadImage() {
    if (!imageFile) return imageUrl || null
    setUploading(true)
    try {
      const ext  = imageFile.name.split('.').pop().toLowerCase()
      const path = `${user.id}/${Date.now()}.${ext}`

      const { data, error } = await supabase.storage
        .from('photos-terrains')
        .upload(path, imageFile, { cacheControl: '3600', upsert: false })

      if (error) throw error

      const { data: pub } = supabase.storage
        .from('photos-terrains')
        .getPublicUrl(data.path)

      return pub.publicUrl
    } finally {
      setUploading(false)
    }
  }

  // Créneaux
  function addSlot() {
    setSlots(p => {
      const dayValues = DAYS.map(d => d.value) // [1,2,3,4,5,6,0]
      const lastDay   = p.length > 0 ? p[p.length - 1].day_of_week : 0
      const lastIdx   = dayValues.indexOf(lastDay)
      const nextDay   = dayValues[(lastIdx + 1) % dayValues.length]
      return [...p, { day_of_week: nextDay, start_time: '08:00', end_time: '22:00', is_available: true }]
    })
  }
  function removeSlot(i) { setSlots(p => p.filter((_, idx) => idx !== i)) }
  function updateSlot(i, k, v) { setSlots(p => p.map((s, idx) => idx === i ? { ...s, [k]: v } : s)) }

  // Soumission
  async function handleSubmit() {
    if (!form.name || !form.city || !form.price_per_hour) {
      setError('Remplissez les champs obligatoires (*).'); setStep(1); return
    }
    setError(''); setLoading(true)
    try {
      // Upload image
      const finalImageUrl = await uploadImage()

      const payload = {
        ...form,
        price_per_hour: Number(form.price_per_hour),
        images: finalImageUrl ? [finalImageUrl] : [],
        owner_id: user.id,
      }

      let stadiumId = stadium?.id

      if (isEdit) {
        const { error } = await supabase.from('stadiums')
          .update(payload).eq('id', stadium.id).eq('owner_id', user.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('stadiums')
          .insert(payload).select('id').single()
        if (error) throw error
        stadiumId = data.id
      }

      // Créneaux
      await supabase.from('time_slots').delete().eq('stadium_id', stadiumId)
      if (slots.length > 0) {
        const { error } = await supabase.from('time_slots').insert(
          slots.map(s => ({
            stadium_id: stadiumId, day_of_week: s.day_of_week,
            start_time: s.start_time, end_time: s.end_time, is_available: s.is_available,
          }))
        )
        if (error) throw error
      }

      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop sans fermeture */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{ opacity: 0,  scale: 0.95,   y: 10 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="h-1 bg-gradient-to-r from-green-400 to-emerald-600"/>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                  <Building2 size={17} className="text-green-600"/>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    {isEdit ? `Modifier — ${stadium?.name}` : 'Ajouter un terrain'}
                  </h2>
                  <p className="text-xs text-gray-400">Étape {step} / {STEPS.length}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400">
                <X size={18}/>
              </button>
            </div>

            {/* Stepper */}
            <div className="flex items-center px-6 py-3 bg-gray-50 border-b border-gray-100 gap-2">
              {STEPS.map(({ n, label }, i) => (
                <div key={n} className="flex items-center flex-1">
                  <button onClick={() => n < step && setStep(n)} className="flex items-center gap-1.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step === n ? 'bg-green-600 text-white' : step > n ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {step > n ? '✓' : n}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${step === n ? 'text-gray-900' : 'text-gray-400'}`}>
                      {label}
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${step > n ? 'bg-green-300' : 'bg-gray-200'}`}/>
                  )}
                </div>
              ))}
            </div>

            {/* Corps */}
            <div className="overflow-y-auto p-5" style={{ maxHeight: '55vh' }}>
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5 text-xs mb-4">
                    <AlertCircle size={13}/> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">

                {/* ── Étape 1 : Informations ── */}
                {step === 1 && (
                  <motion.div key="s1"
                    initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}
                    className="space-y-3"
                  >
                    <Field label="Nom *">
                      <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                        placeholder="Ex: Terrain Atlas" className="mi"/>
                    </Field>
                    <Field label="Description">
                      <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                        placeholder="Décrivez votre terrain..." rows={2} className="mi resize-none"/>
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Ville *">
                        <input value={form.city} onChange={e => setForm({...form, city: e.target.value})}
                          placeholder="Casablanca" className="mi"/>
                      </Field>
                      <Field label="Adresse">
                        <input value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                          placeholder="Quartier..." className="mi"/>
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Prix / heure (DH) *">
                        <input type="number" value={form.price_per_hour}
                          onChange={e => setForm({...form, price_per_hour: e.target.value})}
                          placeholder="200" min="0" className="mi"/>
                      </Field>
                      <Field label="Format">
                        <select value={form.size} onChange={e => setForm({...form, size: e.target.value})} className="mi">
                          {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </Field>
                    </div>
                    <Field label="Surface">
                      <div className="grid grid-cols-3 gap-2">
                        {SURFACES.map(s => (
                          <button key={s.value} type="button" onClick={() => setForm({...form, surface: s.value})}
                            className={`py-2 rounded-xl text-xs font-medium border-2 transition-all ${
                              form.surface === s.value ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}>{s.label}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <Field label="Équipements">
                      <div className="grid grid-cols-3 gap-2">
                        {AMENITIES_LIST.map(a => (
                          <button key={a.value} type="button"
                            onClick={() => setForm(p => ({
                              ...p, amenities: p.amenities.includes(a.value)
                                ? p.amenities.filter(x => x !== a.value)
                                : [...p.amenities, a.value]
                            }))}
                            className={`py-2 rounded-xl text-xs font-medium border-2 transition-all text-left px-2 ${
                              form.amenities.includes(a.value) ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}>{a.label}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <div className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-2xl">
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Terrain actif</p>
                        <p className="text-xs text-gray-400">Visible pour les clients</p>
                      </div>
                      <button type="button" onClick={() => setForm(p => ({...p, is_active: !p.is_active}))}
                        className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_active ? 'left-6' : 'left-1'}`}/>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ── Étape 2 : Créneaux ── */}
                {step === 2 && (
                  <motion.div key="s2"
                    initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Clock size={15} className="text-green-600"/>
                      <p className="text-sm font-semibold text-gray-700">Créneaux horaires</p>
                    </div>
                    {slots.map((slot, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-2xl p-2.5">
                        <select value={slot.day_of_week}
                          onChange={e => updateSlot(idx, 'day_of_week', Number(e.target.value))}
                          className="text-xs border-2 border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none focus:border-green-500 bg-white font-medium">
                          {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                        <input type="time" value={slot.start_time}
                          onChange={e => updateSlot(idx, 'start_time', e.target.value)}
                          className="text-xs border-2 border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none focus:border-green-500 bg-white flex-1"/>
                        <span className="text-gray-400 text-xs shrink-0">→</span>
                        <input type="time" value={slot.end_time}
                          onChange={e => updateSlot(idx, 'end_time', e.target.value)}
                          className="text-xs border-2 border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none focus:border-green-500 bg-white flex-1"/>
                        <button type="button" onClick={() => updateSlot(idx, 'is_available', !slot.is_available)}
                          className={`w-8 h-5 rounded-full transition-colors shrink-0 ${slot.is_available ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span className={`block w-3 h-3 bg-white rounded-full shadow mx-auto transition-all ${slot.is_available ? 'translate-x-1.5' : '-translate-x-1.5'}`}/>
                        </button>
                        <button type="button" onClick={() => removeSlot(idx)}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-xl transition-colors">
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    ))}
                    {slots.length < 7 && (
                      <button type="button" onClick={addSlot}
                        className="w-full py-2.5 border-2 border-dashed border-gray-300 hover:border-green-400 text-gray-500 hover:text-green-600 rounded-2xl text-xs font-medium transition-all flex items-center justify-center gap-2">
                        <Plus size={14}/> Ajouter un créneau
                      </button>
                    )}
                  </motion.div>
                )}

                {/* ── Étape 3 : Photo ── */}
                {step === 3 && (
                  <motion.div key="s3"
                    initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2">
                      <Image size={15} className="text-green-600"/>
                      <p className="text-sm font-semibold text-gray-700">Photo principale</p>
                    </div>

                    {/* Preview */}
                    {preview ? (
                      <div className="relative rounded-2xl overflow-hidden h-40 bg-gray-100">
                        <img src={preview} alt="preview" className="w-full h-full object-cover"/>
                        <button
                          onClick={() => { setPreview(''); setImageFile(null); setImageUrl('') }}
                          className="absolute top-2 right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center">
                          <X size={13} className="text-white"/>
                        </button>
                      </div>
                    ) : (
                      <div onClick={() => fileRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 hover:border-green-400 rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-green-50/30">
                        <Upload size={28} className="mx-auto text-gray-400 mb-2"/>
                        <p className="text-sm font-medium text-gray-600">Cliquez pour choisir une photo</p>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG — Max 3MB</p>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect}/>
                      </div>
                    )}

                    {/* OU saisir URL */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-gray-200"/>
                      <span className="text-xs text-gray-400">ou entrez un lien</span>
                      <div className="flex-1 h-px bg-gray-200"/>
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={imageUrl}
                        onChange={e => setImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="mi flex-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => { if (imageUrl) { setPreview(imageUrl); setImageFile(null) } }}
                        className="px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-xl hover:bg-green-700 transition-colors">
                        OK
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
              {step === 1 ? (
                <button onClick={onClose}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 border-2 border-gray-200 hover:bg-white rounded-2xl transition-all">
                  Annuler
                </button>
              ) : (
                <button onClick={() => setStep(s => s - 1)}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 border-2 border-gray-200 hover:bg-white rounded-2xl transition-all">
                  ← Retour
                </button>
              )}

              {step < STEPS.length ? (
                <button
                  onClick={() => {
                    if (step === 1 && (!form.name || !form.city || !form.price_per_hour)) {
                      setError('Remplissez les champs obligatoires (*).'); return
                    }
                    setError(''); setStep(s => s + 1)
                  }}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-2xl transition-all shadow-sm">
                  Suivant →
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={loading || uploading}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 rounded-2xl transition-all shadow-sm flex items-center gap-2">
                  {(loading || uploading)
                    ? <><Loader2 size={15} className="animate-spin"/> {uploading ? 'Upload...' : 'Enregistrement...'}</>
                    : <><CheckCircle2 size={15}/> {isEdit ? 'Mettre à jour' : 'Ajouter'}</>
                  }
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}
