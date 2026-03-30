// src/pages/owner/StadiumForm.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, MapPin, DollarSign, Users, Layers,
  Upload, X, CheckCircle2, AlertCircle, ArrowLeft,
  Loader2, Image, Plus, Trash2, Clock
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

// ─── Constantes ───────────────────────────────────────────────
const SIZES    = ['5v5', '7v7', '11v11']
const SURFACES = [
  { value: 'turf',     label: 'Gazon synthétique' },
  { value: 'grass',    label: 'Gazon naturel'     },
  { value: 'concrete', label: 'Béton'             },
]
const AMENITIES_LIST = [
  { value: 'lighting',  label: '💡 Éclairage'    },
  { value: 'parking',   label: '🚗 Parking'      },
  { value: 'showers',   label: '🚿 Vestiaires'   },
  { value: 'cafeteria', label: '☕ Cafétéria'    },
  { value: 'wifi',      label: '📶 Wi-Fi'        },
  { value: 'tribune',   label: '🪑 Tribune'      },
]
const DAYS = [
  { value: 0, label: 'Dim' },
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' },
  { value: 4, label: 'Jeu' },
  { value: 5, label: 'Ven' },
  { value: 6, label: 'Sam' },
]

const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function StadiumForm() {
  const { id } = useParams()           // si id → mode édition
  const isEdit  = Boolean(id)
  const { user } = useAuth()
  const navigate = useNavigate()

  // ─── État du formulaire ──────────────────────────────────────
  const [form, setForm] = useState({
    name:          '',
    description:   '',
    city:          '',
    address:       '',
    price_per_hour: '',
    size:          '5v5',
    surface:       'turf',
    amenities:     [],
    is_active:     true,
  })

  // Créneaux horaires
  const [slots, setSlots] = useState([
    { day_of_week: 1, start_time: '08:00', end_time: '22:00', is_available: true }
  ])

  // Images
  const [images, setImages]       = useState([])    // URLs existantes
  const [newImages, setNewImages] = useState([])     // Fichiers à uploader
  const [previews, setPreviews]   = useState([])     // Previews locaux

  const [loading, setLoading]   = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [step, setStep]         = useState(1)       // 1: Infos, 2: Créneaux, 3: Photos

  const fileInputRef = useRef()

  // ─── Charger les données en mode édition ─────────────────────
  useEffect(() => {
    if (!isEdit) return
    async function loadStadium() {
      const { data, error } = await supabase
        .from('stadiums')
        .select('*, time_slots(*)')
        .eq('id', id)
        .eq('owner_id', user.id)
        .single()

      if (error || !data) { navigate('/dashboard'); return }

      setForm({
        name:           data.name,
        description:    data.description || '',
        city:           data.city,
        address:        data.address || '',
        price_per_hour: data.price_per_hour,
        size:           data.size || '5v5',
        surface:        data.surface || 'turf',
        amenities:      data.amenities || [],
        is_active:      data.is_active,
      })

      setImages(data.images || [])

      if (data.time_slots?.length > 0) {
        setSlots(data.time_slots.map(s => ({
          id:          s.id,
          day_of_week: s.day_of_week,
          start_time:  s.start_time,
          end_time:    s.end_time,
          is_available: s.is_available,
        })))
      }

      setFetching(false)
    }
    loadStadium()
  }, [id, isEdit, user, navigate])

  // ─── Gestion des images ───────────────────────────────────────
 function handleImageSelect(e) {
  const files = Array.from(e.target.files)
  
  // حد 5 صور فقط
  const remaining = 5 - images.length - newImages.length
  const selected  = files.slice(0, remaining)
  
  if (selected.length === 0) {
    setError('Maximum 5 photos autorisées.')
    return
  }

  // حد الحجم 2MB لكل صورة
  const valid = selected.filter(f => {
    if (f.size > 2 * 1024 * 1024) {
      setError(`${f.name} dépasse 2MB.`)
      return false
    }
    return true
  })

  const newPreviews = valid.map(f => URL.createObjectURL(f))
  setNewImages(prev => [...prev, ...valid])
  setPreviews(prev => [...prev, ...newPreviews])
}

  function removeExistingImage(idx) {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  function removeNewImage(idx) {
    setNewImages(prev => prev.filter((_, i) => i !== idx))
    setPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  // Upload des images vers Supabase Storage
 // في StadiumForm.jsx — استبدل دالة uploadImages بهذه:
async function uploadImages() {
  const urls = [...images]

  for (const file of newImages) {
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsDataURL(file)
    })
    urls.push(base64)
  }

  return urls
}
  // ─── Gestion des créneaux ─────────────────────────────────────
  function addSlot() {
    setSlots(prev => [...prev, {
      day_of_week: 1, start_time: '08:00', end_time: '22:00', is_available: true
    }])
  }

  function removeSlot(idx) {
    setSlots(prev => prev.filter((_, i) => i !== idx))
  }

  function updateSlot(idx, field, value) {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  // ─── Soumission ───────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.city || !form.price_per_hour) {
      setError('Veuillez remplir tous les champs obligatoires.')
      setStep(1); return
    }
    setError(''); setLoading(true)

    try {
      // 1. Upload des images
      const imageUrls = await uploadImages()

      const stadiumData = {
        ...form,
        price_per_hour: Number(form.price_per_hour),
        images: imageUrls,
        owner_id: user.id,
      }

      let stadiumId = id

      if (isEdit) {
        // Mise à jour
        const { error } = await supabase
          .from('stadiums')
          .update(stadiumData)
          .eq('id', id)
          .eq('owner_id', user.id)
        if (error) throw error
      } else {
        // Création
        const { data, error } = await supabase
          .from('stadiums')
          .insert(stadiumData)
          .select('id')
          .single()
        if (error) throw error
        stadiumId = data.id
      }

      // 2. Mettre à jour les créneaux horaires
      // Supprimer les anciens créneaux
      await supabase.from('time_slots').delete().eq('stadium_id', stadiumId)

      // Insérer les nouveaux
      if (slots.length > 0) {
        const { error } = await supabase.from('time_slots').insert(
          slots.map(s => ({
            stadium_id:   stadiumId,
            day_of_week:  s.day_of_week,
            start_time:   s.start_time,
            end_time:     s.end_time,
            is_available: s.is_available,
          }))
        )
        if (error) throw error
      }

      setSuccess(isEdit ? 'Terrain mis à jour avec succès !' : 'Terrain ajouté avec succès !')
      setTimeout(() => navigate('/dashboard'), 1500)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ─── Rendu ────────────────────────────────────────────────────
  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-green-600"/>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => navigate('/dashboard')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
          <ArrowLeft size={20}/>
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            {isEdit ? 'Modifier le terrain' : 'Ajouter un terrain'}
          </h1>
          <p className="text-xs text-gray-500">
            {isEdit ? form.name : 'Remplissez les informations du terrain'}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6">

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { n: 1, label: 'Informations' },
            { n: 2, label: 'Créneaux'     },
            { n: 3, label: 'Photos'       },
          ].map(({ n, label }, i, arr) => (
            <div key={n} className="flex items-center flex-1">
              <button onClick={() => setStep(n)}
                className="flex items-center gap-2 group">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step === n
                    ? 'bg-green-600 text-white shadow-lg shadow-green-200'
                    : step > n
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-400'
                }`}>
                  {step > n ? <CheckCircle2 size={16}/> : n}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${
                  step === n ? 'text-gray-900' : 'text-gray-400'
                }`}>{label}</span>
              </button>
              {i < arr.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 transition-colors ${
                  step > n ? 'bg-green-300' : 'bg-gray-200'
                }`}/>
              )}
            </div>
          ))}
        </div>

        {/* Alertes */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
              <AlertCircle size={15}/> {error}
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm mb-4">
              <CheckCircle2 size={15}/> {success}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">

            {/* ── ÉTAPE 1 : Informations ── */}
            {step === 1 && (
              <motion.div key="step1" variants={fadeUp} initial="hidden" animate="visible" exit="hidden"
                className="space-y-5">
                <Card title="Informations générales" icon={<Building2 size={17}/>}>
                  <Field label="Nom du terrain *" icon={<Building2 size={15}/>}>
                    <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                      placeholder="Ex: Terrain Atlas" required
                      className="input-field"/>
                  </Field>
                  <Field label="Description">
                    <textarea value={form.description}
                      onChange={e => setForm({...form, description: e.target.value})}
                      placeholder="Décrivez votre terrain..." rows={3}
                      className="input-field resize-none"/>
                  </Field>
                </Card>

                <Card title="Localisation" icon={<MapPin size={17}/>}>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Ville *" icon={<MapPin size={15}/>}>
                      <input value={form.city} onChange={e => setForm({...form, city: e.target.value})}
                        placeholder="Casablanca" required className="input-field"/>
                    </Field>
                    <Field label="Adresse" icon={<MapPin size={15}/>}>
                      <input value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                        placeholder="Rue, quartier..." className="input-field"/>
                    </Field>
                  </div>
                </Card>

                <Card title="Caractéristiques" icon={<Layers size={17}/>}>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Prix / heure (DH) *" icon={<DollarSign size={15}/>}>
                      <input type="number" value={form.price_per_hour}
                        onChange={e => setForm({...form, price_per_hour: e.target.value})}
                        placeholder="200" min="0" required className="input-field"/>
                    </Field>
                    <Field label="Format *" icon={<Users size={15}/>}>
                      <select value={form.size} onChange={e => setForm({...form, size: e.target.value})}
                        className="input-field">
                        {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </Field>
                  </div>

                  <Field label="Surface">
                    <div className="grid grid-cols-3 gap-2">
                      {SURFACES.map(s => (
                        <button key={s.value} type="button"
                          onClick={() => setForm({...form, surface: s.value})}
                          className={`py-2.5 px-3 rounded-xl text-xs font-medium border-2 transition-all ${
                            form.surface === s.value
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Équipements">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {AMENITIES_LIST.map(a => (
                        <button key={a.value} type="button"
                          onClick={() => setForm(prev => ({
                            ...prev,
                            amenities: prev.amenities.includes(a.value)
                              ? prev.amenities.filter(x => x !== a.value)
                              : [...prev.amenities, a.value]
                          }))}
                          className={`py-2 px-3 rounded-xl text-xs font-medium border-2 transition-all text-left ${
                            form.amenities.includes(a.value)
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}>
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Terrain actif</p>
                      <p className="text-xs text-gray-500">Visible pour les clients</p>
                    </div>
                    <button type="button"
                      onClick={() => setForm(prev => ({...prev, is_active: !prev.is_active}))}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        form.is_active ? 'bg-green-500' : 'bg-gray-300'
                      }`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                        form.is_active ? 'left-7' : 'left-1'
                      }`}/>
                    </button>
                  </div>
                </Card>

                <div className="flex justify-end">
                  <button type="button" onClick={() => setStep(2)}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors shadow-sm shadow-green-200">
                    Suivant → Créneaux
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── ÉTAPE 2 : Créneaux ── */}
            {step === 2 && (
              <motion.div key="step2" variants={fadeUp} initial="hidden" animate="visible" exit="hidden"
                className="space-y-5">
                <Card title="Créneaux horaires disponibles" icon={<Clock size={17}/>}>
                  <p className="text-xs text-gray-500 mb-4">
                    Définissez les jours et horaires d'ouverture de votre terrain.
                  </p>

                  <div className="space-y-3">
                    {slots.map((slot, idx) => (
                      <motion.div key={idx}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 bg-gray-50 rounded-xl p-3"
                      >
                        {/* Jour */}
                        <select value={slot.day_of_week}
                          onChange={e => updateSlot(idx, 'day_of_week', Number(e.target.value))}
                          className="text-sm border-2 border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-green-500 bg-white">
                          {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>

                        {/* Heure début */}
                        <input type="time" value={slot.start_time}
                          onChange={e => updateSlot(idx, 'start_time', e.target.value)}
                          className="text-sm border-2 border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-green-500 bg-white flex-1"/>

                        <span className="text-gray-400 text-sm">→</span>

                        {/* Heure fin */}
                        <input type="time" value={slot.end_time}
                          onChange={e => updateSlot(idx, 'end_time', e.target.value)}
                          className="text-sm border-2 border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-green-500 bg-white flex-1"/>

                        {/* Disponible */}
                        <button type="button"
                          onClick={() => updateSlot(idx, 'is_available', !slot.is_available)}
                          className={`w-8 h-5 rounded-full transition-colors shrink-0 ${
                            slot.is_available ? 'bg-green-500' : 'bg-gray-300'
                          }`}>
                          <span className={`block w-3 h-3 bg-white rounded-full shadow mx-auto transition-all ${
                            slot.is_available ? 'translate-x-1.5' : '-translate-x-1.5'
                          }`}/>
                        </button>

                        {/* Supprimer */}
                        <button type="button" onClick={() => removeSlot(idx)}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={14}/>
                        </button>
                      </motion.div>
                    ))}
                  </div>

                  <button type="button" onClick={addSlot}
                    className="mt-3 w-full py-2.5 border-2 border-dashed border-gray-300 hover:border-green-400 text-gray-500 hover:text-green-600 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2">
                    <Plus size={16}/> Ajouter un créneau
                  </button>
                </Card>

                <div className="flex justify-between">
                  <button type="button" onClick={() => setStep(1)}
                    className="px-6 py-3 text-gray-600 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                    ← Retour
                  </button>
                  <button type="button" onClick={() => setStep(3)}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors shadow-sm shadow-green-200">
                    Suivant → Photos
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── ÉTAPE 3 : Photos ── */}
            {step === 3 && (
              <motion.div key="step3" variants={fadeUp} initial="hidden" animate="visible" exit="hidden"
                className="space-y-5">
                <Card title="Photos du terrain" icon={<Image size={17}/>}>
                  {/* Zone d'upload */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 hover:border-green-400 rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-green-50/30"
                  >
                    <Upload size={32} className="mx-auto text-gray-400 mb-2"/>
                    <p className="text-sm font-medium text-gray-600">Cliquez pour ajouter des photos</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG — Max 5MB par photo</p>
                    <input ref={fileInputRef} type="file" multiple accept="image/*"
                      className="hidden" onChange={handleImageSelect}/>
                  </div>

                  {/* Photos existantes */}
                  {images.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">Photos actuelles</p>
                      <div className="grid grid-cols-3 gap-2">
                        {images.map((url, idx) => (
                          <div key={idx} className="relative group aspect-video rounded-xl overflow-hidden bg-gray-100">
                            <img src={url} alt="" className="w-full h-full object-cover"/>
                            <button type="button" onClick={() => removeExistingImage(idx)}
                              className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <X size={12} className="text-white"/>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nouvelles photos */}
                  {previews.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">Nouvelles photos</p>
                      <div className="grid grid-cols-3 gap-2">
                        {previews.map((url, idx) => (
                          <div key={idx} className="relative group aspect-video rounded-xl overflow-hidden bg-gray-100">
                            <img src={url} alt="" className="w-full h-full object-cover"/>
                            <button type="button" onClick={() => removeNewImage(idx)}
                              className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <X size={12} className="text-white"/>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>

                <div className="flex justify-between">
                  <button type="button" onClick={() => setStep(2)}
                    className="px-6 py-3 text-gray-600 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                    ← Retour
                  </button>
                  <button type="submit" disabled={loading}
                    className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-green-200 flex items-center gap-2">
                    {loading
                      ? <><Loader2 size={17} className="animate-spin"/> Enregistrement...</>
                      : <><CheckCircle2 size={17}/> {isEdit ? 'Mettre à jour' : 'Ajouter le terrain'}</>
                    }
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </form>
      </div>
    </div>
  )
}

// ─── Composants helper ────────────────────────────────────────
function Card({ title, icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
        <span className="text-green-600">{icon}</span>
        <h2 className="font-bold text-gray-900 text-sm">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, icon, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
            {icon}
          </span>
        )}
        <div className={icon ? '[&>*]:pl-9' : ''}>{children}</div>
      </div>
    </div>
  )
}
