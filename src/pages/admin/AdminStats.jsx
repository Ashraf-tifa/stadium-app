// src/pages/admin/AdminStats.jsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CircleDollarSign, Users, Building2, CalendarCheck,
  TrendingUp, TrendingDown, Trophy, CreditCard,
  ChevronRight, Loader2
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

export default function AdminStats() {
  const [loading, setLoading]   = useState(true)
  const [stats, setStats]       = useState(null)
  const [revenueData, setRevenueData] = useState([])
  const [topOwners, setTopOwners]     = useState([])
  const [subsByPlan, setSubsByPlan]   = useState([])

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      await Promise.all([
        fetchGlobalStats(),
        fetchRevenueChart(),
        fetchTopOwners(),
        fetchSubsByPlan(),
      ])
    } finally {
      setLoading(false)
    }
  }

  async function fetchGlobalStats() {
    const [
      { data: profiles },
      { data: subs },
      { data: stadiums },
      { data: bookings },
    ] = await Promise.all([
      supabase.from('profiles').select('id, role, is_active, created_at'),
      supabase.from('subscriptions').select('id, status, amount, plan, created_at'),
      supabase.from('stadiums').select('id, is_active'),
      supabase.from('bookings').select('id, status, total_price, created_at'),
    ])

    const owners         = profiles?.filter(p => p.role === 'owner') || []
    const activeSubs     = subs?.filter(s => s.status === 'active')  || []
    const pendingSubs    = subs?.filter(s => s.status === 'pending') || []
    const totalRevenue   = activeSubs.reduce((s, sub) => s + Number(sub.amount), 0)
    const confirmedBks   = bookings?.filter(b => b.status === 'confirmed') || []

    // Ce mois
    const now        = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const newOwners  = owners.filter(o => new Date(o.created_at) >= monthStart).length
    const newSubs    = activeSubs.filter(s => new Date(s.created_at) >= monthStart).length

    setStats({
      totalOwners:    owners.length,
      activeOwners:   owners.filter(o => o.is_active).length,
      totalRevenue,
      pendingSubs:    pendingSubs.length,
      activeSubs:     activeSubs.length,
      totalStadiums:  stadiums?.length || 0,
      activeStadiums: stadiums?.filter(s => s.is_active).length || 0,
      totalBookings:  confirmedBks.length,
      newOwners,
      newSubs,
    })
  }

  async function fetchRevenueChart() {
    const year = new Date().getFullYear()
    const { data } = await supabase
      .from('subscriptions')
      .select('amount, created_at, status')
      .eq('status', 'active')
      .gte('created_at', `${year}-01-01`)
      .lte('created_at', `${year}-12-31`)

    const months = Array.from({ length: 12 }, (_, i) => ({
      label: MONTHS_FR[i], revenue: 0, count: 0
    }))

    data?.forEach(s => {
      const m = new Date(s.created_at).getMonth()
      months[m].revenue += Number(s.amount)
      months[m].count++
    })

    setRevenueData(months)
  }

  async function fetchTopOwners() {
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('owner_id, amount, status, profiles(full_name, phone)')
      .eq('status', 'active')
      .order('amount', { ascending: false })
      .limit(5)

    setTopOwners(subs || [])
  }

  async function fetchSubsByPlan() {
    const { data } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('status', 'active')

    const plans = { monthly: 0, quarterly: 0, biannual: 0, annual: 0 }
    data?.forEach(s => { if (plans[s.plan] !== undefined) plans[s.plan]++ })

    const total = Object.values(plans).reduce((a, b) => a + b, 0)
    setSubsByPlan(
      Object.entries(plans).map(([plan, count]) => ({
        plan,
        label: { monthly:'1 Mois', quarterly:'3 Mois', biannual:'6 Mois', annual:'12 Mois' }[plan],
        count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
        color: { monthly:'#6b7280', quarterly:'#2563eb', biannual:'#7c3aed', annual:'#d97706' }[plan],
      }))
    )
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={24} className="animate-spin text-gray-300"/>
    </div>
  )

  const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1)
  const currentMonth = new Date().getMonth()
  const totalYearRevenue = revenueData.reduce((s, d) => s + d.revenue, 0)

  const CARDS = [
    {
      label:  'Revenus totaux',
      value:  `${stats.totalRevenue.toLocaleString()} DH`,
      sub:    `${stats.newSubs} nouveau(x) ce mois`,
      icon:   CircleDollarSign,
      accent: '#7c3aed', bg: '#f5f3ff', color: '#7c3aed',
      trend:  'up',
    },
    {
      label:  'Propriétaires actifs',
      value:  stats.activeOwners,
      sub:    `${stats.newOwners} nouveau(x) ce mois · ${stats.totalOwners} total`,
      icon:   Users,
      accent: '#16a34a', bg: '#f0fdf4', color: '#16a34a',
      trend:  'up',
    },
    {
      label:  'Abonnements actifs',
      value:  stats.activeSubs,
      sub:    `${stats.pendingSubs} en attente de validation`,
      icon:   CreditCard,
      accent: '#2563eb', bg: '#eff6ff', color: '#2563eb',
      trend:  stats.pendingSubs > 0 ? 'warn' : 'up',
    },
    {
      label:  'Terrains enregistrés',
      value:  stats.totalStadiums,
      sub:    `${stats.activeStadiums} actifs · ${stats.totalBookings} réservations`,
      icon:   Building2,
      accent: '#d97706', bg: '#fffbeb', color: '#d97706',
      trend:  'up',
    },
  ]

  return (
    <div className="space-y-6">

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {CARDS.map(({ label, value, sub, icon: Icon, accent, bg, color, trend }, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl p-5 relative overflow-hidden"
            style={{ border: '1px solid #f0f0f0' }}>
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: accent }}/>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon size={18} style={{ color }}/>
              </div>
              {trend === 'up'   && <TrendingUp   size={14} className="text-green-500 mt-1"/>}
              {trend === 'warn' && <TrendingDown size={14} className="text-amber-500 mt-1"/>}
            </div>
            <p className="text-3xl font-black text-gray-900">{value}</p>
            <p className="text-xs font-semibold text-gray-400 mt-1.5 uppercase tracking-wide">{label}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Chart revenus annuels */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6" style={{ border: '1px solid #f0f0f0' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-black text-gray-900 text-sm">
                Revenus abonnements {new Date().getFullYear()}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {totalYearRevenue.toLocaleString()} DH cette année
              </p>
            </div>
          </div>
          <div style={{ height: 140 }}>
            <div className="flex items-end gap-1.5 h-full">
              {revenueData.map((d, i) => {
                const barPx     = d.revenue > 0 ? Math.max(Math.round((d.revenue / maxRevenue) * 110), 8) : 3
                const isCurrent = i === currentMonth
                return (
                  <div key={i} className="flex-1 flex flex-col items-center group"
                    style={{ height: '100%', justifyContent: 'flex-end', gap: 6 }}>
                    <div className="relative w-full">
                      <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity
                        absolute left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-bold
                        px-2 py-1 rounded-lg whitespace-nowrap z-10"
                        style={{ bottom: barPx + 8 }}>
                        {d.revenue > 0 ? `${d.revenue.toLocaleString()} DH` : '–'}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"/>
                      </div>
                    </div>
                    <div className="w-full rounded-t-lg transition-colors duration-150 cursor-pointer"
                      style={{
                        height:     barPx,
                        background: isCurrent ? '#7c3aed' : d.revenue > 0 ? '#ddd6fe' : '#f3f4f6',
                      }}/>
                    <p className="text-xs font-semibold" style={{ color: isCurrent ? '#7c3aed' : '#9ca3af', fontSize: 10 }}>
                      {d.label}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-5 mt-4 pt-4" style={{ borderTop: '1px solid #f5f5f5' }}>
            {[
              { color: '#7c3aed', label: 'Mois actuel' },
              { color: '#ddd6fe', label: 'Revenus'     },
              { color: '#f3f4f6', label: 'Aucun'       },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: color, border: '1px solid #e5e7eb' }}/>
                <span className="text-xs text-gray-400 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Répartition par plan */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #f0f0f0' }}>
          <h2 className="font-black text-gray-900 text-sm mb-1">Répartition des plans</h2>
          <p className="text-xs text-gray-400 mb-6">{stats.activeSubs} abonnés actifs</p>
          <div className="space-y-4">
            {subsByPlan.map(({ label, count, pct, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-bold text-gray-900">{label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">{count} abonné(s)</span>
                    <span className="text-xs font-black" style={{ color }}>{pct}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: color }}/>
                </div>
              </div>
            ))}
          </div>

          {/* Total revenus estimés */}
          <div className="mt-6 pt-4" style={{ borderTop: '1px solid #f5f5f5' }}>
            <p className="text-xs text-gray-400 font-medium">Revenu total abonnements</p>
            <p className="text-2xl font-black text-gray-900 mt-1">
              {stats.totalRevenue.toLocaleString()} DH
            </p>
          </div>
        </div>
      </div>

      {/* Top propriétaires + Métriques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Top propriétaires */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f0' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #f5f5f5' }}>
            <h2 className="font-black text-gray-900 text-sm">Top propriétaires</h2>
            <p className="text-xs text-gray-400 mt-0.5">Par montant d'abonnement</p>
          </div>
          {topOwners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-300">
              <Users size={24} className="mb-2"/>
              <p className="text-sm font-semibold">Aucun abonné actif</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {topOwners.map((s, i) => (
                <div key={s.owner_id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                      i === 0 ? 'bg-amber-400 text-white' :
                      i === 1 ? 'bg-gray-300 text-white' :
                      i === 2 ? 'bg-amber-700 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {s.profiles?.full_name || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {{ monthly:'1 Mois', quarterly:'3 Mois', biannual:'6 Mois', annual:'12 Mois' }[s.plan]}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-gray-900">
                    {Number(s.amount).toLocaleString()} DH
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Métriques rapides */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #f0f0f0' }}>
          <h2 className="font-black text-gray-900 text-sm mb-6">Métriques rapides</h2>
          <div className="space-y-4">
            {[
              {
                label: 'Taux d\'activation',
                value: stats.totalOwners > 0
                  ? `${Math.round((stats.activeOwners / stats.totalOwners) * 100)}%`
                  : '0%',
                color: '#16a34a',
                pct:   stats.totalOwners > 0
                  ? Math.round((stats.activeOwners / stats.totalOwners) * 100)
                  : 0,
              },
              {
                label: 'Terrains actifs / total',
                value: `${stats.activeStadiums} / ${stats.totalStadiums}`,
                color: '#2563eb',
                pct:   stats.totalStadiums > 0
                  ? Math.round((stats.activeStadiums / stats.totalStadiums) * 100)
                  : 0,
              },
              {
                label: 'Abonnés actifs / total',
                value: `${stats.activeSubs} / ${stats.activeSubs + stats.pendingSubs}`,
                color: '#7c3aed',
                pct:   (stats.activeSubs + stats.pendingSubs) > 0
                  ? Math.round((stats.activeSubs / (stats.activeSubs + stats.pendingSubs)) * 100)
                  : 0,
              },
              {
                label: 'Revenu moyen / abonné',
                value: stats.activeSubs > 0
                  ? `${Math.round(stats.totalRevenue / stats.activeSubs).toLocaleString()} DH`
                  : '0 DH',
                color: '#d97706',
                pct:   null,
              },
            ].map(({ label, value, color, pct }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-gray-500">{label}</p>
                  <p className="text-sm font-black" style={{ color }}>{value}</p>
                </div>
                {pct !== null && (
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: color }}/>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Abonnements en attente */}
          {stats.pendingSubs > 0 && (
            <div className="mt-5 pt-4" style={{ borderTop: '1px solid #f5f5f5' }}>
              <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div>
                  <p className="text-xs font-black text-amber-800">
                    {stats.pendingSubs} abonnement(s) en attente
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">À valider dans l'onglet Abonnements</p>
                </div>
                <ChevronRight size={14} className="text-amber-500"/>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
