// src/pages/owner/OwnerDashboard.jsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Trophy, CalendarCheck, Building2,
  LogOut, Menu, X, TrendingUp, ChevronRight,
  CircleDollarSign, CheckCircle2, XCircle,
  Eye, Plus, Loader2, Users, Star, ToggleLeft, ToggleRight,
  AlertCircle, Trash2, Zap, History, CreditCard, Settings, Link,
  Repeat, Phone, User, Clock, Moon, Sun, Calendar, CalendarClock
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  useOwnerStats, useOwnerStadiums,
  useOwnerBookings, useOwnerTournaments,
} from '../../hooks/useOwnerData.jsx'
import StadiumModal from '../../components/StadiumModal'
import TournamentModal from '../../components/TournamentModal'
import TeamsManagementModal from '../../components/TeamsManagementModal'
import NotificationsPanel from '../../components/NotificationsPanel'
import { ConfirmModal } from '../../components/Modal'
import SettingsPage from './SettingsPage'
import HistoriquePage from './HistoriquePage'
import FinancePage from './FinancePage'
import SubscriptionPage from './SubscriptionPage'
import { supabase } from '../../lib/supabase'

const NAV = [
  { key: 'overview',     label: "Vue d'ensemble", icon: LayoutDashboard  },
  { key: 'stadiums',     label: 'Mes terrains',   icon: Building2        },
  { key: 'bookings',     label: 'Réservations',   icon: CalendarCheck    },
  { key: 'tournaments',  label: 'Tournois',       icon: Trophy           },
  { key: 'abonnes',      label: 'Abonnés',        icon: Repeat           },
  { key: 'historique',   label: 'Historique',     icon: History          },
  { key: 'finance',      label: 'Finances',       icon: CircleDollarSign },
  { key: 'subscription', label: 'Abonnement',     icon: CreditCard       },
  { key: 'settings',     label: 'Paramètres',     icon: Settings         },
]

// ─── Page compte inactif ──────────────────────────────────────
function InactiveOwnerPage() {
  const { signOut, profile, refreshProfile } = useAuth()
  const navigate   = useNavigate()
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    await refreshProfile()
    setRefreshing(false)
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* ── Header ── */}
      <header className="bg-white px-4 sm:px-8 py-3 sm:py-4"
        style={{ borderBottom: '1px solid #f0f0f0' }}>
        {/* Ligne 1: Logo + Déconnexion */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center">
              <Zap size={15} className="text-green-400" fill="#4ade80"/>
            </div>
            <span className="font-black text-gray-900">StadiumPro</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
              ⏳ <span className="hidden sm:inline">Compte en attente</span><span className="sm:hidden">En attente</span>
            </span>
            <button onClick={async () => { await signOut(); navigate('/auth') }}
              className="text-xs text-gray-400 hover:text-red-500 font-semibold transition-colors flex items-center gap-1">
              <LogOut size={13}/>
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
        {/* Ligne 2: Bouton actualiser (toute la largeur sur mobile) */}
        <div className="mt-2">
          <button onClick={handleRefresh} disabled={refreshing}
            className="w-full sm:w-auto text-xs font-bold px-3 py-2 rounded-xl border border-green-200 text-green-600 hover:bg-green-50 transition-all flex items-center justify-center gap-1.5">
            {refreshing ? <Loader2 size={12} className="animate-spin"/> : '🔄'}
            Actualiser mon statut après validation
          </button>
        </div>
      </header>

      {/* ── Bannière avertissement ── */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-8 py-3 flex items-start gap-2">
        <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5"/>
        <p className="text-xs sm:text-sm text-amber-800 font-medium">
          Votre compte est en attente d'activation. Souscrivez un plan et envoyez votre reçu. Après approbation, cliquez sur <strong>"Actualiser mon statut"</strong>.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <SubscriptionPage/>
      </div>
    </div>
  )
}

// ─── Dashboard principal ──────────────────────────────────────
export default function OwnerDashboard() {
  const { profile, signOut, user } = useAuth()
  const navigate                   = useNavigate()
  const [tab, setTab]              = useState('overview')
  const [sideOpen, setSideOpen]    = useState(false)
  const [toast, setToast]          = useState(null) // { message, type }

  // ✅ Guard — compte inactif
  if (!profile?.is_active) return <InactiveOwnerPage/>

  async function handleSignOut() { await signOut(); navigate('/auth') }

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  function copyBookingLink() {
    const link = `${window.location.origin}/book/${user?.id}`
    navigator.clipboard.writeText(link)
    showToast('Lien copié dans le presse-papiers !')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex" style={{ fontFamily: "'Outfit', sans-serif" }}>

      {/* ── Toast notification ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl"
            style={{
              background: toast.type === 'success' ? '#111827' : '#dc2626',
              color: '#fff',
              minWidth: '220px',
            }}>
            <CheckCircle2 size={16} className="shrink-0"/>
            <span className="text-sm font-bold">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">
              <X size={14}/>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 fixed h-full bg-white z-30"
        style={{ borderRight: '1px solid #f0f0f0' }}>
        <Sidebar tab={tab} setTab={setTab} profile={profile} onSignOut={handleSignOut}/>
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
              <Sidebar tab={tab} setTab={(t) => { setTab(t); setSideOpen(false) }}
                profile={profile} onSignOut={handleSignOut}/>
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
              <p className="text-xs text-gray-400 font-medium">
                Bonjour, {profile?.full_name || 'Propriétaire'} 👋
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copyBookingLink}
              className="flex items-center gap-2 px-2 sm:px-3 py-2 text-xs font-bold border border-gray-200 hover:border-gray-900 rounded-xl transition-all text-gray-600">
              <Link size={14}/> <span className="hidden sm:inline">Copier mon lien</span>
            </button>
            <NotificationsPanel onNavigate={setTab}/>
          </div>
        </header>

        {/* ✅ display:none بدل unmount — البيانات تُحمَّل مرة واحدة فقط */}
        <div className="flex-1 p-4 sm:p-8">
          <div style={{ display: tab === 'overview'     ? 'block' : 'none' }}><OverviewTab setTab={setTab}/></div>
          <div style={{ display: tab === 'stadiums'     ? 'block' : 'none' }}><StadiumsTab/></div>
          <div style={{ display: tab === 'bookings'     ? 'block' : 'none' }}><BookingsTab/></div>
          <div style={{ display: tab === 'tournaments'  ? 'block' : 'none' }}><TournamentsTab/></div>
          <div style={{ display: tab === 'abonnes'      ? 'block' : 'none' }}><AbonnesTab/></div>
          <div style={{ display: tab === 'historique'   ? 'block' : 'none' }}><HistoriquePage/></div>
          <div style={{ display: tab === 'finance'      ? 'block' : 'none' }}><FinancePage/></div>
          <div style={{ display: tab === 'subscription' ? 'block' : 'none' }}><SubscriptionPage/></div>
          <div style={{ display: tab === 'settings'     ? 'block' : 'none' }}><SettingsPage/></div>
        </div>
      </main>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────
function Sidebar({ tab, setTab, profile, onSignOut }) {
  const [dark, setDark] = useState(() => localStorage.getItem('stadiumDark') === '1')

  function toggleDark() {
    const next = !dark
    setDark(next)
    localStorage.setItem('stadiumDark', next ? '1' : '0')
    document.documentElement.classList.toggle('dark', next)
  }

  return (
    <>
      {/* Logo */}
      <div className="px-6 py-5" style={{ borderBottom: '1px solid #f5f5f5' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-900">
            <Zap size={15} className="text-green-400" fill="#4ade80"/>
          </div>
          <div>
            <p className="font-black text-gray-900 text-sm">StadiumPro</p>
            <p className="text-xs text-gray-400 font-medium">Espace propriétaire</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-xs font-black text-gray-300 uppercase tracking-widest px-3 mb-3">Navigation</p>
        {NAV.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
              tab === key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}>
            <Icon size={16}/><span>{label}</span>
            {tab === key && <ChevronRight size={13} className="ml-auto opacity-40"/>}
          </button>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4" style={{ borderTop: '1px solid #f5f5f5', paddingTop: 12 }}>

        {/* Profile card — clickable → settings */}
        <button onClick={() => setTab('settings')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-2 hover:bg-gray-100 transition-all text-left group">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-900 flex items-center justify-center shrink-0 ring-2 ring-transparent group-hover:ring-green-400 transition-all">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover"/>
              : <span className="text-sm font-black text-green-400">
                  {profile?.full_name?.[0]?.toUpperCase() || 'P'}
                </span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{profile?.full_name || 'Propriétaire'}</p>
            <p className="text-xs text-gray-400 truncate">{profile?.phone || ''}</p>
          </div>
          <ChevronRight size={13} className="text-gray-300 group-hover:text-green-500 transition-all"/>
        </button>

        {/* Dark mode */}
        <button onClick={toggleDark}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all">
          {dark
            ? <><Sun  size={15} className="text-amber-400"/> Mode clair</>
            : <><Moon size={15} className="text-indigo-400"/> Mode sombre</>
          }
          <div className={`ml-auto w-9 h-5 rounded-full transition-all relative ${dark ? 'bg-indigo-500' : 'bg-gray-200'}`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${dark ? 'left-4' : 'left-0.5'}`}/>
          </div>
        </button>

        {/* Déconnexion */}
        <button onClick={onSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all mt-1">
          <LogOut size={15}/> Se déconnecter
        </button>
      </div>
    </>
  )
}

// ─── Vue d'ensemble ───────────────────────────────────────────
function OverviewTab({ setTab }) {
  const { user }                                                 = useAuth()
  const { stats, loading: sl }                                   = useOwnerStats()
  const { stadiums, loading: stl }                               = useOwnerStadiums()
  const { bookings, loading: bl, confirmBooking, cancelBooking } = useOwnerBookings()
  const { tournaments, loading: tl }                             = useOwnerTournaments()
  const [chartData, setChartData]       = useState([])
  const [chartLoading, setChartLoading] = useState(true)

  useEffect(() => { if (user) fetchChartData() }, [user])

  async function fetchChartData() {
    setChartLoading(true)
    try {
      const { data: stds } = await supabase.from('stadiums').select('id').eq('owner_id', user.id)
      const ids = stds?.map(s => s.id) || []
      const months = buildEmptyMonths()
      if (ids.length > 0) {
        const year = new Date().getFullYear()
        const { data: bks } = await supabase
          .from('bookings').select('booking_date, total_price, status')
          .in('stadium_id', ids)
          .gte('booking_date', `${year}-01-01`)
          .lte('booking_date', `${year}-12-31`)
        bks?.forEach(b => {
          const m = parseInt(b.booking_date?.split('-')[1]) - 1
          if (m >= 0 && m < 12) {
            months[m].bookings++
            if (b.status === 'confirmed') months[m].revenue += Number(b.total_price)
          }
        })
      }
      setChartData(months)
    } catch { setChartData(buildEmptyMonths()) }
    finally { setChartLoading(false) }
  }

  function buildEmptyMonths() {
    return Array.from({ length: 12 }, (_, i) => ({
      label: ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'][i],
      revenue: 0, bookings: 0,
    }))
  }

  const maxRevenue   = Math.max(...chartData.map(d => d.revenue), 1)
  const currentMonth = new Date().getMonth()
  const totalRevenue = chartData.reduce((s, d) => s + d.revenue, 0)

  const STATS = [
    { label: 'Terrains actifs',  value: stats?.activeStadiums,
      icon: Building2,          accent: '#16a34a', bg: '#f0fdf4', iconColor: '#16a34a' },
    { label: 'Réservations',    value: stats?.totalBookings,
      icon: CalendarCheck,      accent: '#2563eb', bg: '#eff6ff', iconColor: '#2563eb' },
    { label: 'Revenus du mois',
      value: stats?.monthlyRevenue != null ? `${Number(stats.monthlyRevenue).toLocaleString()} DH` : '0 DH',
      icon: CircleDollarSign,   accent: '#d97706', bg: '#fffbeb', iconColor: '#d97706' },
    { label: 'Tournois actifs', value: stats?.activeTournaments,
      icon: Trophy,             accent: '#7c3aed', bg: '#f5f3ff', iconColor: '#7c3aed' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon: Icon, accent, bg, iconColor }, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 relative overflow-hidden"
            style={{ border: '1px solid #f0f0f0' }}>
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: accent }}/>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon size={18} style={{ color: iconColor }}/>
              </div>
              <TrendingUp size={13} className="text-gray-300 mt-1"/>
            </div>
            {sl ? <div className="h-8 w-20 rounded-lg animate-pulse bg-gray-100"/>
              : <p className="text-3xl font-black text-gray-900">{value ?? '—'}</p>
            }
            <p className="text-xs text-gray-400 font-semibold mt-1.5 uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #f0f0f0' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-black text-gray-900 text-sm">Revenus {new Date().getFullYear()}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {chartLoading ? 'Chargement...' : `${totalRevenue.toLocaleString()} DH confirmés`}
            </p>
          </div>
          <button onClick={() => setTab('finance')}
            className="text-xs text-gray-400 hover:text-gray-700 font-bold flex items-center gap-1">
            Détails <ChevronRight size={12}/>
          </button>
        </div>
        <div style={{ height: 160 }}>
          <div className="flex items-end gap-1.5 h-full">
            {(chartLoading ? buildEmptyMonths() : chartData).map((d, i) => {
              const barPx     = d.revenue > 0 ? Math.max(Math.round((d.revenue / maxRevenue) * 110), 10) : 4
              const isCurrent = i === currentMonth
              return (
                <div key={i} className="flex-1 flex flex-col items-center"
                  style={{ height: '100%', justifyContent: 'flex-end', gap: 6 }}>
                  <div className={`w-full rounded-t-lg ${chartLoading ? 'animate-pulse bg-gray-100' : ''}`}
                    style={{
                      height:     chartLoading ? 30 + (i*7)%50 : barPx,
                      background: chartLoading ? undefined : isCurrent ? '#111827' : d.revenue > 0 ? '#d1d5db' : '#f3f4f6',
                    }}
                    title={d.revenue > 0 ? `${d.revenue.toLocaleString()} DH` : '–'}/>
                  <p className="text-xs font-semibold" style={{ color: isCurrent ? '#111827' : '#9ca3af' }}>
                    {d.label}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Réservations + Terrains */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Réservations récentes" icon={<CalendarCheck size={15} className="text-blue-500"/>}
          action="Voir tout" onAction={() => setTab('bookings')}>
          {bl ? <LoadingRows count={3}/>
            : bookings.length === 0 ? <EmptyState message="Aucune réservation"/>
            : bookings.slice(0, 3).map(b => (
                <BookingRow key={b.id} booking={b} compact onConfirm={confirmBooking} onCancel={cancelBooking}/>
              ))
          }
        </Card>
        <Card title="Mes terrains" icon={<Building2 size={15} className="text-green-600"/>}
          action="Gérer" onAction={() => setTab('stadiums')}>
          {stl ? <LoadingRows count={3}/>
            : stadiums.length === 0 ? <EmptyState message="Aucun terrain"/>
            : stadiums.map(s => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3.5"
                  style={{ borderBottom: '1px solid #fafafa' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
                      {s.images?.[0]
                        ? <img src={s.images[0]} alt="" className="w-full h-full object-cover"
                            onError={e => e.target.style.display='none'}/>
                        : <Building2 size={15} className="text-gray-400"/>}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.city} · {s.size} · {s.price_per_hour} DH/h</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>{s.is_active ? 'Actif' : 'Inactif'}</span>
                </div>
              ))
          }
        </Card>
      </div>

      {/* Tournois */}
      <Card title="Tournois" icon={<Trophy size={15} className="text-purple-600"/>}
        action="Voir tout" onAction={() => setTab('tournaments')}>
        {tl ? <div className="p-4"><LoadingRows count={2}/></div>
          : tournaments.length === 0 ? <EmptyState message="Aucun tournoi"/>
          : <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4">
              {tournaments.slice(0, 3).map(t => (
                <div key={t.id} className="rounded-xl p-4 bg-gray-50 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <Trophy size={15} className="text-purple-500"/>
                    <TBadge status={t.status}/>
                  </div>
                  <p className="font-black text-gray-900 text-sm truncate">{t.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.stadiumName}</p>
                  <div className="mt-2 h-1 rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-full rounded-full bg-purple-500"
                      style={{ width: `${t.max_teams ? Math.round(((t.teamCount||0)/t.max_teams)*100) : 0}%` }}/>
                  </div>
                  <p className="text-xs text-purple-600 font-bold mt-1.5">{t.teamCount||0}/{t.max_teams} équipes</p>
                </div>
              ))}
            </div>
        }
      </Card>
    </div>
  )
}

// ─── Terrains ─────────────────────────────────────────────────
function StadiumsTab() {
  const { stadiums, loading, toggleStadium, deleteStadium, refetch } = useOwnerStadiums()
  const [showAdd, setShowAdd]       = useState(false)
  const [edit, setEdit]             = useState(null)
  const [delTarget, setDelTarget]   = useState(null)
  const [delLoading, setDelLoading] = useState(false)

  async function handleDelete() {
    setDelLoading(true)
    try { await deleteStadium(delTarget.id); setDelTarget(null) }
    catch(e) { console.error(e) } finally { setDelLoading(false) }
  }

  return (
    <div className="space-y-5">
      <StadiumModal isOpen={showAdd} stadium={null} onClose={() => setShowAdd(false)}
        onSuccess={() => { refetch(); setShowAdd(false) }}/>
      <StadiumModal isOpen={Boolean(edit)} stadium={edit} onClose={() => setEdit(null)}
        onSuccess={() => { refetch(); setEdit(null) }}/>
      <ConfirmModal isOpen={Boolean(delTarget)} type="danger" title="Supprimer le terrain ?"
        message={`Supprimer "${delTarget?.name}" ? Action irréversible.`}
        confirmLabel="Supprimer" cancelLabel="Annuler" loading={delLoading}
        onConfirm={handleDelete} onCancel={() => setDelTarget(null)}/>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400 font-semibold">{stadiums.length} terrain(s)</p>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-colors">
          <Plus size={15}/> Ajouter un terrain
        </button>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-72 bg-white rounded-2xl animate-pulse border border-gray-100"/>)}
        </div>
      ) : stadiums.length === 0 ? <EmptyState message="Aucun terrain ajouté" icon={Building2}/> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {stadiums.map((s, i) => (
            <div key={s.id} className="bg-white rounded-2xl overflow-hidden group"
              style={{ border: '1px solid #f0f0f0' }}>
              <div className="h-44 bg-gray-100 relative overflow-hidden">
                {s.images?.length > 0
                  ? <img src={s.images[0]} alt={s.name} loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => e.target.style.display='none'}/>
                  : <div className="w-full h-full flex items-center justify-center">
                      <Building2 size={40} className="text-gray-200"/>
                    </div>
                }
                <span className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full ${
                  s.is_active ? 'bg-green-500 text-white' : 'bg-gray-800/70 text-gray-300'
                }`}>{s.is_active ? 'Actif' : 'Inactif'}</span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-black text-gray-900 text-base">{s.name}</h3>
                  <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">{s.size}</span>
                </div>
                <p className="text-xs text-gray-400 font-medium mb-4">{s.city} · {s.surface || 'N/A'}</p>
                <div className="flex items-center pt-3 mb-4" style={{ borderTop: '1px solid #f5f5f5' }}>
                  <div className="flex-1 text-center">
                    <p className="text-lg font-black text-gray-900">{s.price_per_hour}
                      <span className="text-xs font-semibold text-gray-400"> DH/h</span>
                    </p>
                  </div>
                  <div className="w-px h-8 bg-gray-100"/>
                  <div className="flex-1 text-center">
                    <p className="text-lg font-black text-gray-900">{s.bookingCount}</p>
                    <p className="text-xs text-gray-400">réservations</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEdit(s)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white transition-colors">
                    <Eye size={13}/> Modifier
                  </button>
                  <button onClick={() => toggleStadium(s.id, s.is_active)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border ${
                      s.is_active ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-green-200 bg-green-50 text-green-700'
                    }`}>
                    {s.is_active ? <ToggleRight size={13}/> : <ToggleLeft size={13}/>}
                    {s.is_active ? 'Désactiver' : 'Activer'}
                  </button>
                  <button onClick={() => setDelTarget(s)}
                    className="p-2.5 rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                    <Trash2 size={13}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Réservations ─────────────────────────────────────────────
function BookingsTab() {
  const [filter, setFilter] = useState('all')
  const { bookings, loading, confirmBooking, cancelBooking } = useOwnerBookings()
  const statuses = ['all','pending','confirmed','cancelled']
  const labels   = { all:'Tout', pending:'En attente', confirmed:'Confirmé', cancelled:'Annulé' }
  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              filter === s ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
            }`}>
            {labels[s]}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${filter===s?'bg-white/20':'bg-gray-100 text-gray-400'}`}>
              {s==='all' ? bookings.length : bookings.filter(b=>b.status===s).length}
            </span>
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f0' }}>
        {loading ? <LoadingRows count={5}/>
          : filtered.length === 0 ? <EmptyState message="Aucune réservation"/>
          : filtered.map(b => <BookingRow key={b.id} booking={b} onConfirm={confirmBooking} onCancel={cancelBooking}/>)
        }
      </div>
    </div>
  )
}

// ─── Tournois ─────────────────────────────────────────────────
function TournamentsTab() {
  const { tournaments, loading, updateTournamentStatus, generateCalendar, refetch } = useOwnerTournaments()
  const [showModal, setShowModal]   = useState(false)
  const [editT, setEditT]           = useState(null)
  const [delTarget, setDelTarget]   = useState(null)
  const [delLoading, setDelLoading] = useState(false)
  const [teamsModal, setTeamsModal] = useState(null)

  async function handleDelete() {
    setDelLoading(true)
    try { await supabase.from('tournaments').delete().eq('id', delTarget.id); await refetch(); setDelTarget(null) }
    catch(e) { console.error(e) } finally { setDelLoading(false) }
  }

  return (
    <div className="space-y-5">
      <TournamentModal isOpen={showModal} tournament={null} onClose={() => setShowModal(false)}
        onSuccess={() => { refetch(); setShowModal(false) }}/>
      <TournamentModal isOpen={Boolean(editT)} tournament={editT} onClose={() => setEditT(null)}
        onSuccess={() => { refetch(); setEditT(null) }}/>
      <TeamsManagementModal isOpen={Boolean(teamsModal)} tournament={teamsModal}
        onClose={() => setTeamsModal(null)}/>
      <ConfirmModal isOpen={Boolean(delTarget)} type="danger" title="Supprimer le tournoi ?"
        message={`Supprimer "${delTarget?.name}" ?`} confirmLabel="Supprimer" cancelLabel="Annuler"
        loading={delLoading} onConfirm={handleDelete} onCancel={() => setDelTarget(null)}/>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400 font-semibold">{tournaments.length} tournoi(s)</p>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-colors">
          <Plus size={15}/> Nouveau tournoi
        </button>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-56 bg-white rounded-2xl animate-pulse border border-gray-100"/>)}
        </div>
      ) : tournaments.length === 0 ? <EmptyState message="Aucun tournoi créé" icon={Trophy}/> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tournaments.map((t, i) => (
            <div key={t.id} className="bg-white rounded-2xl overflow-hidden"
              style={{ border: '1px solid #f0f0f0' }}>
              <div className="h-1" style={{ background: t.status==='ongoing'?'#16a34a':t.status==='open'?'#2563eb':'#e5e7eb' }}/>
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <Trophy size={18} className="text-purple-600"/>
                  </div>
                  <TBadge status={t.status}/>
                </div>
                <h3 className="font-black text-gray-900 text-base">{t.name}</h3>
                <p className="text-xs text-gray-400 font-medium mt-1">{t.stadiumName} · {t.start_date}</p>
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-gray-400">Équipes</span>
                    <span className="text-gray-700">{t.teamCount||0}/{t.max_teams}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gray-900"
                      style={{ width: `${t.max_teams ? Math.round(((t.teamCount||0)/t.max_teams)*100) : 0}%` }}/>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {(t.status==='open'||t.status==='ongoing') && (
                    <button onClick={() => setTeamsModal(t)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold border border-purple-200 bg-purple-50 text-purple-700 flex items-center justify-center gap-1.5">
                      <Users size={12}/> Équipes ({t.teamCount||0})
                    </button>
                  )}
                  {t.status==='draft' && <>
                    <button onClick={() => setEditT(t)} className="flex-1 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-gray-50 text-gray-700">Modifier</button>
                    <button onClick={() => updateTournamentStatus(t.id,'open')} className="flex-1 py-2 rounded-xl text-xs font-bold border border-blue-200 bg-blue-50 text-blue-700">Ouvrir</button>
                    <button onClick={() => setDelTarget(t)} className="p-2 rounded-xl border border-red-100 bg-red-50 text-red-500"><Trash2 size={13}/></button>
                  </>}
                  {t.status==='ongoing' && (
                    <button onClick={() => updateTournamentStatus(t.id,'finished')}
                      className="flex-1 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-gray-50 text-gray-600">
                      Terminer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────
function Card({ title, icon, action, onAction, children }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f0' }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #fafafa' }}>
        <h2 className="font-black text-gray-900 text-sm flex items-center gap-2">{icon} {title}</h2>
        {action && <button onClick={onAction} className="text-xs font-bold text-gray-400 hover:text-gray-700 flex items-center gap-1">{action} <ChevronRight size={12}/></button>}
      </div>
      {children}
    </div>
  )
}

function BookingRow({ booking: b, compact, onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false)
  const [rowError, setRowError] = useState('')
  const S = {
    confirmed: { label: 'Confirmé',   cls: 'bg-green-100 text-green-700' },
    pending:   { label: 'En attente', cls: 'bg-amber-100 text-amber-700' },
    cancelled: { label: 'Annulé',     cls: 'bg-red-100 text-red-600'     },
  }
  const s = S[b.status] || S.pending
  async function handle(fn) {
    setLoading(true)
    setRowError('')
    try { await fn(b.id) }
    catch(err) { setRowError(err.message || 'Erreur') }
    finally { setLoading(false) }
  }
  return (
    <div style={{ borderBottom: '1px solid #fafafa' }}>
      <div className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            <Users size={13} className="text-gray-500"/>
          </div>
          <div className="min-w-0">
            {/* Row 1: name + phone */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-gray-900 truncate">
                {b.booker_name || b.profiles?.full_name || '—'}
              </span>
              {(b.booker_phone || b.profiles?.phone) && (
                <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                  📞 {b.booker_phone || b.profiles?.phone}
                </span>
              )}
            </div>
            {/* Row 2: stadium · date · time */}
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {b.stadiums?.name && (
                <span className="text-xs font-semibold text-gray-500">{b.stadiums.name}</span>
              )}
              <span className="text-gray-300 text-xs">·</span>
              <span className="text-xs text-gray-500">{b.booking_date}</span>
              <span className="text-gray-300 text-xs">·</span>
              <span className="text-xs font-semibold text-gray-700">{b.start_time?.slice(0,5)}–{b.end_time?.slice(0,5)}</span>
            </div>
            {/* Row 3: réservé le */}
            {b.created_at && (
              <p className="text-xs text-gray-300 mt-0.5">
                Réservé le {new Date(b.created_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'short' })} à {new Date(b.created_at).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!compact && <p className="text-sm font-black text-gray-900 hidden sm:block">{b.total_price} DH</p>}
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
          {!compact && b.status==='pending' && !loading && (
            <div className="flex gap-1">
              <button onClick={() => handle(onConfirm)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><CheckCircle2 size={15}/></button>
              <button onClick={() => handle(onCancel)}  className="p-1.5 text-red-500  hover:bg-red-50   rounded-lg"><XCircle      size={15}/></button>
            </div>
          )}
          {loading && <Loader2 size={15} className="animate-spin text-gray-400"/>}
        </div>
      </div>
      {rowError && (
        <p className="px-5 pb-2 text-xs text-red-500 font-medium">⚠️ {rowError}</p>
      )}
    </div>
  )
}

function TBadge({ status }) {
  const C = { draft:'bg-gray-100 text-gray-500', open:'bg-blue-100 text-blue-700', ongoing:'bg-green-100 text-green-700', finished:'bg-purple-100 text-purple-700' }
  const L = { draft:'Brouillon', open:'Inscriptions', ongoing:'En cours', finished:'Terminé' }
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${C[status]||C.draft}`}>{L[status]||'Brouillon'}</span>
}

function LoadingRows({ count }) {
  return (
    <div>{Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #fafafa' }}>
        <div className="w-8 h-8 rounded-xl animate-pulse bg-gray-100"/>
        <div className="flex-1 space-y-2">
          <div className="h-3 rounded animate-pulse bg-gray-100 w-28"/>
          <div className="h-2.5 rounded animate-pulse bg-gray-100 w-44"/>
        </div>
        <div className="h-5 w-16 rounded-full animate-pulse bg-gray-100"/>
      </div>
    ))}</div>
  )
}

function EmptyState({ message, icon: Icon = AlertCircle }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-gray-300">
      <Icon size={28} className="mb-2"/>
      <p className="text-sm font-semibold">{message}</p>
    </div>
  )
}

// ─── Abonnés Tab ───────────────────────────────────────────────
const DAYS_LABEL  = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']
const DAYS_ORDER  = [1,2,3,4,5,6,0] // Lun→Dim

function AbonnesTab() {
  const { user }                          = useAuth()
  const [stadiums, setStadiums]           = useState([])
  const [selectedStadium, setSelectedStadium] = useState(null)
  const [timeSlots, setTimeSlots]         = useState([])
  const [abonnes, setAbonnes]             = useState([])
  const [loading, setLoading]             = useState(true)
  // Modal ajouter
  const [addModal, setAddModal]           = useState(null) // { day_of_week, hour }
  const [addForm, setAddForm]             = useState({ player_name: '', player_phone: '', start_date: '', end_date: '' })
  const [saving, setSaving]               = useState(false)
  // Modal conflit
  const [conflictModal, setConflictModal] = useState(null) // { existing }
  // Modal info abonné (clic sur cellule bleue)
  const [infoModal, setInfoModal]         = useState(null) // abonné object

  useEffect(() => { if (user) fetchStadiums() }, [user])

  async function fetchStadiums() {
    const { data } = await supabase.from('stadiums')
      .select('id, name, time_slots(*)').eq('owner_id', user.id).eq('is_active', true)
    setStadiums(data || [])
    if (data?.length) selectStadium(data[0])
    else setLoading(false)
  }

  async function selectStadium(std) {
    setSelectedStadium(std)
    setTimeSlots(std.time_slots || [])
    setLoading(true)
    const { data } = await supabase.from('recurring_bookings')
      .select('*').eq('stadium_id', std.id)
    setAbonnes(data || [])
    setLoading(false)
  }

  // Heures disponibles pour ce terrain
  const hours = (() => {
    const s = new Set()
    timeSlots.filter(t => t.is_available).forEach(t => {
      for (let h = parseInt(t.start_time); h < parseInt(t.end_time); h++) s.add(h)
    })
    return s.size > 0 ? Array.from(s).sort((a,b)=>a-b) : Array.from({length:14},(_,i)=>8+i)
  })()

  function hasSlot(dow, hour) {
    if (timeSlots.length === 0) return true
    return timeSlots.some(s =>
      s.day_of_week === dow && parseInt(s.start_time) <= hour &&
      parseInt(s.end_time) > hour && s.is_available
    )
  }

  function getAbonne(dow, hour) {
    const t1 = `${String(hour).padStart(2,'0')}:00`
    const t2 = `${String(hour+1).padStart(2,'0')}:00`
    return abonnes.find(a =>
      a.day_of_week === dow &&
      a.start_time.slice(0,5) <= t1 &&
      a.end_time.slice(0,5)   >= t2
    ) || null
  }

  function handleCellClick(dow, hour) {
    const existing = getAbonne(dow, hour)
    if (existing) { setInfoModal(existing); return }
    if (!hasSlot(dow, hour)) return
    const today = new Date().toISOString().split('T')[0]
    setAddModal({ day_of_week: dow, hour })
    setAddForm({ player_name: '', player_phone: '', start_date: today, end_date: '' })
  }

  function applyDuration(months) {
    const base = addForm.start_date || new Date().toISOString().split('T')[0]
    const d = new Date(base)
    d.setMonth(d.getMonth() + months)
    setAddForm(f => ({ ...f, end_date: d.toISOString().split('T')[0] }))
  }

  function isExpired(ab) {
    if (!ab.end_date) return false
    return ab.end_date < new Date().toISOString().split('T')[0]
  }

  function daysLeft(ab) {
    if (!ab.end_date) return null
    const diff = Math.ceil((new Date(ab.end_date) - new Date()) / 86400000)
    return diff
  }

  async function handleSave() {
    if (!addForm.player_name.trim()) return
    setSaving(true)
    const startH = String(addModal.hour).padStart(2,'0')
    const endH   = String(addModal.hour + 1).padStart(2,'0')
    const { error } = await supabase.from('recurring_bookings').insert({
      stadium_id:   selectedStadium.id,
      day_of_week:  addModal.day_of_week,
      start_time:   `${startH}:00`,
      end_time:     `${endH}:00`,
      player_name:  addForm.player_name.trim(),
      player_phone: addForm.player_phone.trim(),
      start_date:   addForm.start_date || null,
      end_date:     addForm.end_date   || null,
    })
    setSaving(false)
    if (error) { setAddModal(null); return }
    setAddModal(null)
    const { data } = await supabase.from('recurring_bookings')
      .select('*').eq('stadium_id', selectedStadium.id)
    setAbonnes(data || [])
  }

  async function handleDelete(id) {
    await supabase.from('recurring_bookings').delete().eq('id', id)
    setInfoModal(null)
    const { data } = await supabase.from('recurring_bookings')
      .select('*').eq('stadium_id', selectedStadium.id)
    setAbonnes(data || [])
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="font-black text-gray-900 text-lg">Abonnés réguliers</h2>
        <p className="text-xs text-gray-400 mt-0.5">Cliquez sur un créneau vert pour ajouter un abonné fixe</p>
      </div>

      {/* Sélecteur terrain */}
      {stadiums.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {stadiums.map(s => (
            <button key={s.id} onClick={() => selectStadium(s)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                selectedStadium?.id === s.id
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}>
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Légende */}
      <div className="flex items-center gap-4 flex-wrap text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md inline-block" style={{background:'#f0fdf4',border:'1px solid #86efac'}}/>Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md inline-block" style={{background:'#eff6ff',border:'1px solid #bfdbfe'}}/>Abonné actif
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md inline-block" style={{background:'#f9fafb',border:'1px solid #e5e7eb'}}/>⚠ Expiré
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-gray-100 inline-block"/>Fermé
        </span>
      </div>

      {/* Grille */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f0' }}>
        {loading ? <LoadingRows count={6}/> : !selectedStadium ? (
          <EmptyState message="Aucun terrain trouvé" icon={Building2}/>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse" style={{ minWidth: '520px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                  <th className="w-10 px-3 py-3 text-left text-gray-400 font-semibold sticky left-0 bg-white z-10">h</th>
                  {DAYS_ORDER.map(dow => (
                    <th key={dow} className="px-1 py-3 text-center" style={{ minWidth: '70px' }}>
                      <span className="text-sm font-black text-gray-800">{DAYS_LABEL[dow]}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hours.map(hour => (
                  <tr key={hour} style={{ borderBottom: '1px solid #fafafa' }}>
                    <td className="px-3 py-1 text-gray-400 font-mono font-semibold sticky left-0 bg-white z-10 whitespace-nowrap">
                      {String(hour).padStart(2,'0')}h
                    </td>
                    {DAYS_ORDER.map(dow => {
                      const slot    = hasSlot(dow, hour)
                      const abonne  = slot ? getAbonne(dow, hour) : null
                      return (
                        <td key={dow} className="px-1 py-1 text-center">
                          {!slot ? (
                            <div className="h-10 rounded-xl bg-gray-50"/>
                          ) : abonne ? (
                            <button onClick={() => handleCellClick(dow, hour)}
                              className="w-full h-10 rounded-xl text-xs font-bold truncate px-1 transition-all hover:opacity-80"
                              style={isExpired(abonne)
                                ? { background:'#f9fafb', border:'1px solid #e5e7eb', color:'#9ca3af' }
                                : { background:'#eff6ff', border:'1px solid #bfdbfe', color:'#2563eb' }}
                              title={`${abonne.player_name}${isExpired(abonne) ? ' — Expiré' : ''}`}>
                              {abonne.player_name.split(' ')[0]}
                              {isExpired(abonne) && <span className="ml-0.5">⚠</span>}
                            </button>
                          ) : (
                            <button onClick={() => handleCellClick(dow, hour)}
                              className="w-full h-10 rounded-xl font-bold text-xs transition-all hover:scale-105 hover:shadow-sm"
                              style={{ background:'#f0fdf4', border:'1px solid #86efac', color:'#16a34a' }}>
                              +
                            </button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal Ajouter Abonné ── */}
      <AnimatePresence>
        {addModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setAddModal(null)}/>
            <motion.div initial={{opacity:0,scale:0.92,y:16}} animate={{opacity:1,scale:1,y:0}}
              exit={{opacity:0,scale:0.92,y:16}} transition={{duration:0.2}}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-5">

              {/* Header modal */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-green-600 mb-0.5">Nouveau abonné</p>
                  <h3 className="text-lg font-black text-gray-900">
                    {DAYS_LABEL[addModal.day_of_week]} · {String(addModal.hour).padStart(2,'0')}:00 – {String(addModal.hour+1).padStart(2,'0')}:00
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">{selectedStadium?.name}</p>
                </div>
                <button onClick={() => setAddModal(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
                  <X size={18}/>
                </button>
              </div>

              {/* Champs */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Nom du joueur *</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input autoFocus value={addForm.player_name}
                      onChange={e => setAddForm(f => ({...f, player_name: e.target.value}))}
                      placeholder="Prénom Nom"
                      className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gray-900 text-sm font-medium outline-none transition-all"/>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Téléphone</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input value={addForm.player_phone} type="tel"
                      onChange={e => setAddForm(f => ({...f, player_phone: e.target.value.replace(/[^0-9+\s]/g,'')}))}
                      placeholder="+212 6XX XXX XXX"
                      className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gray-900 text-sm font-medium outline-none transition-all"/>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Début *</label>
                    <div className="relative">
                      <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                      <input type="date" value={addForm.start_date}
                        onChange={e => setAddForm(f => ({...f, start_date: e.target.value}))}
                        className="w-full pl-9 pr-2 py-3 rounded-xl border-2 border-gray-200 focus:border-gray-900 text-sm font-medium outline-none transition-all"/>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Fin</label>
                    <div className="relative">
                      <CalendarClock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                      <input type="date" value={addForm.end_date}
                        min={addForm.start_date}
                        onChange={e => setAddForm(f => ({...f, end_date: e.target.value}))}
                        className="w-full pl-9 pr-2 py-3 rounded-xl border-2 border-gray-200 focus:border-gray-900 text-sm font-medium outline-none transition-all"/>
                    </div>
                  </div>
                </div>

                {/* Raccourcis durée */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Raccourcis</label>
                  <div className="flex gap-2">
                    {[['1M', 1], ['3M', 3], ['6M', 6], ['1 An', 12]].map(([label, months]) => (
                      <button key={label} type="button" onClick={() => applyDuration(months)}
                        className="flex-1 py-2 rounded-xl text-xs font-black border-2 transition-all hover:scale-105"
                        style={
                          (() => {
                            if (!addForm.end_date || !addForm.start_date) return { border:'2px solid #e5e7eb', color:'#374151', background:'#f9fafb' }
                            const d = new Date(addForm.start_date)
                            d.setMonth(d.getMonth() + months)
                            const expected = d.toISOString().split('T')[0]
                            const isActive = addForm.end_date === expected
                            return isActive
                              ? { border:'2px solid #111827', background:'#111827', color:'white' }
                              : { border:'2px solid #e5e7eb', color:'#374151', background:'#f9fafb' }
                          })()
                        }>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-3">
                <button onClick={() => setAddModal(null)}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
                  Annuler
                </button>
                <button onClick={handleSave} disabled={saving || !addForm.player_name.trim()}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  style={{ background: '#111827' }}>
                  {saving ? <Loader2 size={15} className="animate-spin"/> : <CheckCircle2 size={15}/>}
                  Confirmer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal Info Abonné (clic sur cellule bleue) ── */}
      <AnimatePresence>
        {infoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setInfoModal(null)}/>
            <motion.div initial={{opacity:0,scale:0.92,y:16}} animate={{opacity:1,scale:1,y:0}}
              exit={{opacity:0,scale:0.92,y:16}} transition={{duration:0.2}}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-5">

              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm"
                  style={{ background:'#eff6ff', color:'#2563eb' }}>
                  {DAYS_LABEL[infoModal.day_of_week]}
                </div>
                <button onClick={() => setInfoModal(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={18}/></button>
              </div>

              <div>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xl font-black text-gray-900">{infoModal.player_name}</p>
                  {/* Statut badge */}
                  {infoModal.end_date && (() => {
                    const d = daysLeft(infoModal)
                    if (d < 0) return (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{background:'#fef2f2',color:'#dc2626'}}>Expiré</span>
                    )
                    if (d <= 7) return (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{background:'#fffbeb',color:'#d97706'}}>⚠ {d}j restants</span>
                    )
                    return (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{background:'#f0fdf4',color:'#16a34a'}}>✓ Actif</span>
                    )
                  })()}
                </div>
                <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                  <Clock size={13}/>
                  {infoModal.start_time?.slice(0,5)} – {infoModal.end_time?.slice(0,5)}
                  <span className="text-gray-300">·</span>
                  Chaque {DAYS_LABEL[infoModal.day_of_week]}
                </p>
                {infoModal.player_phone && (
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                    <Phone size={13}/> {infoModal.player_phone}
                  </p>
                )}
                {/* Dates abonnement */}
                {(infoModal.start_date || infoModal.end_date) && (
                  <div className="flex items-center gap-3 mt-3 p-3 rounded-xl" style={{background:'#f9fafb', border:'1px solid #f0f0f0'}}>
                    {infoModal.start_date && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar size={12} className="text-gray-400"/>
                        <span>Début : <strong className="text-gray-800">{new Date(infoModal.start_date).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'})}</strong></span>
                      </div>
                    )}
                    {infoModal.start_date && infoModal.end_date && <span className="text-gray-300">→</span>}
                    {infoModal.end_date && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <CalendarClock size={12} className="text-gray-400"/>
                        <span>Fin : <strong className="text-gray-800">{new Date(infoModal.end_date).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'})}</strong></span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button onClick={() => handleDelete(infoModal.id)}
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                style={{ background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca' }}>
                <Trash2 size={15}/> Supprimer cet abonné
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
