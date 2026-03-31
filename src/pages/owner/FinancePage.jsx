// src/pages/owner/FinancePage.jsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CircleDollarSign, TrendingUp, TrendingDown,
  CalendarCheck, Building2, ChevronLeft, ChevronRight,
  Loader2, CheckCircle2, Clock, XCircle
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin',
                   'Juillet','Août','Septembre','Octobre','Novembre','Décembre']

export default function FinancePage() {
  const { user, loading: authLoading }    = useAuth()
  const [loading, setLoading]             = useState(true)
  const [bookings, setBookings]           = useState([])
  const [stadiums, setStadiums]           = useState([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear]   = useState(new Date().getFullYear())

  useEffect(() => {
    if (authLoading) return
    if (user) fetchData()
    else setLoading(false)
  }, [user, authLoading])

  async function fetchData() {
    setLoading(true)
    try {
      const { data: stds } = await supabase
        .from('stadiums').select('id, name').eq('owner_id', user.id)
      const ids = stds?.map(s => s.id) || []
      setStadiums(stds || [])

      if (ids.length === 0) { setBookings([]); return }

      const { data: bks } = await supabase
        .from('bookings')
        .select('*, stadiums(name), profiles:customer_id(full_name, phone), booker_name, booker_phone')
        .in('stadium_id', ids)
        .order('booking_date', { ascending: false })

      setBookings(bks || [])
    } catch (err) {
      console.error('FinancePage fetchData error:', err)
    } finally {
      setLoading(false)
    }
  }

  // ── Données du mois sélectionné ───────────────────────────
  const monthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`

  const monthBookings = bookings.filter(b => b.booking_date?.startsWith(monthStr))
  const confirmed     = monthBookings.filter(b => b.status === 'confirmed')
  const pending       = monthBookings.filter(b => b.status === 'pending')
  const cancelled     = monthBookings.filter(b => b.status === 'cancelled')

  const monthRevenue  = confirmed.reduce((s, b) => s + Number(b.total_price), 0)
  const pendingRevenu = pending.reduce((s, b) => s + Number(b.total_price), 0)

  // Mois précédent pour comparaison
  const prevMonth     = selectedMonth === 0 ? 11 : selectedMonth - 1
  const prevYear      = selectedMonth === 0 ? selectedYear - 1 : selectedYear
  const prevMonthStr  = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`
  const prevRevenue   = bookings
    .filter(b => b.booking_date?.startsWith(prevMonthStr) && b.status === 'confirmed')
    .reduce((s, b) => s + Number(b.total_price), 0)

  const diff     = monthRevenue - prevRevenue
  const diffPct  = prevRevenue > 0 ? Math.round((diff / prevRevenue) * 100) : null

  // Revenue par terrain ce mois
  const byStadium = stadiums.map(s => {
    const stBks = confirmed.filter(b => b.stadium_id === s.id)
    return {
      name:     s.name,
      revenue:  stBks.reduce((sum, b) => sum + Number(b.total_price), 0),
      count:    stBks.length,
    }
  }).sort((a, b) => b.revenue - a.revenue)

  const maxRevStadium = Math.max(...byStadium.map(s => s.revenue), 1)

  // Données annuelles pour mini-chart
  const yearData = Array.from({ length: 12 }, (_, i) => {
    const ms  = `${selectedYear}-${String(i + 1).padStart(2, '0')}`
    const rev = bookings
      .filter(b => b.booking_date?.startsWith(ms) && b.status === 'confirmed')
      .reduce((s, b) => s + Number(b.total_price), 0)
    return { label: ['J','F','M','A','M','J','J','A','S','O','N','D'][i], revenue: rev, month: i }
  })
  const maxYear = Math.max(...yearData.map(d => d.revenue), 1)

  function prevMonthNav() {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1) }
    else setSelectedMonth(m => m - 1)
  }
  function nextMonthNav() {
    const now = new Date()
    if (selectedYear === now.getFullYear() && selectedMonth === now.getMonth()) return
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1) }
    else setSelectedMonth(m => m + 1)
  }
  const isCurrentMonth = selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear()

  return (
    <div className="space-y-5">

      {/* ── Sélecteur de mois ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={prevMonthNav}
            className="p-2 rounded-xl border border-gray-200 hover:border-gray-900 text-gray-500 hover:text-gray-900 transition-all">
            <ChevronLeft size={16}/>
          </button>
          <div className="text-center min-w-40">
            <p className="font-black text-gray-900 text-lg">{MONTHS_FR[selectedMonth]}</p>
            <p className="text-xs text-gray-400 font-semibold">{selectedYear}</p>
          </div>
          <button onClick={nextMonthNav} disabled={isCurrentMonth}
            className="p-2 rounded-xl border border-gray-200 hover:border-gray-900 text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-all">
            <ChevronRight size={16}/>
          </button>
        </div>
        {!isCurrentMonth && (
          <button onClick={() => { setSelectedMonth(new Date().getMonth()); setSelectedYear(new Date().getFullYear()) }}
            className="text-xs font-bold text-green-600 hover:text-green-700 border border-green-200 hover:bg-green-50 px-3 py-2 rounded-xl transition-all">
            Mois actuel
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={24} className="animate-spin text-gray-300"/>
        </div>
      ) : (
        <>
          {/* ── 4 KPIs ── */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              {
                label:   'Revenus confirmés',
                value:   `${monthRevenue.toLocaleString()} DH`,
                sub:     diffPct !== null
                  ? `${diff >= 0 ? '+' : ''}${diffPct}% vs mois précédent`
                  : 'Premier mois de données',
                icon:    CircleDollarSign,
                accent:  '#16a34a',
                bg:      '#f0fdf4',
                color:   '#16a34a',
                subColor: diff >= 0 ? '#16a34a' : '#dc2626',
              },
              {
                label:   'Réservations confirmées',
                value:   confirmed.length,
                sub:     `${monthBookings.length} au total ce mois`,
                icon:    CheckCircle2,
                accent:  '#2563eb',
                bg:      '#eff6ff',
                color:   '#2563eb',
                subColor: '#6b7280',
              },
              {
                label:   'En attente de paiement',
                value:   `${pendingRevenu.toLocaleString()} DH`,
                sub:     `${pending.length} réservation(s) pending`,
                icon:    Clock,
                accent:  '#d97706',
                bg:      '#fffbeb',
                color:   '#d97706',
                subColor: '#6b7280',
              },
              {
                label:   'Annulations',
                value:   cancelled.length,
                sub:     `Perdu: ${cancelled.reduce((s,b)=>s+Number(b.total_price),0).toLocaleString()} DH`,
                icon:    XCircle,
                accent:  '#dc2626',
                bg:      '#fef2f2',
                color:   '#dc2626',
                subColor: '#dc2626',
              },
            ].map(({ label, value, sub, icon: Icon, accent, bg, color, subColor }, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white rounded-2xl p-5 relative overflow-hidden"
                style={{ border: '1px solid #f0f0f0' }}>
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: accent }}/>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                    <Icon size={16} style={{ color }}/>
                  </div>
                </div>
                <p className="text-2xl font-black text-gray-900">{value}</p>
                <p className="text-xs font-semibold text-gray-400 mt-0.5 uppercase tracking-wide">{label}</p>
                <p className="text-xs font-semibold mt-1.5" style={{ color: subColor }}>{sub}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* ── Mini chart annuel ── */}
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0f0f0' }}>
              <p className="font-black text-gray-900 text-sm mb-1">Vue annuelle {selectedYear}</p>
              <p className="text-xs text-gray-400 mb-5">
                {yearData.reduce((s,d)=>s+d.revenue,0).toLocaleString()} DH confirmés
              </p>
              <div className="flex items-end gap-1" style={{ height: 80 }}>
                {yearData.map((d, i) => {
                  const h         = d.revenue > 0 ? Math.max(Math.round((d.revenue / maxYear) * 72), 6) : 3
                  const isSel     = i === selectedMonth
                  const isCurrent = i === new Date().getMonth() && selectedYear === new Date().getFullYear()
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 cursor-pointer group"
                      onClick={() => setSelectedMonth(i)}>
                      <div className="w-full rounded-t-lg transition-all duration-200"
                        style={{
                          height:     h,
                          background: isSel ? '#111827' : isCurrent ? '#d1fae5' : d.revenue > 0 ? '#d1d5db' : '#f3f4f6',
                        }}
                        title={`${d.revenue.toLocaleString()} DH`}
                      />
                      <p className="text-xs font-semibold"
                        style={{ color: isSel ? '#111827' : '#9ca3af', fontSize: 10 }}>
                        {d.label}
                      </p>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">
                Cliquez sur un mois pour voir ses détails
              </p>
            </div>

            {/* ── Revenue par terrain ── */}
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0f0f0' }}>
              <p className="font-black text-gray-900 text-sm mb-1">Revenus par terrain</p>
              <p className="text-xs text-gray-400 mb-5">{MONTHS_FR[selectedMonth]} {selectedYear}</p>

              {byStadium.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                  <Building2 size={24} className="mb-2"/>
                  <p className="text-xs font-semibold">Aucune donnée</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {byStadium.map((s, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold text-gray-900 truncate">{s.name}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-gray-400 font-medium">{s.count} rés.</span>
                          <span className="text-sm font-black text-gray-900">
                            {s.revenue.toLocaleString()} DH
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round((s.revenue / maxRevStadium) * 100)}%` }}
                          transition={{ delay: i * 0.1, duration: 0.5, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ background: i === 0 ? '#111827' : `rgba(17,24,39,${0.4 - i * 0.1})` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Liste réservations confirmées du mois ── */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f0' }}>
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid #f5f5f5' }}>
              <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                <CalendarCheck size={15} className="text-green-600"/>
                Réservations confirmées — {MONTHS_FR[selectedMonth]}
              </h3>
              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                {confirmed.length} rés. · {monthRevenue.toLocaleString()} DH
              </span>
            </div>

            {confirmed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                <CalendarCheck size={24} className="mb-2"/>
                <p className="text-sm font-semibold">Aucune réservation confirmée ce mois</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {confirmed.map((b, i) => (
                  <motion.div key={b.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={13} className="text-green-600"/>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-gray-900 truncate">
                            {b.booker_name || b.profiles?.full_name || '—'}
                          </span>
                          {(b.booker_phone || b.profiles?.phone) && (
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                              📞 {b.booker_phone || b.profiles?.phone}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {b.stadiums?.name} · {b.booking_date} · {b.start_time?.slice(0,5)}–{b.end_time?.slice(0,5)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-black text-gray-900">{Number(b.total_price).toLocaleString()} DH</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
