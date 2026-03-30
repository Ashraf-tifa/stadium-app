// src/pages/customer/CustomerDashboard.jsx
// أضف هذا الـ import في الأعلى:
// import TournamentsPage from './TournamentsPage'

// وأضف هذا في NAV_ITEMS:
// { key: 'tournaments', label: 'Tournois', icon: Trophy },

// وأضف هذا في الـ routing:
// {activeTab === 'tournaments' && <TournamentsPage/>}

// ══════════════════════════════════════════════════════════════
// النسخة الكاملة المحدّثة:
// ══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, MapPin, Star, Clock, Users, Trophy,
  CalendarCheck, LogOut, Menu, X,
  ChevronRight, Building2, Loader2,
  CheckCircle2, XCircle, Home, SlidersHorizontal
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import BookingModal from '../../components/BookingModal'
import { ConfirmModal } from '../../components/Modal'
import TournamentsPage from './TournamentsPage'

const NAV_ITEMS = [
  { key: 'search',      label: 'Terrains',        icon: Home          },
  { key: 'bookings',    label: 'Mes réservations', icon: CalendarCheck },
  { key: 'tournaments', label: 'Tournois',         icon: Trophy        },
]

export default function CustomerDashboard() {
  const [activeTab, setActiveTab]     = useState('search')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0a1a0a] text-white fixed h-full z-30">
        <SidebarContent activeTab={activeTab} setActiveTab={setActiveTab}
          profile={profile} onSignOut={handleSignOut}/>
      </aside>

      {/* Sidebar Mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}/>
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-64 bg-[#0a1a0a] text-white z-50 flex flex-col lg:hidden"
            >
              <button onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white">
                <X size={20}/>
              </button>
              <SidebarContent activeTab={activeTab}
                setActiveTab={(t) => { setActiveTab(t); setSidebarOpen(false) }}
                profile={profile} onSignOut={handleSignOut}/>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Contenu */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500">
              <Menu size={22}/>
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {NAV_ITEMS.find(n => n.key === activeTab)?.label}
              </h1>
              <p className="text-xs text-gray-500">Bonjour, {profile?.full_name || 'Client'} 👋</p>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
            >
              {activeTab === 'search'      && <SearchTab/>}
              {activeTab === 'bookings'    && <BookingsTab/>}
              {activeTab === 'tournaments' && <TournamentsPage/>}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────
function SidebarContent({ activeTab, setActiveTab, profile, onSignOut }) {
  return (
    <>
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-700 rounded-xl flex items-center justify-center">
            <Trophy size={18} className="text-white"/>
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-none">StadiumPro</p>
            <p className="text-xs text-green-400 mt-0.5">Espace client</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-green-600 text-white shadow-lg shadow-green-900/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon size={18}/> <span>{label}</span>
            {activeTab === key && <ChevronRight size={14} className="ml-auto"/>}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {profile?.full_name?.[0]?.toUpperCase() || 'C'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile?.full_name || 'Client'}</p>
            <p className="text-xs text-gray-500">Client</p>
          </div>
        </div>
        <button onClick={onSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
          <LogOut size={16}/> Se déconnecter
        </button>
      </div>
    </>
  )
}

// ─── Onglet Recherche ─────────────────────────────────────────
function SearchTab() {
  const [stadiums, setStadiums]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [cityFilter, setCityFilter]   = useState('')
  const [sizeFilter, setSizeFilter]   = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selected, setSelected]       = useState(null)
  const [cities, setCities]           = useState([])

  useEffect(() => { fetchStadiums() }, [])

  async function fetchStadiums() {
    setLoading(true)
    const { data } = await supabase
      .from('stadiums')
      .select('*, reviews(rating), time_slots(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (data) {
      const enriched = data.map(s => ({
        ...s,
        avgRating: s.reviews?.length
          ? (s.reviews.reduce((sum, r) => sum + r.rating, 0) / s.reviews.length).toFixed(1)
          : null,
        reviewCount: s.reviews?.length || 0,
      }))
      setStadiums(enriched)
      setCities([...new Set(data.map(s => s.city).filter(Boolean))])
    }
    setLoading(false)
  }

  const filtered = stadiums.filter(s => {
    const matchSearch = !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase())
    const matchCity = !cityFilter || s.city === cityFilter
    const matchSize = !sizeFilter || s.size === sizeFilter
    return matchSearch && matchCity && matchSize
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un terrain ou une ville..."
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 bg-white transition-all"/>
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-2 text-sm font-medium ${
            showFilters || cityFilter || sizeFilter
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
          }`}>
          <SlidersHorizontal size={16}/>
          <span className="hidden sm:block">Filtres</span>
          {(cityFilter || sizeFilter) && (
            <span className="w-5 h-5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center">
              {[cityFilter, sizeFilter].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 flex-wrap">
              <div className="flex-1 min-w-36">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ville</label>
                <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500">
                  <option value="">Toutes</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-36">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Format</label>
                <select value={sizeFilter} onChange={e => setSizeFilter(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500">
                  <option value="">Tous</option>
                  {['5v5','7v7','11v11'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {(cityFilter || sizeFilter) && (
                <button onClick={() => { setCityFilter(''); setSizeFilter('') }}
                  className="self-end px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                  Réinitialiser
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-sm text-gray-500">
        {loading ? 'Chargement...' : `${filtered.length} terrain(s) disponible(s)`}
      </p>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-72 bg-white rounded-2xl animate-pulse border border-gray-100"/>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Building2 size={40} className="mb-3 opacity-30"/>
          <p className="text-sm font-medium">Aucun terrain trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s, i) => (
            <motion.div key={s.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all group"
            >
              <div className="h-44 bg-gradient-to-br from-green-800 to-emerald-900 relative overflow-hidden">
                {s.images?.length > 0 ? (
                  <img src={s.images[0]} alt={s.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => { e.target.style.display = 'none' }}/>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 size={48} className="text-white/20"/>
                  </div>
                )}
                <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full bg-black/40 text-white backdrop-blur-sm">
                  {s.size}
                </span>
                {s.avgRating && (
                  <span className="absolute top-3 right-3 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-400 text-amber-900">
                    <Star size={10} fill="currentColor"/> {s.avgRating}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 text-base">{s.name}</h3>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin size={12} className="text-gray-400"/>
                  <p className="text-xs text-gray-500">{s.city}{s.address ? ` · ${s.address}` : ''}</p>
                </div>
                {s.amenities?.length > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {s.amenities.slice(0, 3).map(a => (
                      <span key={a} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {a === 'lighting' ? '💡' : a === 'parking' ? '🚗' : a === 'showers' ? '🚿' : a === 'cafeteria' ? '☕' : a === 'wifi' ? '📶' : '🪑'}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <p className="text-lg font-bold text-gray-900">
                    {s.price_per_hour} <span className="text-sm font-normal text-gray-500">DH/h</span>
                  </p>
                  <button onClick={() => setSelected(s)}
                    className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-green-200">
                    Réserver
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <BookingModal
        isOpen={Boolean(selected)}
        stadium={selected}
        onClose={() => setSelected(null)}
        onSuccess={() => setSelected(null)}
      />
    </div>
  )
}

// ─── Onglet Mes Réservations ──────────────────────────────────
function BookingsTab() {
  const { user } = useAuth()
  const [bookings, setBookings]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [filter, setFilter]               = useState('all')
  const [cancelTarget, setCancelTarget]   = useState(null)
  const [cancelLoading, setCancelLoading] = useState(false)

  useEffect(() => { if (user) fetchBookings() }, [user])

  async function fetchBookings() {
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select('*, stadiums(name, city, images, price_per_hour)')
      .eq('customer_id', user.id)
      .order('booking_date', { ascending: false })
    setBookings(data || [])
    setLoading(false)
  }

  async function handleCancel() {
    if (!cancelTarget) return
    setCancelLoading(true)
    try {
      await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', cancelTarget.id)
      await fetchBookings()
      setCancelTarget(null)
    } catch (e) { console.error(e) }
    finally { setCancelLoading(false) }
  }

  const statuses = ['all', 'pending', 'confirmed', 'cancelled']
  const labels   = { all: 'Tout', pending: 'En attente', confirmed: 'Confirmé', cancelled: 'Annulé' }
  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)

  return (
    <div className="space-y-4">
      <ConfirmModal
        isOpen={Boolean(cancelTarget)}
        type="warning"
        title="Annuler la réservation ?"
        message={`Voulez-vous annuler votre réservation au "${cancelTarget?.stadiums?.name}" le ${cancelTarget?.booking_date} ?`}
        confirmLabel="Oui, annuler"
        cancelLabel="Non, garder"
        loading={cancelLoading}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />

      <div className="flex gap-2 flex-wrap">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === s ? 'bg-green-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}>
            {labels[s]}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${filter === s ? 'bg-white/20' : 'bg-gray-100'}`}>
              {s === 'all' ? bookings.length : bookings.filter(b => b.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-gray-100"/>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <CalendarCheck size={40} className="mb-3 opacity-30"/>
          <p className="text-sm font-medium">Aucune réservation</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b, i) => (
            <motion.div key={b.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="flex items-center gap-4 p-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-green-800 to-emerald-900 flex-shrink-0">
                  {b.stadiums?.images?.[0] ? (
                    <img src={b.stadiums.images[0]} alt="" className="w-full h-full object-cover"
                      onError={e => { e.target.style.display = 'none' }}/>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 size={24} className="text-white/30"/>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-gray-900 truncate">{b.stadiums?.name}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-gray-400"/>
                        <p className="text-xs text-gray-500">{b.stadiums?.city}</p>
                      </div>
                    </div>
                    <StatusBadge status={b.status}/>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <CalendarCheck size={12} className="text-green-600"/>
                      <span>{b.booking_date}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Clock size={12} className="text-blue-500"/>
                      <span>{b.start_time?.slice(0,5)} – {b.end_time?.slice(0,5)}</span>
                    </div>
                    <div className="text-xs font-bold text-gray-900 ml-auto">{b.total_price} DH</div>
                  </div>
                  {b.status === 'pending' && (
                    <button onClick={() => setCancelTarget(b)}
                      className="mt-2 text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                      <XCircle size={12}/> Annuler
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const config = {
    confirmed: { label: 'Confirmé',   color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    pending:   { label: 'En attente', color: 'bg-amber-100 text-amber-700', icon: Clock        },
    cancelled: { label: 'Annulé',     color: 'bg-red-100 text-red-600',     icon: XCircle      },
  }
  const c = config[status] || config.pending
  const Icon = c.icon
  return (
    <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${c.color}`}>
      <Icon size={11}/> {c.label}
    </span>
  )
}
