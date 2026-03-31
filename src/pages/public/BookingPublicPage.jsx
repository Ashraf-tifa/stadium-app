// src/pages/public/BookingPublicPage.jsx
// ── صفحة عامة — بدون login — اللاعب يحجز مباشرة ──
import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Clock, Star, Building2, Trophy, Users,
  ChevronLeft, ChevronRight, CheckCircle2, AlertCircle,
  Loader2, Phone, User, Calendar, X, Zap, Shield
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin',
                   'Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAYS_FR   = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']

export default function BookingPublicPage() {
  const { ownerId }             = useParams() // /book/:ownerId
  const [owner, setOwner]       = useState(null)
  const [stadiums, setStadiums] = useState([])
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [activeTab, setActiveTab] = useState('stadiums')
  const [selectedStadium, setSelectedStadium] = useState(null)

  useEffect(() => { if (ownerId) fetchOwnerData() }, [ownerId])

  async function fetchOwnerData() {
    setLoading(true)
  try {
    // ✅ بدون .eq('role', 'owner') — RLS قد تمنع هذا
    const { data: ownerData, error: ownerErr } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .eq('id', ownerId)
      .single()

    console.log('Owner fetch:', ownerData, ownerErr)

    if (ownerErr || !ownerData) {
      setError('Propriétaire introuvable.')
      setLoading(false)
      return
    }
    setOwner(ownerData)
      // Terrains actifs
      const { data: stds } = await supabase
        .from('stadiums')
        .select('*, reviews(rating), time_slots(*)')
        .eq('owner_id', ownerId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      setStadiums((stds || []).map(s => ({
        ...s,
        avgRating: s.reviews?.length
          ? (s.reviews.reduce((sum, r) => sum + r.rating, 0) / s.reviews.length).toFixed(1)
          : null,
      })))

      // Tournois ouverts
      const { data: tours } = await supabase
        .from('tournaments')
        .select('*, stadiums(name), tournament_teams(count)')
        .eq('owner_id', ownerId)
        .in('status', ['open'])
        .order('start_date', { ascending: true })

      setTournaments((tours || []).map(t => ({
        ...t,
        teamCount:   t.tournament_teams?.[0]?.count || 0,
        stadiumName: t.stadiums?.name || '',
      })))

    } catch(e) {
      setError('Erreur de chargement.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: '#f9fafb', fontFamily: "'Outfit', sans-serif" }}>
      <Loader2 size={28} className="animate-spin text-gray-300"/>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-gray-400"
      style={{ background: '#f9fafb', fontFamily: "'Outfit', sans-serif" }}>
      <AlertCircle size={40} className="opacity-40"/>
      <p className="font-semibold">{error}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Outfit', sans-serif" }}>

      {/* ── Header ── */}
      <header className="bg-white sticky top-0 z-20" style={{ borderBottom: '1px solid #f0f0f0' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center">
              <Zap size={16} className="text-green-400" fill="#4ade80"/>
            </div>
            <div>
              <p className="font-black text-gray-900 text-sm">{owner?.full_name}</p>
              <p className="text-xs text-gray-400">Terrains & Tournois</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-gray-400">
            <Shield size={12}/> StadiumPro
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white rounded-2xl" style={{ border: '1px solid #f0f0f0' }}>
          <button onClick={() => setActiveTab('stadiums')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'stadiums' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <Building2 size={15}/> Terrains ({stadiums.length})
          </button>
          <button onClick={() => setActiveTab('tournaments')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'tournaments' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <Trophy size={15}/> Tournois ({tournaments.length})
          </button>
        </div>

        <AnimatePresence mode="wait">

          {/* ── TERRAINS ── */}
          {activeTab === 'stadiums' && (
            <motion.div key="stadiums"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

              {stadiums.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                  <Building2 size={36} className="mb-3"/>
                  <p className="font-semibold">Aucun terrain disponible</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stadiums.map((s, i) => (
                    <motion.div key={s.id}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="bg-white rounded-2xl overflow-hidden cursor-pointer group hover:shadow-md transition-shadow"
                      style={{ border: '1px solid #f0f0f0' }}
                      onClick={() => setSelectedStadium(s)}>

                      {/* Image */}
                      <div className="h-36 sm:h-44 bg-gray-100 relative overflow-hidden">
                        {s.images?.length > 0 ? (
                          <img src={s.images[0]} alt={s.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={e => e.target.style.display = 'none'}/>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 size={40} className="text-gray-200"/>
                          </div>
                        )}
                        <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full bg-black/50 text-white backdrop-blur-sm">
                          {s.size}
                        </span>
                        {s.avgRating && (
                          <span className="absolute top-3 right-3 flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-amber-400 text-white">
                            <Star size={10} fill="white"/> {s.avgRating}
                          </span>
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="font-black text-gray-900 text-base">{s.name}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin size={12} className="text-gray-400"/>
                          <p className="text-xs text-gray-500">{s.city}{s.address ? ` · ${s.address}` : ''}</p>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid #f5f5f5' }}>
                          <p className="text-lg font-black text-gray-900">
                            {s.price_per_hour} <span className="text-xs font-semibold text-gray-400">DH/h</span>
                          </p>
                          <span className="text-sm font-bold px-4 py-2 rounded-xl bg-gray-900 text-white">
                            Réserver →
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── TOURNOIS ── */}
          {activeTab === 'tournaments' && (
            <motion.div key="tournaments"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

              {tournaments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                  <Trophy size={36} className="mb-3"/>
                  <p className="font-semibold">Aucun tournoi ouvert</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tournaments.map((t, i) => (
                    <TournamentCard key={t.id} tournament={t} index={i}/>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Modal de réservation terrain ── */}
      <AnimatePresence>
        {selectedStadium && (
          <PublicBookingModal
            stadium={selectedStadium}
            onClose={() => setSelectedStadium(null)}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-gray-300 font-medium">
        Propulsé par <span className="font-black text-gray-400">StadiumPro</span>
      </footer>
    </div>
  )
}

// ─── Carte tournoi ────────────────────────────────────────────
function TournamentCard({ tournament: t, index }) {
  const [showRegister, setShowRegister] = useState(false)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06 }}
        className="bg-white rounded-2xl overflow-hidden"
        style={{ border: '1px solid #f0f0f0' }}>

        <div className="h-1.5 bg-blue-500"/>
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Trophy size={18} className="text-purple-600"/>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
              Inscriptions ouvertes
            </span>
          </div>

          <h3 className="font-black text-gray-900">{t.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{t.stadiumName} · Début: {t.start_date}</p>

          {t.prize_description && (
            <p className="text-xs text-amber-600 font-bold mt-1.5">🏅 {t.prize_description}</p>
          )}

          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Équipes</span>
              <span className="font-bold text-gray-700">{t.teamCount}/{t.max_teams}</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-purple-500"
                style={{ width: `${t.max_teams ? Math.round((t.teamCount/t.max_teams)*100) : 0}%` }}/>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-3 pt-3 text-xs text-gray-400"
            style={{ borderTop: '1px solid #f5f5f5' }}>
            <span>{t.team_size}v{t.team_size}</span>
            <span>·</span>
            <span>{t.entry_fee > 0 ? `${t.entry_fee} DH` : 'Gratuit'}</span>
            <span>·</span>
            <span>Jusqu'au {t.registration_deadline}</span>
          </div>

          <button onClick={() => setShowRegister(true)}
            disabled={t.teamCount >= t.max_teams}
            className="w-full mt-3 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
            style={{ background: '#111827', color: 'white' }}>
            {t.teamCount >= t.max_teams ? 'Complet' : 'Inscrire mon équipe →'}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showRegister && (
          <PublicTournamentRegisterModal
            tournament={t}
            onClose={() => setShowRegister(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Modal Réservation — Jdool Osbou3i ───────────────────────
function PublicBookingModal({ stadium, onClose }) {
  const [step, setStep]               = useState(1) // 1=planning, 2=form, 3=success
  const [weekOffset, setWeekOffset]   = useState(0)
  const [weekBookings, setWeekBookings] = useState([])
  const [recurringBks, setRecurringBks] = useState([])
  const [loadingBk, setLoadingBk]       = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [mobileDayOffset, setMobileDayOffset] = useState(0) // 0=Lun-Mer, 1=Jeu-Sam, 2=Dim
  const [form, setForm]               = useState({ name: '', phone: '' })
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState('')

  const MO = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
  const DS = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']

  function fmt(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }

  const weekStart = useMemo(() => {
    const now = new Date(); now.setHours(0,0,0,0)
    const day = now.getDay()
    const diff = day === 0 ? -6 : 1 - day
    now.setDate(now.getDate() + diff + weekOffset * 7)
    return now
  }, [weekOffset])

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d
    }), [weekStart])

  useEffect(() => { loadWeekBookings(); setMobileDayOffset(0) }, [weekOffset])

  // Charge les abonnés une seule fois
  useEffect(() => {
    supabase.from('recurring_bookings')
      .select('day_of_week, start_time, end_time, player_name')
      .eq('stadium_id', stadium.id)
      .then(({ data }) => setRecurringBks(data || []))
  }, [stadium.id])

  async function loadWeekBookings() {
    setLoadingBk(true)
    try {
      const { data } = await supabase
        .from('bookings')
        .select('booking_date, start_time, end_time')
        .eq('stadium_id', stadium.id)
        .gte('booking_date', fmt(weekDays[0]))
        .lte('booking_date', fmt(weekDays[6]))
        .neq('status', 'cancelled')
      setWeekBookings(data || [])
    } catch { setWeekBookings([]) }
    finally { setLoadingBk(false) }
  }

  // Hours from time_slots or default 8-22
  const timeSlots = stadium.time_slots || []
  const hours = useMemo(() => {
    const s = new Set()
    timeSlots.filter(t => t.is_available).forEach(t => {
      const sh = parseInt(t.start_time), eh = parseInt(t.end_time)
      for (let h = sh; h < eh; h++) s.add(h)
    })
    return s.size > 0
      ? Array.from(s).sort((a,b) => a-b)
      : Array.from({length:14}, (_,i) => 8+i)
  }, [timeSlots])

  function hasSlot(date, hour) {
    // No time_slots configured → all default hours are available
    if (timeSlots.length === 0) return true
    const dow = date.getDay()
    return timeSlots.some(s =>
      s.day_of_week === dow &&
      parseInt(s.start_time) <= hour &&
      parseInt(s.end_time) > hour &&
      s.is_available
    )
  }

  function isBooked(date, hour) {
    const ds = fmt(date)
    const t1 = `${String(hour).padStart(2,'0')}:00`
    const t2 = `${String(hour+1).padStart(2,'0')}:00`
    return weekBookings.some(b =>
      b.booking_date === ds &&
      b.start_time.slice(0,5) <= t1 &&
      b.end_time.slice(0,5) >= t2
    )
  }

  function isRecurring(date, hour) {
    const dow = date.getDay()
    const t1  = `${String(hour).padStart(2,'0')}:00`
    const t2  = `${String(hour+1).padStart(2,'0')}:00`
    return recurringBks.some(r =>
      r.day_of_week === dow &&
      r.start_time.slice(0,5) <= t1 &&
      r.end_time.slice(0,5)   >= t2
    )
  }

  function isPast(date, hour) {
    const now = new Date()
    const d = new Date(date); d.setHours(hour+1, 0, 0, 0)
    return d <= now
  }

  function handleSelectSlot(date, hour) {
    setSelectedDate(date)
    setSelectedSlot({
      start: `${String(hour).padStart(2,'0')}:00`,
      end:   `${String(hour+1).padStart(2,'0')}:00`,
    })
    setStep(2)
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Veuillez remplir tous les champs.'); return
    }
    setError(''); setSubmitting(true)
    try {
      const { error } = await supabase.from('bookings').insert({
        stadium_id:   stadium.id,
        customer_id:  null,
        booking_date: fmt(selectedDate),
        start_time:   selectedSlot.start + ':00',
        end_time:     selectedSlot.end   + ':00',
        total_price:  stadium.price_per_hour,
        status:       'pending',
        notes:        `Client: ${form.name} — Tél: ${form.phone}`,
      })
      if (error) throw error
      setStep(3)
    } catch(e) { setError(e.message) }
    finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}/>

      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }} transition={{ duration: 0.25 }}
        className="relative w-full sm:max-w-2xl bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl"
        style={{ maxHeight: '92vh' }}>

        <div className="h-1 bg-gradient-to-r from-green-400 to-green-600"/>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f5f5f5' }}>
          <div>
            <p className="font-black text-gray-900">{stadium.name}</p>
            <p className="text-xs text-gray-400">{stadium.city} · {stadium.size} · {stadium.price_per_hour} DH/h</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400">
            <X size={18}/>
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(92vh - 70px)' }}>
          <AnimatePresence mode="wait">

            {/* ── Étape 1 : Tableau Hebdomadaire ── */}
            {step === 1 && (
              <motion.div key="planning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                {/* Navigation semaine */}
                <div className="flex items-center justify-between px-3 sm:px-4 py-3 bg-gray-50" style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <button onClick={() => setWeekOffset(w => w-1)} disabled={weekOffset <= 0}
                    className="p-2 rounded-xl hover:bg-white disabled:opacity-30 transition-all border border-gray-200">
                    <ChevronLeft size={16} className="text-gray-600"/>
                  </button>
                  <p className="text-xs sm:text-sm font-black text-gray-900">
                    {weekDays[0].getDate()} {MO[weekDays[0].getMonth()]} — {weekDays[6].getDate()} {MO[weekDays[6].getMonth()]} {weekDays[6].getFullYear()}
                  </p>
                  <button onClick={() => setWeekOffset(w => w+1)}
                    className="p-2 rounded-xl hover:bg-white transition-all border border-gray-200">
                    <ChevronRight size={16} className="text-gray-600"/>
                  </button>
                </div>

                {/* Navigation jours — mobile uniquement */}
                <div className="flex sm:hidden items-center justify-between px-3 py-2 bg-white" style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <button onClick={() => setMobileDayOffset(d => Math.max(0, d-1))} disabled={mobileDayOffset === 0}
                    className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30">
                    <ChevronLeft size={14} className="text-gray-600"/>
                  </button>
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <button key={i} onClick={() => setMobileDayOffset(i)}
                        className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                        style={{
                          background: mobileDayOffset === i ? '#111827' : '#f3f4f6',
                          color: mobileDayOffset === i ? '#fff' : '#6b7280',
                        }}>
                        {['Lun–Mer', 'Jeu–Sam', 'Dim'][i]}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setMobileDayOffset(d => Math.min(2, d+1))} disabled={mobileDayOffset === 2}
                    className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30">
                    <ChevronRight size={14} className="text-gray-600"/>
                  </button>
                </div>

                {/* Légende */}
                <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2 text-xs text-gray-500 flex-wrap" style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-green-100 border border-green-300 inline-block"/>Disponible
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-red-100 border border-red-200 inline-block"/>Réservé
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-blue-100 border border-blue-200 inline-block"/>Abonné
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-gray-100 inline-block"/>Fermé
                  </span>
                </div>

                {loadingBk ? (
                  <div className="flex justify-center py-14">
                    <Loader2 size={24} className="animate-spin text-gray-300"/>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                          <th className="w-8 sm:w-10 px-1 sm:px-2 py-3 text-left text-gray-400 font-semibold sticky left-0 bg-white z-10">h</th>
                          {weekDays.map((d, i) => {
                            const isToday = fmt(d) === fmt(new Date())
                            // Sur mobile: afficher seulement 3 jours selon mobileDayOffset
                            const mobileRanges = [[0,1,2],[3,4,5],[6]]
                            const visibleOnMobile = mobileRanges[mobileDayOffset].includes(i)
                            return (
                              <th key={i}
                                className={`px-1 py-2 text-center ${visibleOnMobile ? '' : 'hidden sm:table-cell'}`}
                                style={{ minWidth: '46px' }}>
                                <div className={`text-xs font-semibold ${isToday ? 'text-green-600' : 'text-gray-400'}`}>
                                  {DS[d.getDay()]}
                                </div>
                                <div className={`text-sm sm:text-base font-black leading-tight ${isToday ? 'text-green-600' : 'text-gray-900'}`}>
                                  {d.getDate()}
                                </div>
                                {isToday && <div className="w-1.5 h-1.5 rounded-full bg-green-500 mx-auto mt-0.5"/>}
                              </th>
                            )
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {hours.map(hour => (
                          <tr key={hour} style={{ borderBottom: '1px solid #fafafa' }}>
                            <td className="px-1 sm:px-2 py-0.5 text-gray-400 font-mono font-semibold sticky left-0 bg-white z-10 text-xs whitespace-nowrap">
                              {String(hour).padStart(2,'0')}h
                            </td>
                            {weekDays.map((d, i) => {
                              const mobileRanges = [[0,1,2],[3,4,5],[6]]
                              const visibleOnMobile = mobileRanges[mobileDayOffset].includes(i)
                              const past      = isPast(d, hour)
                              const slot      = hasSlot(d, hour)
                              const recurring = slot && isRecurring(d, hour)
                              const booked    = slot && !recurring && isBooked(d, hour)
                              const available = slot && !booked && !recurring && !past
                              return (
                                <td key={i} className={`px-1 py-0.5 text-center ${visibleOnMobile ? '' : 'hidden sm:table-cell'}`}>
                                  {!slot ? (
                                    <div className="h-9 rounded-lg bg-gray-50"/>
                                  ) : recurring ? (
                                    <div className="h-9 rounded-lg flex items-center justify-center font-bold text-xs"
                                      style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb' }}
                                      title="Créneau abonné">
                                      Abonné
                                    </div>
                                  ) : booked ? (
                                    <div className="h-9 rounded-lg flex items-center justify-center text-red-400 font-bold text-xs"
                                      style={{ background: '#fef2f2', border: '1px solid #fee2e2' }}>
                                      Réservé
                                    </div>
                                  ) : past ? (
                                    <div className="h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xs">—</div>
                                  ) : (
                                    <button onClick={() => handleSelectSlot(d, hour)}
                                      className="w-full h-9 rounded-lg font-bold text-xs transition-all hover:scale-105"
                                      style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a' }}
                                      onMouseEnter={e => { e.currentTarget.style.background='#16a34a'; e.currentTarget.style.color='white'; e.currentTarget.style.borderColor='#16a34a' }}
                                      onMouseLeave={e => { e.currentTarget.style.background='#f0fdf4'; e.currentTarget.style.color='#16a34a'; e.currentTarget.style.borderColor='#86efac' }}>
                                      {String(hour).padStart(2,'0')}:00
                                    </button>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {hours.length === 0 && (
                      <div className="py-14 text-center text-gray-400">
                        <Clock size={30} className="mx-auto mb-2 opacity-30"/>
                        <p className="font-semibold text-sm">Aucun créneau configuré</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="px-4 py-3 text-center" style={{ borderTop: '1px solid #f5f5f5' }}>
                  <p className="text-xs text-gray-400">Cliquez sur un créneau vert pour réserver</p>
                </div>
              </motion.div>
            )}

            {/* ── Étape 2 : Formulaire ── */}
            {step === 2 && selectedDate && selectedSlot && (
              <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="p-5 space-y-4">

                {/* Récap créneau */}
                <div className="rounded-2xl p-4 space-y-1" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <p className="text-xs font-black text-green-700 uppercase tracking-wide mb-2">Créneau sélectionné ✓</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold text-gray-800">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-green-600"/>
                      {DS[selectedDate.getDay()]} {selectedDate.getDate()} {MO[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-green-600"/>
                      {selectedSlot.start} – {selectedSlot.end}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-green-700 font-black">{stadium.price_per_hour} DH</span>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5 text-xs">
                    <AlertCircle size={13}/> {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Votre nom *</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                      placeholder="Prénom Nom" required autoFocus
                      className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gray-900 text-sm font-medium text-gray-900 outline-none transition-all bg-gray-50 focus:bg-white"/>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Téléphone *</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                      placeholder="+212 6XX XXX XXX" required type="tel"
                      className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gray-900 text-sm font-medium text-gray-900 outline-none transition-all bg-gray-50 focus:bg-white"/>
                  </div>
                </div>

                <p className="text-xs text-gray-400 text-center">Votre demande sera confirmée par le propriétaire du terrain.</p>

                <div className="flex gap-3 pt-1">
                  <button onClick={() => { setStep(1); setError('') }}
                    className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold text-sm rounded-2xl hover:bg-gray-50 transition-all">
                    ← Retour
                  </button>
                  <button onClick={handleSubmit} disabled={submitting}
                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all">
                    {submitting ? <><Loader2 size={14} className="animate-spin"/> Envoi...</> : <><CheckCircle2 size={14}/> Confirmer</>}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Étape 3 : Succès ── */}
            {step === 3 && (
              <motion.div key="success"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-14 px-5 gap-4 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={32} className="text-green-600"/>
                </div>
                <h3 className="font-black text-gray-900 text-xl">Demande envoyée !</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                  Votre réservation a été soumise. Le propriétaire vous contactera au
                  <strong> {form.phone}</strong> pour confirmer.
                </p>
                <button onClick={onClose}
                  className="px-8 py-3 bg-gray-900 text-white font-bold text-sm rounded-xl hover:bg-gray-800 transition-all">
                  Fermer
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Modal inscription tournoi (public) ───────────────────────
function PublicTournamentRegisterModal({ tournament, onClose }) {
  const [teamName, setTeamName]   = useState('')
  const [captain, setCaptain]     = useState('')
  const [phone, setPhone]         = useState('')
  const [players, setPlayers]     = useState(Array(tournament.team_size || 5).fill(''))
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)

  async function handleSubmit() {
    if (!teamName.trim() || !captain.trim() || !phone.trim()) {
      setError('Nom équipe, capitaine et téléphone obligatoires.'); return
    }
    setError(''); setLoading(true)
    try {
      const { error } = await supabase.from('tournament_teams').insert({
        tournament_id: tournament.id,
        name:          teamName.trim(),
        captain_name:  captain.trim(),
        captain_phone: phone.trim(),
        players:       [captain.trim(), ...players.filter(p => p.trim())],
        status:        'pending',
      })
      if (error) throw error
      setSuccess(true)
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}/>
      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }} transition={{ duration: 0.25 }}
        className="relative w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl">

        <div className="h-1 bg-gradient-to-r from-purple-400 to-indigo-600"/>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f5f5f5' }}>
          <div>
            <p className="font-black text-gray-900 text-sm">Inscrire mon équipe</p>
            <p className="text-xs text-gray-400">{tournament.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400"><X size={18}/></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto" style={{ maxHeight: '65vh' }}>
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 size={28} className="text-green-600"/>
              </div>
              <p className="font-black text-gray-900">Inscription envoyée !</p>
              <p className="text-xs text-gray-500">Le propriétaire validera votre équipe.</p>
              <button onClick={onClose} className="px-5 py-2 bg-gray-900 text-white font-bold text-sm rounded-xl mt-2">
                Fermer
              </button>
            </div>
          ) : (
            <>
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5 text-xs">
                    <AlertCircle size={13}/> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {[
                { label: 'Nom de l\'équipe *', value: teamName, onChange: setTeamName, placeholder: 'Ex: Les Lions' },
                { label: 'Nom du capitaine *', value: captain,  onChange: setCaptain,  placeholder: 'Prénom Nom'    },
                { label: 'Téléphone capitaine *', value: phone, onChange: setPhone,    placeholder: '+212 6XX...'   },
              ].map(({ label, value, onChange, placeholder }) => (
                <div key={label}>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
                  <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gray-900 text-sm font-medium text-gray-900 outline-none transition-all bg-gray-50 focus:bg-white"/>
                </div>
              ))}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Joueurs ({players.length})
                </label>
                <div className="space-y-2">
                  {players.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-black flex items-center justify-center shrink-0">
                        {i+2}
                      </span>
                      <input value={p} onChange={e => {
                        const arr = [...players]; arr[i] = e.target.value; setPlayers(arr)
                      }}
                        placeholder={`Joueur ${i+2}`}
                        className="flex-1 px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-gray-900 text-sm text-gray-700 outline-none bg-gray-50 focus:bg-white transition-all"/>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={onClose}
                  className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold text-sm rounded-2xl hover:bg-gray-50 transition-all">
                  Annuler
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all">
                  {loading ? <><Loader2 size={14} className="animate-spin"/> Envoi...</> : 'Envoyer →'}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
