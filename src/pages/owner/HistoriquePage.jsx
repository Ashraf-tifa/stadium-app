// src/pages/owner/HistoriquePage.jsx
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarCheck, Trophy, TrendingUp, Download,
  Filter, ChevronDown, Building2, Users,
  CheckCircle2, XCircle, Clock, Loader2,
  BarChart3, FileText, AlertCircle
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function HistoriquePage() {
  const [activeTab, setActiveTab] = useState('bookings')

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl">
        {[
          { key: 'bookings',     label: 'Réservations', icon: CalendarCheck },
          { key: 'tournaments',  label: 'Tournois',      icon: Trophy        },
          { key: 'stats',        label: 'Statistiques',  icon: BarChart3     },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === key ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <Icon size={14}/> <span className="hidden sm:block">{label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
          {activeTab === 'bookings'    && <BookingsHistory/>}
          {activeTab === 'tournaments' && <TournamentsHistory/>}
          {activeTab === 'stats'       && <StatsView/>}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ─── Historique Réservations ──────────────────────────────────
function BookingsHistory() {
  const { user, loading: authLoading } = useAuth()
  const [bookings, setBookings]        = useState([])
  const [loading, setLoading]          = useState(true)
  const [filter, setFilter]            = useState('all')
  const [monthFilter, setMonthFilter]  = useState('')
  const [exporting, setExporting]      = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (user) fetchBookings()
    else setLoading(false)
  }, [user, authLoading])

  async function fetchBookings() {
    setLoading(true)
    const { data: stadiums } = await supabase
      .from('stadiums').select('id').eq('owner_id', user.id)
    const ids = stadiums?.map(s => s.id) || []
    if (ids.length === 0) { setBookings([]); setLoading(false); return }

    const { data } = await supabase
      .from('bookings')
      .select(`
  *,
  stadiums(name, city),
  profiles:customer_id(full_name, phone)
`)
      .in('stadium_id', ids)
      .order('booking_date', { ascending: false })

    setBookings(data || [])
    setLoading(false)
  }

  // Filtres
  const filtered = bookings.filter(b => {
    const matchStatus = filter === 'all' || b.status === filter
    const matchMonth  = !monthFilter || b.booking_date?.startsWith(monthFilter)
    return matchStatus && matchMonth
  })

  // Mois disponibles
  const months = [...new Set(bookings.map(b => b.booking_date?.slice(0,7)).filter(Boolean))].sort().reverse()

  // Totaux
  const totalRevenue = filtered
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + Number(b.total_price), 0)

  // Export PDF
  async function exportPDF() {
    setExporting(true)
    try {
      // Créer contenu HTML pour l'impression
      const rows = filtered.map(b => `
        <tr>
          <td>${b.booking_date}</td>
          <td>${b.profiles?.full_name || '—'}</td>
          <td>${b.stadiums?.name || '—'}</td>
          <td>${b.start_time?.slice(0,5)} – ${b.end_time?.slice(0,5)}</td>
          <td>${b.total_price} DH</td>
          <td>${b.status === 'confirmed' ? 'Confirmé' : b.status === 'pending' ? 'En attente' : 'Annulé'}</td>
        </tr>
      `).join('')

      const html = `
        <!DOCTYPE html><html><head>
        <meta charset="utf-8">
        <title>Historique des réservations — StadiumPro</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; color: #111; margin: 20px; }
          h1 { font-size: 18px; margin-bottom: 4px; }
          p { color: #666; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f5f5f5; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
          td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; }
          .total { margin-top: 16px; font-weight: bold; text-align: right; }
        </style>
        </head><body>
        <h1>Historique des réservations</h1>
        <p>Exporté le ${new Date().toLocaleDateString('fr-FR')} — ${filtered.length} réservation(s)</p>
        <table>
          <thead><tr>
            <th>Date</th><th>Client</th><th>Terrain</th>
            <th>Horaire</th><th>Montant</th><th>Statut</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p class="total">Revenus confirmés : ${totalRevenue.toLocaleString()} DH</p>
        </body></html>
      `

      const blob = new Blob([html], { type: 'text/html' })
      const url  = URL.createObjectURL(blob)
      const win  = window.open(url, '_blank')
      win?.print()
      URL.revokeObjectURL(url)
    } finally { setExporting(false) }
  }

  return (
    <div className="space-y-4">
      {/* Résumé */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total',      value: bookings.length,                                  color: 'text-gray-900' },
          { label: 'Confirmées', value: bookings.filter(b=>b.status==='confirmed').length, color: 'text-green-600'},
          { label: 'Revenus',    value: `${bookings.filter(b=>b.status==='confirmed').reduce((s,b)=>s+Number(b.total_price),0).toLocaleString()} DH`, color: 'text-gray-900' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 text-center" style={{ border: '1px solid #f0f0f0' }}>
            <p className={`text-xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 font-semibold mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filtres + Export */}
      <div className="flex gap-2 flex-wrap items-center">
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="px-3 py-2 text-sm font-semibold rounded-xl border border-gray-200 bg-white text-gray-700 outline-none focus:border-gray-900">
          <option value="all">Tous les statuts</option>
          <option value="confirmed">Confirmées</option>
          <option value="pending">En attente</option>
          <option value="cancelled">Annulées</option>
        </select>

        <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)}
          className="px-3 py-2 text-sm font-semibold rounded-xl border border-gray-200 bg-white text-gray-700 outline-none focus:border-gray-900">
          <option value="">Tous les mois</option>
          {months.map(m => (
            <option key={m} value={m}>
              {new Date(m + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </option>
          ))}
        </select>

        <span className="text-sm text-gray-400 font-semibold ml-auto">
          {filtered.length} résultat(s) · {totalRevenue.toLocaleString()} DH
        </span>

        <button onClick={exportPDF} disabled={exporting || filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors">
          {exporting ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>}
          Exporter PDF
        </button>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f0' }}>
        {loading ? (
          <div className="divide-y divide-gray-50">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-center gap-3 px-5 py-4">
                <div className="w-8 h-8 rounded-xl animate-pulse bg-gray-100"/>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-32 animate-pulse"/>
                  <div className="h-2.5 bg-gray-100 rounded w-48 animate-pulse"/>
                </div>
                <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse"/>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-gray-300">
            <CalendarCheck size={28} className="mb-2"/>
            <p className="text-sm font-semibold">Aucune réservation trouvée</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((b, i) => {
              const STATUS = {
                confirmed: { label: 'Confirmé',   cls: 'bg-green-100 text-green-700', Icon: CheckCircle2 },
                pending:   { label: 'En attente', cls: 'bg-amber-100 text-amber-700', Icon: Clock        },
                cancelled: { label: 'Annulé',     cls: 'bg-red-100 text-red-600',     Icon: XCircle      },
              }
              const s = STATUS[b.status] || STATUS.pending
              const SIcon = s.Icon
              return (
                <motion.div key={b.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                    <Users size={14} className="text-gray-500"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{b.profiles?.full_name || 'Client'}</p>
                    <p className="text-xs text-gray-400">
                      {b.stadiums?.name} · {b.booking_date} · {b.start_time?.slice(0,5)}–{b.end_time?.slice(0,5)}
                    </p>
                  </div>
                  <p className="text-sm font-black text-gray-900 hidden sm:block">{b.total_price} DH</p>
                  <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${s.cls}`}>
                    <SIcon size={11}/> {s.label}
                  </span>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Historique Tournois ──────────────────────────────────────
function TournamentsHistory() {
  const { user, loading: authLoading } = useAuth()
  const [tournaments, setTournaments]  = useState([])
  const [loading, setLoading]          = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (user) fetchTournaments()
    else setLoading(false)
  }, [user, authLoading])

  async function fetchTournaments() {
    setLoading(true)
    const { data } = await supabase
      .from('tournaments')
      .select('*, stadiums(name), tournament_teams(count), tournament_matches(count)')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
    setTournaments(data || [])
    setLoading(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 size={24} className="animate-spin text-gray-300"/>
    </div>
  )

  if (tournaments.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-300">
      <Trophy size={28} className="mb-2"/>
      <p className="text-sm font-semibold">Aucun tournoi</p>
    </div>
  )

  const STATUS = {
    draft:    { label: 'Brouillon',    cls: 'bg-gray-100 text-gray-500'    },
    open:     { label: 'Inscriptions', cls: 'bg-blue-100 text-blue-700'    },
    ongoing:  { label: 'En cours',     cls: 'bg-green-100 text-green-700'  },
    finished: { label: 'Terminé',      cls: 'bg-purple-100 text-purple-700'},
  }

  return (
    <div className="space-y-3">
      {tournaments.map((t, i) => {
        const s = STATUS[t.status] || STATUS.draft
        const teamCount  = t.tournament_teams?.[0]?.count  || 0
        const matchCount = t.tournament_matches?.[0]?.count || 0
        return (
          <motion.div key={t.id}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl p-5"
            style={{ border: '1px solid #f0f0f0' }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-gray-900">{t.name}</h3>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{t.stadiums?.name} · {t.start_date} → {t.end_date}</p>
              </div>
              {t.prize_description && (
                <p className="text-xs text-amber-600 font-bold">🏅 {t.prize_description}</p>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Users size={12}/> <span className="font-semibold">{teamCount}</span> équipes
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <CalendarCheck size={12}/> <span className="font-semibold">{matchCount}</span> matchs
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <Trophy size={12}/> {t.team_size}v{t.team_size}
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                {t.entry_fee > 0
                  ? <><span className="font-semibold">{(t.entry_fee * teamCount).toLocaleString()} DH</span> collectés</>
                  : 'Gratuit'
                }
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ─── Statistiques (Chart manuel SVG) ─────────────────────────
function StatsView() {
  const { user, loading: authLoading } = useAuth()
  const [data, setData]                = useState([])
  const [loading, setLoading]          = useState(true)
  const [year, setYear]                = useState(new Date().getFullYear())

  useEffect(() => {
    if (authLoading) return
    if (user) fetchStats()
    else setLoading(false)
  }, [user, authLoading, year])

  async function fetchStats() {
    setLoading(true)
    const { data: stadiums } = await supabase
      .from('stadiums').select('id').eq('owner_id', user.id)
    const ids = stadiums?.map(s => s.id) || []
    if (ids.length === 0) { setData([]); setLoading(false); return }

    const { data: bookings } = await supabase
      .from('bookings')
      .select('booking_date, total_price, status')
      .in('stadium_id', ids)
      .gte('booking_date', `${year}-01-01`)
      .lte('booking_date', `${year}-12-31`)

    // Grouper par mois
    const months = Array.from({ length: 12 }, (_, i) => ({
      month:    i + 1,
      label:    ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'][i],
      bookings: 0,
      revenue:  0,
    }))

    bookings?.forEach(b => {
      const m = parseInt(b.booking_date?.split('-')[1]) - 1
      if (m >= 0 && m < 12) {
        months[m].bookings++
        if (b.status === 'confirmed') months[m].revenue += Number(b.total_price)
      }
    })

    setData(months)
    setLoading(false)
  }

  const maxRevenue  = Math.max(...data.map(d => d.revenue),  1)
  const maxBookings = Math.max(...data.map(d => d.bookings), 1)
  const totalRevenue  = data.reduce((s, d) => s + d.revenue,  0)
  const totalBookings = data.reduce((s, d) => s + d.bookings, 0)

  return (
    <div className="space-y-5">
      {/* Sélecteur année */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {[new Date().getFullYear() - 1, new Date().getFullYear()].map(y => (
            <button key={y} onClick={() => setYear(y)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                year === y ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
              }`}>{y}</button>
          ))}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="font-semibold text-gray-500">{totalBookings} réservations</span>
          <span className="font-black text-gray-900">{totalRevenue.toLocaleString()} DH</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-gray-300"/>
        </div>
      ) : (
        <>
          {/* Chart Revenus */}
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0f0f0' }}>
            <p className="font-black text-gray-900 text-sm mb-5">Revenus mensuels (DH)</p>
            <div className="flex items-end gap-2 h-40">
              {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-xs text-gray-400 font-semibold">
                    {d.revenue > 0 ? `${(d.revenue/1000).toFixed(1)}k` : ''}
                  </p>
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: `${Math.max((d.revenue / maxRevenue) * 120, d.revenue > 0 ? 4 : 0)}px` }}
                    transition={{ delay: i * 0.04, duration: 0.4, ease: 'easeOut' }}
                    className="w-full rounded-t-xl"
                    style={{ background: d.revenue > 0 ? '#111827' : '#f5f5f5', minHeight: 4 }}
                  />
                  <p className="text-xs text-gray-400">{d.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Chart Réservations */}
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0f0f0' }}>
            <p className="font-black text-gray-900 text-sm mb-5">Nombre de réservations</p>
            <div className="flex items-end gap-2 h-32">
              {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-xs text-gray-400 font-semibold">
                    {d.bookings > 0 ? d.bookings : ''}
                  </p>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max((d.bookings / maxBookings) * 96, d.bookings > 0 ? 4 : 0)}px` }}
                    transition={{ delay: i * 0.04, duration: 0.4, ease: 'easeOut' }}
                    className="w-full rounded-t-xl"
                    style={{ background: d.bookings > 0 ? '#16a34a' : '#f5f5f5' }}
                  />
                  <p className="text-xs text-gray-400">{d.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tableau mensuel */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f0' }}>
            <div className="grid grid-cols-4 px-5 py-3 text-xs font-black text-gray-400 uppercase tracking-wide"
              style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
              <span>Mois</span>
              <span className="text-center">Réservations</span>
              <span className="text-center">Revenus</span>
              <span className="text-center">Moy/Réserv.</span>
            </div>
            {data.filter(d => d.bookings > 0).map((d, i) => (
              <div key={i} className="grid grid-cols-4 px-5 py-3 text-sm hover:bg-gray-50 transition-colors"
                style={{ borderBottom: '1px solid #fafafa' }}>
                <span className="font-bold text-gray-900">{d.label} {year}</span>
                <span className="text-center text-gray-600 font-semibold">{d.bookings}</span>
                <span className="text-center font-black text-gray-900">{d.revenue.toLocaleString()} DH</span>
                <span className="text-center text-gray-400 font-semibold">
                  {d.bookings > 0 ? Math.round(d.revenue / d.bookings).toLocaleString() : '—'} DH
                </span>
              </div>
            ))}
            {data.every(d => d.bookings === 0) && (
              <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                <BarChart3 size={24} className="mb-2"/>
                <p className="text-sm font-semibold">Aucune donnée pour {year}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
