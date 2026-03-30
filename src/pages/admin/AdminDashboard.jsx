// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, CreditCard, CheckCircle2,
  XCircle, Clock, Eye, LogOut, Menu, X, Zap,
  ChevronRight, AlertCircle, Loader2, Building2,
  TrendingUp, CircleDollarSign, Shield, RefreshCw,
  BarChart2, Settings, Save, Landmark, Phone, User,
  Plus, Trash2, CalendarCheck, Activity, MapPin,
  ToggleLeft, ToggleRight, Search
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import AdminStats from './AdminStats'

const NAV = [
  { key: 'overview',      label: "Vue d'ensemble", icon: LayoutDashboard },
  { key: 'stats',         label: 'Statistiques',   icon: BarChart2       },
  { key: 'subscriptions', label: 'Abonnements',    icon: CreditCard      },
  { key: 'users',         label: 'Utilisateurs',   icon: Users           },
  { key: 'stades',        label: 'Stades',         icon: Building2       },
  { key: 'bookings',      label: 'Réservations',   icon: CalendarCheck   },
  { key: 'settings',      label: 'Paramètres',     icon: Settings        },
  { key: 'activity',      label: 'Activité',       icon: Activity        },
]

const PLANS_LABEL = {
  monthly:   '1 Mois — 500 DH',
  quarterly: '3 Mois — 1,300 DH',
  biannual:  '6 Mois — 2,400 DH',
  annual:    '12 Mois — 4,200 DH',
}
const PLANS_MONTHS = { monthly: 1, quarterly: 3, biannual: 6, annual: 12 }
const PLANS_AMOUNT = { monthly: 500, quarterly: 1300, biannual: 2400, annual: 4200 }

export default function AdminDashboard() {
  const [tab, setTab]           = useState('overview')
  const [sideOpen, setSideOpen] = useState(false)
  const [toast, setToast]       = useState(null)
  const toastTimer              = useRef(null)
  const [pendingCount, setPendingCount] = useState(0)
  const { profile, signOut }    = useAuth()
  const navigate                = useNavigate()

  // Fetch pending count on mount and every 30 seconds
  useEffect(() => {
    fetchPendingCount()
    const interval = setInterval(fetchPendingCount, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchPendingCount() {
    const { count } = await supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
    setPendingCount(count || 0)
  }

  function showToast(message) {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex" style={{ fontFamily: "'Outfit', sans-serif" }}>

      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 fixed h-full bg-white z-30"
        style={{ borderRight: '1px solid #f0f0f0' }}>
        <AdminSidebar tab={tab} setTab={setTab} profile={profile} onSignOut={handleSignOut} pendingCount={pendingCount}/>
      </aside>

      {/* Sidebar Mobile */}
      <AnimatePresence>
        {sideOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden bg-black/30"
              onClick={() => setSideOpen(false)}/>
            <motion.aside initial={{ x: -264 }} animate={{ x: 0 }} exit={{ x: -264 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed left-0 top-0 h-full w-64 bg-white z-50 flex flex-col lg:hidden"
              style={{ borderRight: '1px solid #f0f0f0' }}>
              <button onClick={() => setSideOpen(false)}
                className="absolute top-4 right-4 text-gray-400"><X size={18}/></button>
              <AdminSidebar tab={tab} setTab={(t) => { setTab(t); setSideOpen(false) }}
                profile={profile} onSignOut={handleSignOut} pendingCount={pendingCount}/>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 lg:ml-64 flex flex-col">
        <header className="sticky top-0 z-20 bg-white flex items-center justify-between px-8 py-4"
          style={{ borderBottom: '1px solid #f0f0f0' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSideOpen(true)} className="lg:hidden text-gray-400">
              <Menu size={20}/>
            </button>
            <div>
              <h1 className="font-black text-gray-900 text-lg">
                {NAV.find(n => n.key === tab)?.label}
              </h1>
              <p className="text-xs text-gray-400 font-medium">Admin — StadiumPro</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-purple-100 text-purple-700">
              Admin
            </span>
          </div>
        </header>

        <div className="flex-1 p-8">
          <div style={{ display: tab === 'overview'      ? 'block' : 'none' }}><AdminOverview setTab={setTab}/></div>
          <div style={{ display: tab === 'stats'         ? 'block' : 'none' }}><AdminStats/></div>
          <div style={{ display: tab === 'subscriptions' ? 'block' : 'none' }}><SubscriptionsTab showToast={showToast}/></div>
          <div style={{ display: tab === 'users'         ? 'block' : 'none' }}><UsersTab/></div>
          <div style={{ display: tab === 'stades'        ? 'block' : 'none' }}><StadesTab/></div>
          <div style={{ display: tab === 'bookings'      ? 'block' : 'none' }}><BookingsTab/></div>
          <div style={{ display: tab === 'settings'      ? 'block' : 'none' }}><AdminSettingsTab/></div>
          <div style={{ display: tab === 'activity'      ? 'block' : 'none' }}><ActivityTab/></div>
        </div>
      </main>

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-[100] bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold max-w-xs"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────
function AdminSidebar({ tab, setTab, profile, onSignOut, pendingCount }) {
  return (
    <>
      <div className="px-6 py-5" style={{ borderBottom: '1px solid #f5f5f5' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-purple-600">
            <Shield size={15} className="text-white"/>
          </div>
          <div>
            <p className="font-black text-gray-900 text-sm">StadiumPro</p>
            <p className="text-xs text-purple-600 font-bold">Panneau Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-xs font-black text-gray-300 uppercase tracking-widest px-3 mb-3">Navigation</p>
        {NAV.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === key ? 'bg-purple-600 text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}>
            <span className="relative">
              <Icon size={16}/>
              {key === 'subscriptions' && pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </span>
            <span>{label}</span>
            {tab === key && <ChevronRight size={13} className="ml-auto opacity-40"/>}
          </button>
        ))}
      </nav>

      <div className="px-3 pb-4" style={{ borderTop: '1px solid #f5f5f5', paddingTop: 12 }}>
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-black">
            {profile?.full_name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{profile?.full_name || 'Admin'}</p>
            <p className="text-xs text-purple-600 font-semibold">Administrateur</p>
          </div>
        </div>
        <button onClick={onSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all font-medium">
          <LogOut size={14}/> Se déconnecter
        </button>
      </div>
    </>
  )
}

// ─── Vue d'ensemble ───────────────────────────────────────────
function AdminOverview({ setTab }) {
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [monthlyRevenue, setMonthlyRevenue] = useState([])
  const [topStades, setTopStades] = useState([])

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    setLoading(true)
    const [subsRes, usersRes, bookingsRes] = await Promise.all([
      supabase.from('subscriptions').select('status, amount, plan, created_at'),
      supabase.from('profiles').select('role, created_at'),
      supabase.from('bookings').select('stadium_id, stadiums(name)').eq('status', 'confirmed'),
    ])

    const subs  = subsRes.data  || []
    const users = usersRes.data || []
    const bookings = bookingsRes.data || []

    const totalRevenue = subs
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + Number(s.amount), 0)

    setStats({
      pending:      subs.filter(s => s.status === 'pending').length,
      active:       subs.filter(s => s.status === 'active').length,
      totalRevenue,
      totalOwners:  users.filter(u => u.role === 'owner').length,
      totalClients: users.filter(u => u.role === 'customer').length,
    })

    // Monthly revenue — last 6 months from active subscriptions
    const now = new Date()
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }) })
    }
    const revenue = months.map(({ year, month, label }) => {
      const total = subs
        .filter(s => s.status === 'active' && s.created_at)
        .filter(s => {
          const d = new Date(s.created_at)
          return d.getFullYear() === year && d.getMonth() === month
        })
        .reduce((sum, s) => sum + Number(s.amount), 0)
      return { label, total }
    })
    setMonthlyRevenue(revenue)

    // Top stades
    const counts = {}
    const names  = {}
    bookings.forEach(b => {
      if (!b.stadium_id) return
      counts[b.stadium_id] = (counts[b.stadium_id] || 0) + 1
      names[b.stadium_id]  = b.stadiums?.name || b.stadium_id
    })
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, count]) => ({ name: names[id], count }))
    setTopStades(sorted)

    setLoading(false)
  }

  const CARDS = [
    { label: 'En attente',      value: stats?.pending,      icon: Clock,           color: '#d97706', bg: '#fffbeb', accent: '#d97706', tab: 'subscriptions' },
    { label: 'Abonnés actifs',  value: stats?.active,       icon: CheckCircle2,    color: '#16a34a', bg: '#f0fdf4', accent: '#16a34a', tab: 'subscriptions' },
    { label: 'Revenus totaux',  value: stats?.totalRevenue != null ? `${stats.totalRevenue.toLocaleString()} DH` : '—',
                                                              icon: CircleDollarSign,color: '#7c3aed', bg: '#f5f3ff', accent: '#7c3aed', tab: null            },
    { label: 'Propriétaires',   value: stats?.totalOwners,  icon: Building2,       color: '#2563eb', bg: '#eff6ff', accent: '#2563eb', tab: 'users'         },
  ]

  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.total), 1)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {CARDS.map(({ label, value, icon: Icon, color, bg, accent, tab: t }, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => t && setTab(t)}
            className={`bg-white rounded-2xl p-5 relative overflow-hidden ${t ? 'cursor-pointer hover:shadow-md' : ''} transition-shadow`}
            style={{ border: '1px solid #f0f0f0' }}>
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: accent }}/>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon size={18} style={{ color }}/>
              </div>
              {t && <ChevronRight size={14} className="text-gray-300 mt-1"/>}
            </div>
            {loading
              ? <div className="h-8 w-20 rounded-lg animate-pulse bg-gray-100"/>
              : <p className="text-3xl font-black text-gray-900">{value ?? '—'}</p>
            }
            <p className="text-xs text-gray-400 font-semibold mt-1.5 uppercase tracking-wide">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenus mensuels */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0f0f0' }}>
        <h2 className="font-black text-gray-900 text-sm flex items-center gap-2 mb-5">
          <TrendingUp size={15} className="text-purple-600"/> Revenus mensuels (6 derniers mois)
        </h2>
        {loading ? (
          <div className="h-32 bg-gray-50 rounded-xl animate-pulse"/>
        ) : (
          <div className="flex items-end gap-3 h-32">
            {monthlyRevenue.map(({ label, total }, i) => {
              const pct = maxRevenue > 0 ? (total / maxRevenue) * 100 : 0
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-gray-500 truncate">
                    {total > 0 ? `${(total/1000).toFixed(1)}k` : ''}
                  </span>
                  <div className="w-full flex items-end" style={{ height: 80 }}>
                    <div
                      className="w-full rounded-t-lg transition-all"
                      style={{
                        height: `${Math.max(pct, total > 0 ? 8 : 2)}%`,
                        background: total > 0 ? '#7c3aed' : '#f3f4f6',
                        minHeight: 3,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">{label}</span>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demandes récentes */}
        <RecentSubscriptions onViewAll={() => setTab('subscriptions')}/>

        {/* Top Stades */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f0' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f5f5f5' }}>
            <h2 className="font-black text-gray-900 text-sm flex items-center gap-2">
              <BarChart2 size={15} className="text-green-600"/> Top Stades
            </h2>
            <button onClick={() => setTab('stades')}
              className="text-xs font-bold text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors">
              Voir tout <ChevronRight size={12}/>
            </button>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse"/>)}
            </div>
          ) : topStades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-300">
              <Building2 size={24} className="mb-2"/>
              <p className="text-xs font-semibold">Aucune réservation confirmée</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {topStades.map(({ name, count }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-green-600">#{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{name || 'N/A'}</p>
                  </div>
                  <span className="text-xs font-black text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {count} rés.
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

// ─── Demandes récentes ────────────────────────────────────────
function RecentSubscriptions({ onViewAll }) {
  const [subs, setSubs]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchRecent() }, [])

  async function fetchRecent() {
    setLoading(true)
    const { data } = await supabase
      .from('subscriptions')
      .select('id, owner_id, plan, status, amount, proof_url, created_at, rejected_reason, starts_at, expires_at, profiles(full_name, phone)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5)
    setSubs(data || [])
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f0' }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f5f5f5' }}>
        <h2 className="font-black text-gray-900 text-sm flex items-center gap-2">
          <Clock size={15} className="text-amber-500"/> Demandes en attente
        </h2>
        <button onClick={onViewAll}
          className="text-xs font-bold text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors">
          Voir tout <ChevronRight size={12}/>
        </button>
      </div>
      {loading ? (
        <div className="divide-y divide-gray-50">
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center gap-3 px-5 py-4">
              <div className="w-8 h-8 rounded-xl animate-pulse bg-gray-100"/>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-32 animate-pulse"/>
                <div className="h-2.5 bg-gray-100 rounded w-48 animate-pulse"/>
              </div>
            </div>
          ))}
        </div>
      ) : subs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-300">
          <CheckCircle2 size={28} className="mb-2"/>
          <p className="text-sm font-semibold">Aucune demande en attente</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {subs.map(s => (
            <div key={s.id} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Clock size={14} className="text-amber-500"/>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{s.profiles?.full_name || 'N/A'}</p>
                  <p className="text-xs text-gray-400">{PLANS_LABEL[s.plan]} · {new Date(s.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">En attente</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Onglet Abonnements ───────────────────────────────────────
function SubscriptionsTab({ showToast }) {
  const [subs, setSubs]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('pending')
  const [selected, setSelected] = useState(null)
  const [processing, setProcessing] = useState(null)

  useEffect(() => { fetchSubs() }, [])

  async function fetchSubs() {
    setLoading(true)

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, profiles(full_name, phone)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('fetchSubs Supabase error', JSON.stringify(error, null, 2))
      setSubs([])
      setLoading(false)
      return
    }

    setSubs(data || [])
    setLoading(false)
  }

  async function handleApprove(sub) {
    setProcessing(sub.id)
    try {
      const now      = new Date()
      const months   = PLANS_MONTHS[sub.plan] || 1
      const expiresAt = new Date(now)
      expiresAt.setMonth(expiresAt.getMonth() + months)

      await supabase.from('subscriptions').update({
        status:     'active',
        starts_at:  now.toISOString(),
        expires_at: expiresAt.toISOString(),
      }).eq('id', sub.id)

      const ownerId = sub.owner_id || sub.customer_id || sub.profile_id || sub.user_id || sub.profiles?.id
      if (!ownerId) {
        throw new Error("Impossible de déterminer l'ID du profil pour activation")
      }

      const { error: profileError } = await supabase.from('profiles').update({
        is_active:          true,
        subscription_plan:  sub.plan,
        subscription_until: expiresAt.toISOString(),
      }).eq('id', ownerId)

      if (profileError) {
        throw profileError
      }

      await fetchSubs()
      setSelected(null)
      showToast?.('✅ Propriétaire notifié')
    } catch(e) {
      console.error('handleApprove error', JSON.stringify(e, null, 2))
      alert('La validation a échoué. Voir console pour détails.')
    }
    finally { setProcessing(null) }
  }

  async function handleReject(sub, reason) {
    setProcessing(sub.id)
    try {
      await supabase.from('subscriptions').update({
        status:          'rejected',
        rejected_reason: reason || "Rejeté par l'administrateur",
      }).eq('id', sub.id)

      await fetchSubs()
      setSelected(null)
      showToast?.('❌ Propriétaire notifié du rejet')
    } catch(e) { console.error(e) }
    finally { setProcessing(null) }
  }

  const statuses = ['pending', 'active', 'rejected']
  const labels   = { pending: 'En attente', active: 'Actifs', rejected: 'Rejetés' }
  const filtered = filter === 'all' ? subs : subs.filter(s => s.status === filter)

  return (
    <div className="space-y-4">

      {/* Modal détail */}
      <AnimatePresence>
        {selected && (
          <SubscriptionDetailModal
            sub={selected}
            processing={processing === selected.id}
            onApprove={() => handleApprove(selected)}
            onReject={(reason) => handleReject(selected, reason)}
            onClose={() => setSelected(null)}
            showToast={showToast}
          />
        )}
      </AnimatePresence>

      {/* Filtres */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {statuses.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                filter === s ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
              }`}>
              {labels[s]}
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${filter === s ? 'bg-white/20' : 'bg-gray-100 text-gray-400'}`}>
                {subs.filter(sub => sub.status === s).length}
              </span>
            </button>
          ))}
        </div>
        <button onClick={fetchSubs} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all">
          <RefreshCw size={16}/>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f0' }}>
        <div className="grid grid-cols-12 gap-2 px-5 py-3 text-xs font-black text-gray-400 uppercase tracking-wide"
          style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <div className="col-span-3">Propriétaire</div>
          <div className="col-span-3">Plan</div>
          <div className="col-span-2">Montant</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-1 text-center">Statut</div>
          <div className="col-span-1 text-center">Action</div>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-50">
            {[1,2,3,4].map(i => (
              <div key={i} className="grid grid-cols-12 gap-2 px-5 py-4">
                {[3,3,2,2,1,1].map((cols, j) => (
                  <div key={j} className={`col-span-${cols} h-3 bg-gray-100 rounded animate-pulse`}/>
                ))}
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300">
            <CreditCard size={28} className="mb-2"/>
            <p className="text-sm font-semibold">Aucun abonnement {labels[filter]?.toLowerCase()}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((s, i) => (
              <motion.div key={s.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-12 gap-2 px-5 py-4 items-center hover:bg-gray-50 transition-colors">

                <div className="col-span-3">
                  <p className="text-sm font-bold text-gray-900 truncate">{s.profiles?.full_name || 'N/A'}</p>
                  <p className="text-xs text-gray-400 truncate">{s.profiles?.phone || '—'}</p>
                </div>

                <div className="col-span-3">
                  <p className="text-sm font-semibold text-gray-700">{PLANS_LABEL[s.plan]}</p>
                </div>

                <div className="col-span-2">
                  <p className="text-sm font-black text-gray-900">{Number(s.amount).toLocaleString()} DH</p>
                </div>

                <div className="col-span-2">
                  <p className="text-xs text-gray-500">{new Date(s.created_at).toLocaleDateString('fr-FR')}</p>
                </div>

                <div className="col-span-1 text-center">
                  <SubBadge status={s.status}/>
                </div>

                <div className="col-span-1 text-center">
                  <button onClick={() => setSelected(s)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
                    <Eye size={15}/>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Modal détail abonnement ──────────────────────────────────
function SubscriptionDetailModal({ sub, processing, onApprove, onReject, onClose, showToast }) {
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="h-1 bg-purple-600"/>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #f5f5f5' }}>
          <h2 className="font-black text-gray-900">Détail de la demande</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400"><X size={17}/></button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto" style={{ maxHeight: '70vh' }}>

          {/* Infos propriétaire */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-2">Propriétaire</p>
            {[
              { label: 'Nom',       value: sub.profiles?.full_name || 'N/A' },
              { label: 'Téléphone', value: sub.profiles?.phone     || 'N/A' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-xs text-gray-500 font-medium">{label}</span>
                <span className="text-xs font-bold text-gray-900">{value}</span>
              </div>
            ))}
          </div>

          {/* Infos abonnement */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-2">Abonnement</p>
            {[
              { label: 'Plan',    value: PLANS_LABEL[sub.plan]                              },
              { label: 'Montant', value: `${Number(sub.amount).toLocaleString()} DH`        },
              { label: 'Date',    value: new Date(sub.created_at).toLocaleDateString('fr-FR')},
              { label: 'Statut',  value: <SubBadge status={sub.status}/>                    },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">{label}</span>
                <span className="text-xs font-bold text-gray-900">{value}</span>
              </div>
            ))}
          </div>

          {/* Preuve de paiement */}
          {sub.proof_url && (
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-2">Reçu de virement</p>
              {sub.proof_url.endsWith('.pdf') || sub.proof_url.includes('pdf') ? (
                <a href={sub.proof_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm font-bold hover:bg-blue-100 transition-colors">
                  <CreditCard size={15}/> Voir le PDF
                </a>
              ) : (
                <div className="rounded-2xl overflow-hidden border border-gray-200">
                  <img src={sub.proof_url} alt="Reçu"
                    className="w-full object-contain max-h-64 bg-gray-50"
                    onError={e => { e.target.style.display = 'none' }}/>
                </div>
              )}
            </div>
          )}

          {/* Raison de rejet si rejeté */}
          {sub.status === 'rejected' && sub.rejected_reason && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-xs font-bold text-red-700">Raison du rejet :</p>
              <p className="text-xs text-red-600 mt-1">{sub.rejected_reason}</p>
            </div>
          )}

          {/* Formulaire rejet */}
          {showRejectForm && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-1.5">
                Raison du rejet (optionnel)
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Ex: Virement non reçu, montant incorrect..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-red-200 focus:border-red-400 text-sm text-gray-700 outline-none resize-none bg-white transition-all"
              />
            </motion.div>
          )}
        </div>

        {/* Actions */}
        {sub.status === 'pending' && (
          <div className="px-6 py-4 space-y-2" style={{ borderTop: '1px solid #f5f5f5', background: '#fafafa' }}>
            {!showRejectForm ? (
              <div className="flex gap-2">
                <button onClick={() => setShowRejectForm(true)}
                  className="flex-1 py-3 border-2 border-red-200 bg-red-50 text-red-600 font-bold text-sm rounded-2xl hover:bg-red-100 transition-all flex items-center justify-center gap-2">
                  <XCircle size={15}/> Rejeter
                </button>
                <button onClick={onApprove} disabled={processing}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2">
                  {processing
                    ? <><Loader2 size={15} className="animate-spin"/> Traitement...</>
                    : <><CheckCircle2 size={15}/> Approuver</>
                  }
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button onClick={() => setShowRejectForm(false)}
                    className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold text-sm rounded-2xl hover:bg-gray-100 transition-all">
                    Annuler
                  </button>
                  <button onClick={() => onReject(rejectReason)} disabled={processing}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2">
                    {processing
                      ? <><Loader2 size={15} className="animate-spin"/> Traitement...</>
                      : <><XCircle size={15}/> Confirmer le rejet</>
                    }
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}

// ─── Onglet Utilisateurs ──────────────────────────────────────
function UsersTab() {
  const [users, setUsers]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [roleFilter, setRoleFilter] = useState('owner')
  const [updatingUserId, setUpdatingUserId] = useState(null)

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, is_active, created_at, subscriptions(status, plan, expires_at)')
      .neq('role', 'admin')
      .order('created_at', { ascending: false })

    if (error) console.error('fetchUsers error:', error)
    setUsers(data || [])
    setLoading(false)
  }

  async function toggleActive(userId, current) {
    setUpdatingUserId(userId)
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !current })
      .eq('id', userId)

    if (error) {
      console.error('toggleActive error:', error)
      alert('Erreur: ' + error.message)
    } else {
      await fetchUsers()
    }
    setUpdatingUserId(null)
  }

  const filtered = users.filter(u => {
    const matchRole   = !roleFilter || u.role === roleFilter
    const matchSearch = !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {[
            { key: 'owner',    label: 'Propriétaires' },
            { key: 'customer', label: 'Clients'       },
            { key: '',         label: 'Tous'          },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setRoleFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                roleFilter === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {label}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un utilisateur..."
          className="flex-1 min-w-48 px-4 py-2 rounded-xl text-sm border border-gray-200 outline-none focus:border-gray-900 bg-white font-medium placeholder-gray-400"/>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f0' }}>
        <div className="grid grid-cols-12 gap-2 px-5 py-3 text-xs font-black text-gray-400 uppercase tracking-wide"
          style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <div className="col-span-4">Utilisateur</div>
          <div className="col-span-2">Rôle</div>
          <div className="col-span-3">Abonnement</div>
          <div className="col-span-2">Inscription</div>
          <div className="col-span-1 text-center">Actif</div>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-50">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-center gap-3 px-5 py-4">
                <div className="w-8 h-8 rounded-full animate-pulse bg-gray-100"/>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-32 animate-pulse"/>
                  <div className="h-2.5 bg-gray-100 rounded w-48 animate-pulse"/>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-gray-300">
            <Users size={28} className="mb-2"/>
            <p className="text-sm font-semibold">Aucun utilisateur</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((u, i) => {
              const subsArray = Array.isArray(u.subscriptions)
                ? u.subscriptions
                : u.subscriptions ? [u.subscriptions] : []
              const activeSub = subsArray.find(s => s.status === 'active')
              return (
                <motion.div key={u.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center hover:bg-gray-50 transition-colors">

                  <div className="col-span-4 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-xs font-black text-white shrink-0">
                      {u.full_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{u.full_name || 'N/A'}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      u.role === 'admin'    ? 'bg-purple-100 text-purple-700' :
                      u.role === 'owner'    ? 'bg-blue-100 text-blue-700'    :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {u.role === 'admin' ? 'Admin' : u.role === 'owner' ? 'Propriétaire' : 'Client'}
                    </span>
                  </div>

                  <div className="col-span-3">
                    {activeSub ? (
                      <div>
                        <p className="text-xs font-bold text-green-700">{PLANS_LABEL[activeSub.plan]?.split('—')[0]}</p>
                        <p className="text-xs text-gray-400">
                          Expire: {activeSub.expires_at ? new Date(activeSub.expires_at).toLocaleDateString('fr-FR') : '—'}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">—</p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">{new Date(u.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>

                  <div className="col-span-1 text-center">
                    <button
                      onClick={() => toggleActive(u.id, u.is_active)}
                      disabled={updatingUserId === u.id}
                      className={`w-8 h-5 rounded-full transition-all relative ${
                        u.is_active ? 'bg-green-500' : 'bg-gray-300'
                      } ${updatingUserId === u.id ? 'opacity-50' : ''}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                        u.is_active ? 'left-3.5' : 'left-0.5'
                      }`}/>
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Onglet Stades ────────────────────────────────────────────
function StadesTab() {
  const [stadiums, setStadiums]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [togglingId, setTogglingId] = useState(null)

  useEffect(() => { fetchStadiums() }, [])

  async function fetchStadiums() {
    setLoading(true)
    const { data, error } = await supabase
      .from('stadiums')
      .select('*, profiles(full_name, phone)')
      .order('created_at', { ascending: false })
    if (error) console.error('fetchStadiums error:', error)
    setStadiums(data || [])
    setLoading(false)
  }

  async function toggleActive(id, current) {
    setTogglingId(id)
    await supabase.from('stadiums').update({ is_active: !current }).eq('id', id)
    await fetchStadiums()
    setTogglingId(null)
  }

  const filtered = stadiums.filter(s =>
    !search ||
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.city?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou ville..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border border-gray-200 outline-none focus:border-gray-900 bg-white font-medium placeholder-gray-400"
        />
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f0' }}>
        <div className="grid grid-cols-12 gap-2 px-5 py-3 text-xs font-black text-gray-400 uppercase tracking-wide"
          style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <div className="col-span-3">Stade</div>
          <div className="col-span-2">Ville</div>
          <div className="col-span-3">Propriétaire</div>
          <div className="col-span-2">Prix/h</div>
          <div className="col-span-1 text-center">Statut</div>
          <div className="col-span-1 text-center">Actif</div>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-50">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-3 px-5 py-4">
                <div className="w-8 h-8 rounded-xl animate-pulse bg-gray-100"/>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-32 animate-pulse"/>
                  <div className="h-2.5 bg-gray-100 rounded w-48 animate-pulse"/>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300">
            <Building2 size={28} className="mb-2"/>
            <p className="text-sm font-semibold">Aucun stade trouvé</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((s, i) => (
              <motion.div key={s.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-12 gap-2 px-5 py-4 items-center hover:bg-gray-50 transition-colors">

                <div className="col-span-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                      <Building2 size={14} className="text-green-600"/>
                    </div>
                    <p className="text-sm font-bold text-gray-900 truncate">{s.name || 'N/A'}</p>
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin size={11} className="shrink-0"/>
                    <span className="truncate">{s.city || '—'}</span>
                  </div>
                </div>

                <div className="col-span-3">
                  <p className="text-sm font-semibold text-gray-700 truncate">{s.profiles?.full_name || '—'}</p>
                  <p className="text-xs text-gray-400 truncate">{s.profiles?.phone || ''}</p>
                </div>

                <div className="col-span-2">
                  <p className="text-sm font-black text-gray-900">
                    {s.price_per_hour != null ? `${Number(s.price_per_hour).toLocaleString()} DH` : '—'}
                  </p>
                </div>

                <div className="col-span-1 text-center">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {s.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                <div className="col-span-1 text-center">
                  <button
                    onClick={() => toggleActive(s.id, s.is_active)}
                    disabled={togglingId === s.id}
                    className={`transition-all ${togglingId === s.id ? 'opacity-50' : ''}`}
                    title={s.is_active ? 'Désactiver' : 'Activer'}
                  >
                    {s.is_active
                      ? <ToggleRight size={22} className="text-green-500"/>
                      : <ToggleLeft size={22} className="text-gray-400"/>
                    }
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Onglet Réservations ──────────────────────────────────────
function BookingsTab() {
  const [bookings, setBookings]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('all')

  useEffect(() => { fetchBookings() }, [])

  async function fetchBookings() {
    setLoading(true)
    const { data, error } = await supabase
      .from('bookings')
      .select('*, stadiums(name, city), profiles:customer_id(full_name, phone)')
      .order('booking_date', { ascending: false })
      .limit(100)
    if (error) console.error('fetchBookings error:', error)
    setBookings(data || [])
    setLoading(false)
  }

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)

  const total     = bookings.length
  const confirmed = bookings.filter(b => b.status === 'confirmed').length
  const revenue   = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + Number(b.total_price || b.price || 0), 0)

  const STATUS_FILTERS = ['all', 'confirmed', 'pending', 'cancelled']
  const STATUS_LABELS  = { all: 'Tous', confirmed: 'Confirmées', pending: 'En attente', cancelled: 'Annulées' }
  const STATUS_BADGE   = {
    confirmed: 'bg-green-100 text-green-700',
    pending:   'bg-amber-100 text-amber-700',
    cancelled: 'bg-red-100 text-red-600',
  }

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total réservations', value: total,     color: '#2563eb', bg: '#eff6ff', icon: CalendarCheck },
          { label: 'Confirmées',         value: confirmed, color: '#16a34a', bg: '#f0fdf4', icon: CheckCircle2  },
          { label: 'Revenus',            value: `${revenue.toLocaleString()} DH`, color: '#7c3aed', bg: '#f5f3ff', icon: CircleDollarSign },
        ].map(({ label, value, color, bg, icon: Icon }, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white rounded-2xl p-4" style={{ border: '1px solid #f0f0f0' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon size={16} style={{ color }}/>
            </div>
            {loading
              ? <div className="h-6 w-16 bg-gray-100 rounded animate-pulse"/>
              : <p className="text-2xl font-black text-gray-900">{value}</p>
            }
            <p className="text-xs text-gray-400 font-semibold mt-1 uppercase tracking-wide">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              filter === s ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
            }`}>
            {STATUS_LABELS[s]}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${filter === s ? 'bg-white/20' : 'bg-gray-100 text-gray-400'}`}>
              {s === 'all' ? bookings.length : bookings.filter(b => b.status === s).length}
            </span>
          </button>
        ))}
        <button onClick={fetchBookings} className="ml-auto p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all">
          <RefreshCw size={16}/>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f0' }}>
        <div className="grid grid-cols-12 gap-2 px-5 py-3 text-xs font-black text-gray-400 uppercase tracking-wide"
          style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <div className="col-span-2">Date</div>
          <div className="col-span-3">Client</div>
          <div className="col-span-3">Stade</div>
          <div className="col-span-2">Créneau</div>
          <div className="col-span-1 text-right">Prix</div>
          <div className="col-span-1 text-center">Statut</div>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-50">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="grid grid-cols-12 gap-2 px-5 py-4">
                {[2,3,3,2,1,1].map((cols, j) => (
                  <div key={j} className={`col-span-${cols} h-3 bg-gray-100 rounded animate-pulse`}/>
                ))}
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300">
            <CalendarCheck size={28} className="mb-2"/>
            <p className="text-sm font-semibold">Aucune réservation</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((b, i) => (
              <motion.div key={b.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center hover:bg-gray-50 transition-colors">

                <div className="col-span-2">
                  <p className="text-xs font-bold text-gray-900">
                    {b.booking_date ? new Date(b.booking_date).toLocaleDateString('fr-FR') : '—'}
                  </p>
                </div>

                <div className="col-span-3">
                  <p className="text-sm font-bold text-gray-900 truncate">{b.profiles?.full_name || 'N/A'}</p>
                  <p className="text-xs text-gray-400 truncate">{b.profiles?.phone || ''}</p>
                </div>

                <div className="col-span-3">
                  <p className="text-sm font-semibold text-gray-700 truncate">{b.stadiums?.name || '—'}</p>
                  <p className="text-xs text-gray-400 truncate">{b.stadiums?.city || ''}</p>
                </div>

                <div className="col-span-2">
                  <p className="text-xs text-gray-600 font-medium">
                    {b.start_time || b.time_slot || '—'}
                    {b.end_time ? ` – ${b.end_time}` : ''}
                  </p>
                </div>

                <div className="col-span-1 text-right">
                  <p className="text-sm font-black text-gray-900">
                    {(b.total_price || b.price) != null
                      ? `${Number(b.total_price || b.price).toLocaleString()}`
                      : '—'}
                  </p>
                </div>

                <div className="col-span-1 text-center">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                    STATUS_BADGE[b.status] || 'bg-gray-100 text-gray-500'
                  }`}>
                    {STATUS_LABELS[b.status] || b.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Badge statut ─────────────────────────────────────────────
function SubBadge({ status }) {
  const C = {
    pending:  { label: 'En attente', cls: 'bg-amber-100 text-amber-700'   },
    active:   { label: 'Actif',      cls: 'bg-green-100 text-green-700'   },
    rejected: { label: 'Rejeté',     cls: 'bg-red-100 text-red-600'       },
    expired:  { label: 'Expiré',     cls: 'bg-gray-100 text-gray-500'     },
  }
  const c = C[status] || C.pending
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${c.cls}`}>{c.label}</span>
}

// ─── Onglet Paramètres Admin ───────────────────────────────────
const EMPTY_BANK = { bank_name: '', rib: '', owner_name: '', phone: '' }

function AdminSettingsTab() {
  const [banks, setBanks]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(EMPTY_BANK)
  const [saving, setSaving]     = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError]       = useState('')

  useEffect(() => { fetchBanks() }, [])

  async function fetchBanks() {
    setLoading(true)
    const { data } = await supabase
      .from('bank_accounts').select('*')
      .order('created_at', { ascending: true })
    setBanks(data || [])
    setLoading(false)
  }

  async function handleAdd() {
    if (!form.bank_name.trim() || !form.rib.trim()) {
      setError('Nom de la banque et RIB sont obligatoires.'); return
    }
    setSaving(true); setError('')
    try {
      const { error: err } = await supabase.from('bank_accounts').insert({
        bank_name:  form.bank_name.trim(),
        rib:        form.rib.trim(),
        owner_name: form.owner_name.trim(),
        phone:      form.phone.trim(),
      })
      if (err) throw err
      setForm(EMPTY_BANK)
      setShowForm(false)
      await fetchBanks()
    } catch(e) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    setDeletingId(id)
    await supabase.from('bank_accounts').delete().eq('id', id)
    await fetchBanks()
    setDeletingId(null)
  }

  async function toggleActive(id, current) {
    await supabase.from('bank_accounts').update({ is_active: !current }).eq('id', id)
    await fetchBanks()
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 size={24} className="animate-spin text-gray-300"/>
    </div>
  )

  return (
    <div className="max-w-2xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-black text-gray-900">Comptes bancaires</h2>
          <p className="text-sm text-gray-400 mt-1">
            Apparaissent dans le modal de paiement lors d'un abonnement.
          </p>
        </div>
        <button onClick={() => { setShowForm(true); setError('') }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black text-white transition-all"
          style={{ background: '#7c3aed' }}>
          <Plus size={15}/> Ajouter
        </button>
      </div>

      {/* Liste des banques */}
      {banks.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center" style={{ border: '1px solid #f0f0f0' }}>
          <Landmark size={32} className="mx-auto text-gray-200 mb-3"/>
          <p className="text-sm font-semibold text-gray-400">Aucun compte bancaire ajouté</p>
          <p className="text-xs text-gray-300 mt-1">Cliquez sur "Ajouter" pour commencer</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banks.map(b => (
            <div key={b.id} className="bg-white rounded-2xl p-4 flex items-center gap-4"
              style={{ border: `1px solid ${b.is_active ? '#f0f0f0' : '#f5f5f5'}`, opacity: b.is_active ? 1 : 0.55 }}>

              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: '#f5f3ff' }}>
                <Landmark size={18} style={{ color: '#7c3aed' }}/>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-900 text-sm">{b.bank_name}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{b.rib}</p>
                {b.owner_name && <p className="text-xs text-gray-400">{b.owner_name}</p>}
                {b.phone && <p className="text-xs text-gray-400">{b.phone}</p>}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleActive(b.id, b.is_active)}
                  className={`w-10 h-5 rounded-full transition-all relative ${b.is_active ? 'bg-green-500' : 'bg-gray-200'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${b.is_active ? 'left-5' : 'left-0.5'}`}/>
                </button>

                <button onClick={() => handleDelete(b.id)} disabled={deletingId === b.id}
                  className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all">
                  {deletingId === b.id
                    ? <Loader2 size={15} className="animate-spin"/>
                    : <Trash2 size={15}/>
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulaire d'ajout */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="bg-white rounded-2xl p-5 space-y-4" style={{ border: '2px solid #7c3aed' }}>

            <div className="flex items-center justify-between">
              <p className="font-black text-gray-900">Nouveau compte bancaire</p>
              <button onClick={() => { setShowForm(false); setError('') }}
                className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400">
                <X size={16}/>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'bank_name',  label: 'Nom de la banque *', placeholder: 'ex: CIH Bank',        icon: Landmark   },
                { key: 'rib',        label: 'RIB *',              placeholder: 'ex: 230 780 ...',      icon: CreditCard },
                { key: 'owner_name', label: 'Titulaire',          placeholder: 'ex: Mohammed Alami',   icon: User       },
                { key: 'phone',      label: 'Téléphone',          placeholder: 'ex: +212 6XX XXX XXX', icon: Phone      },
              ].map(({ key, label, placeholder, icon: Icon }) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
                    {label}
                  </label>
                  <div className="relative">
                    <Icon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"/>
                    <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl text-sm font-medium text-gray-900 outline-none"
                      style={{ background: '#f9fafb', border: '1.5px solid #e5e7eb' }}
                      onFocus={e => e.target.style.borderColor = '#7c3aed'}
                      onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-xs">
                <AlertCircle size={12}/> {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={() => { setShowForm(false); setError('') }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all">
                Annuler
              </button>
              <button onClick={handleAdd} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all"
                style={{ background: '#7c3aed', opacity: saving ? 0.7 : 1 }}>
                {saving ? <><Loader2 size={14} className="animate-spin"/> Ajout...</> : <><Save size={14}/> Ajouter</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs text-amber-700">
        <p className="font-bold mb-1">Comment ça fonctionne ?</p>
        <p>Les comptes actifs s'affichent dans le modal de paiement. Utilisez le toggle pour activer/désactiver un compte sans le supprimer.</p>
      </div>
    </div>
  )
}

// ─── Onglet Activité ──────────────────────────────────────────
function ActivityTab() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchActivity() }, [])

  async function fetchActivity() {
    setLoading(true)
    const [subsRes, profilesRes] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('id, status, created_at, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('profiles')
        .select('id, full_name, role, created_at')
        .eq('role', 'owner')
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    const subs = (subsRes.data || []).map(s => {
      let label = ''
      let color = ''
      let icon  = ''
      if (s.status === 'pending') {
        label = `Nouveau abonnement de ${s.profiles?.full_name || 'N/A'}`
        color = 'amber'
        icon  = '🕐'
      } else if (s.status === 'active') {
        label = `Abonnement approuvé pour ${s.profiles?.full_name || 'N/A'}`
        color = 'green'
        icon  = '✅'
      } else if (s.status === 'rejected') {
        label = `Abonnement rejeté pour ${s.profiles?.full_name || 'N/A'}`
        color = 'red'
        icon  = '❌'
      } else {
        label = `Abonnement (${s.status}) — ${s.profiles?.full_name || 'N/A'}`
        color = 'gray'
        icon  = '📋'
      }
      return { id: `sub-${s.id}`, label, color, icon, date: s.created_at, type: 'subscription' }
    })

    const owners = (profilesRes.data || []).map(p => ({
      id: `owner-${p.id}`,
      label: `Nouveau propriétaire inscrit : ${p.full_name || 'N/A'}`,
      color: 'blue',
      icon: '👤',
      date: p.created_at,
      type: 'owner',
    }))

    const all = [...subs, ...owners].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 40)
    setEvents(all)
    setLoading(false)
  }

  const COLOR_CLASSES = {
    amber: { dot: 'bg-amber-400', bg: 'bg-amber-50', text: 'text-amber-700' },
    green: { dot: 'bg-green-400', bg: 'bg-green-50', text: 'text-green-700' },
    red:   { dot: 'bg-red-400',   bg: 'bg-red-50',   text: 'text-red-700'   },
    blue:  { dot: 'bg-blue-400',  bg: 'bg-blue-50',  text: 'text-blue-700'  },
    gray:  { dot: 'bg-gray-300',  bg: 'bg-gray-50',  text: 'text-gray-500'  },
  }

  function formatRelative(dateStr) {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now - d) / 1000)
    if (diff < 60)        return 'À l\'instant'
    if (diff < 3600)      return `Il y a ${Math.floor(diff / 60)} min`
    if (diff < 86400)     return `Il y a ${Math.floor(diff / 3600)} h`
    if (diff < 604800)    return `Il y a ${Math.floor(diff / 86400)} j`
    return d.toLocaleDateString('fr-FR')
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-gray-900">Journal d'activité</h2>
        <button onClick={fetchActivity} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all">
          <RefreshCw size={16}/>
        </button>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f0' }}>
        {loading ? (
          <div className="p-5 space-y-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full animate-pulse bg-gray-100 shrink-0"/>
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 bg-gray-100 rounded w-56 animate-pulse"/>
                  <div className="h-2.5 bg-gray-100 rounded w-24 animate-pulse"/>
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300">
            <Activity size={28} className="mb-2"/>
            <p className="text-sm font-semibold">Aucune activité récente</p>
          </div>
        ) : (
          <div className="relative p-5">
            {/* Timeline line */}
            <div className="absolute left-9 top-5 bottom-5 w-px bg-gray-100"/>
            <div className="space-y-4">
              {events.map((ev, i) => {
                const c = COLOR_CLASSES[ev.color] || COLOR_CLASSES.gray
                return (
                  <motion.div key={ev.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-start gap-3 relative">
                    <div className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center shrink-0 z-10 text-sm`}>
                      {ev.icon}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm font-semibold text-gray-800">{ev.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatRelative(ev.date)}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
