// src/components/TournamentModal.jsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Trophy, Calendar, Users, DollarSign,
  CheckCircle2, AlertCircle, Loader2, Info
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const EMPTY_FORM = {
  name:                  '',
  description:           '',
  stadium_id:            '',
  max_teams:             8,
  team_size:             5,
  start_date:            '',
  end_date:              '',
  registration_deadline: '',
  entry_fee:             0,
  prize_description:     '',
}

export default function TournamentModal({ isOpen, tournament = null, onClose, onSuccess }) {
  const isEdit = Boolean(tournament)
  const { user } = useAuth()

  const [form, setForm]       = useState(EMPTY_FORM)
  const [stadiums, setStadiums] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // Charger les terrains du propriétaire
  useEffect(() => {
    if (!isOpen || !user) return
    loadStadiums()
    setError('')

    if (tournament) {
      setForm({
        name:                  tournament.name                  || '',
        description:           tournament.description           || '',
        stadium_id:            tournament.stadium_id            || '',
        max_teams:             tournament.max_teams             || 8,
        team_size:             tournament.team_size             || 5,
        start_date:            tournament.start_date            || '',
        end_date:              tournament.end_date              || '',
        registration_deadline: tournament.registration_deadline || '',
        entry_fee:             tournament.entry_fee             || 0,
        prize_description:     tournament.prize_description     || '',
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [isOpen, tournament, user])

  async function loadStadiums() {
    const { data } = await supabase
      .from('stadiums')
      .select('id, name, city')
      .eq('owner_id', user.id)
      .eq('is_active', true)
    setStadiums(data || [])
    // Pré-sélectionner le premier terrain si un seul
    if (!tournament && data?.length === 1) {
      setForm(f => ({ ...f, stadium_id: data[0].id }))
    }
  }

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function validate() {
    if (!form.name)                  return 'Le nom du tournoi est obligatoire.'
    if (!form.stadium_id)            return 'Sélectionnez un terrain.'
    if (!form.start_date)            return 'La date de début est obligatoire.'
    if (!form.end_date)              return 'La date de fin est obligatoire.'
    if (!form.registration_deadline) return "La date limite d'inscription est obligatoire."
    if (form.end_date < form.start_date)
      return 'La date de fin doit être après la date de début.'
    if (form.registration_deadline > form.start_date)
      return "La date limite d'inscription doit être avant le début."
    if (form.max_teams < 2)          return 'Minimum 2 équipes.'
    return null
  }

  async function handleSubmit() {
    const err = validate()
    if (err) { setError(err); return }
    setError(''); setLoading(true)

    try {
      const payload = {
        ...form,
        max_teams:  Number(form.max_teams),
        team_size:  Number(form.team_size),
        entry_fee:  Number(form.entry_fee),
        owner_id:   user.id,
        status:     tournament?.status || 'draft',
      }

      if (isEdit) {
        const { error } = await supabase
          .from('tournaments').update(payload)
          .eq('id', tournament.id).eq('owner_id', user.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('tournaments').insert(payload)
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

  // Date min = aujourd'hui
  const today = new Date().toISOString().split('T')[0]

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{ opacity: 0,  scale: 0.95,   y: 10 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="h-1 bg-gradient-to-r from-purple-400 via-purple-500 to-indigo-600"/>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Trophy size={17} className="text-purple-600"/>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    {isEdit ? `Modifier — ${tournament?.name}` : 'Créer un tournoi'}
                  </h2>
                  <p className="text-xs text-gray-400">Douri mجموعات (Round Robin)</p>
                </div>
              </div>
              <button onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400">
                <X size={18}/>
              </button>
            </div>

            {/* Corps */}
            <div className="overflow-y-auto p-6 space-y-4" style={{ maxHeight: '65vh' }}>

              {/* Erreur */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-xs">
                    <AlertCircle size={14}/> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Nom */}
              <Field label="Nom du tournoi *">
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="Ex: Tournoi Ramadan 2026" className="mi"/>
              </Field>

              {/* Description */}
              <Field label="Description">
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Décrivez le tournoi..." rows={2} className="mi resize-none"/>
              </Field>

              {/* Terrain */}
              <Field label="Terrain *">
                {stadiums.length === 0 ? (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-700">
                    <Info size={13}/> Aucun terrain actif trouvé. Ajoutez un terrain d'abord.
                  </div>
                ) : (
                  <select value={form.stadium_id} onChange={e => set('stadium_id', e.target.value)} className="mi">
                    <option value="">-- Sélectionnez un terrain --</option>
                    {stadiums.map(s => (
                      <option key={s.id} value={s.id}>{s.name} — {s.city}</option>
                    ))}
                  </select>
                )}
              </Field>

              {/* Équipes + Joueurs */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre max d'équipes *">
                  <select value={form.max_teams} onChange={e => set('max_teams', e.target.value)} className="mi">
                    {[4, 6, 8, 10, 12, 16].map(n => (
                      <option key={n} value={n}>{n} équipes</option>
                    ))}
                  </select>
                </Field>
                <Field label="Joueurs par équipe">
                  <select value={form.team_size} onChange={e => set('team_size', e.target.value)} className="mi">
                    {[5, 6, 7, 8, 9, 10, 11].map(n => (
                      <option key={n} value={n}>{n} joueurs</option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Dates */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                  <Calendar size={13}/> Dates
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Début *">
                    <input type="date" value={form.start_date} min={today}
                      onChange={e => set('start_date', e.target.value)} className="mi"/>
                  </Field>
                  <Field label="Fin *">
                    <input type="date" value={form.end_date} min={form.start_date || today}
                      onChange={e => set('end_date', e.target.value)} className="mi"/>
                  </Field>
                </div>
                <Field label="Limite d'inscription *">
                  <input type="date" value={form.registration_deadline}
                    min={today} max={form.start_date || undefined}
                    onChange={e => set('registration_deadline', e.target.value)} className="mi"/>
                  <p className="text-xs text-gray-400 mt-1">
                    Doit être avant la date de début
                  </p>
                </Field>
              </div>

              {/* Frais + Prix */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Frais d'inscription (DH)">
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input type="number" value={form.entry_fee} min={0}
                      onChange={e => set('entry_fee', e.target.value)}
                      placeholder="0 = gratuit" className="mi pl-8"/>
                  </div>
                </Field>
                <Field label="Nb total de matchs">
                  <div className="mi bg-gray-50 flex items-center justify-center text-sm font-bold text-purple-600">
                    {/* Round Robin : n*(n-1)/2 */}
                    {(() => {
                      const n = Number(form.max_teams)
                      return n >= 2 ? `${n*(n-1)/2} matchs` : '—'
                    })()}
                  </div>
                </Field>
              </div>

              {/* Prix / Récompense */}
              <Field label="Récompense / Prix">
                <textarea value={form.prize_description}
                  onChange={e => set('prize_description', e.target.value)}
                  placeholder="Ex: Trophée + 2000 DH pour le vainqueur..." rows={2}
                  className="mi resize-none"/>
              </Field>

              {/* Info Round Robin */}
              <div className="flex items-start gap-2 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
                <Info size={14} className="text-purple-500 mt-0.5 shrink-0"/>
                <p className="text-xs text-purple-700 leading-relaxed">
                  Le calendrier sera généré automatiquement en <strong>Round Robin</strong> — chaque équipe joue contre toutes les autres une fois. Le classement se met à jour automatiquement après chaque résultat.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button onClick={onClose}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 border-2 border-gray-200 hover:bg-white rounded-2xl transition-all">
                Annuler
              </button>
              <button onClick={handleSubmit} disabled={loading || stadiums.length === 0}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-60 rounded-2xl transition-all shadow-sm shadow-purple-200 flex items-center gap-2">
                {loading
                  ? <><Loader2 size={15} className="animate-spin"/> Enregistrement...</>
                  : <><CheckCircle2 size={15}/> {isEdit ? 'Mettre à jour' : 'Créer le tournoi'}</>
                }
              </button>
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
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
