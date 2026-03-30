// src/components/NotificationsPanel.jsx
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, CalendarCheck, Users, Check, Loader2, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    if (!user) return
    fetchNotifications()
    const channel = supabase.channel('notifs_v4')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' },
        () => fetchNotifications())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tournament_teams' },
        () => fetchNotifications())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

  async function fetchNotifications() {
    if (!user) return
    setLoading(true)

    const { data: stadiums } = await supabase
      .from('stadiums').select('id').eq('owner_id', user.id)
    const stadiumIds = stadiums?.map(s => s.id) || []

    const { data: myTournaments } = await supabase
      .from('tournaments').select('id, name').eq('owner_id', user.id)
    const tournamentIds = myTournaments?.map(t => t.id) || []

    const notifs = []

    // ── Réservations EN ATTENTE uniquement ────────────────────
    if (stadiumIds.length > 0) {
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          id, booking_date, start_time, end_time, total_price, created_at,
          profiles:customer_id(full_name),
          stadiums(name)
        `)
        .in('stadium_id', stadiumIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10)

      bookings?.forEach(b => {
        notifs.push({
          id:         `book-${b.id}`,
          title:      'Réservation à confirmer',
          message:    `${b.profiles?.full_name || 'Un client'} — ${b.stadiums?.name || ''}`,
          detail:     `${b.booking_date} · ${b.start_time?.slice(0,5)}–${b.end_time?.slice(0,5)} · ${b.total_price} DH`,
          time:       b.created_at,
          icon:       'booking',
          navigateTo: 'bookings',  // ← tab cible
          read:       false,
        })
      })
    }

    // ── Équipes EN ATTENTE uniquement ─────────────────────────
    if (tournamentIds.length > 0) {
      const { data: teams } = await supabase
        .from('tournament_teams')
        .select(`
          id, name, registered_at,
          tournaments(name),
          profiles:captain_id(full_name)
        `)
        .in('tournament_id', tournamentIds)
        .eq('status', 'pending')
        .order('registered_at', { ascending: false })
        .limit(10)

      teams?.forEach(t => {
        notifs.push({
          id:         `team-${t.id}`,
          title:      'Équipe à valider',
          message:    `"${t.name}" veut rejoindre`,
          detail:     t.tournaments?.name || '',
          time:       t.registered_at,
          icon:       'team',
          navigateTo: 'tournaments', // ← tab cible
          read:       false,
        })
      })
    }

    notifs.sort((a, b) => new Date(b.time) - new Date(a.time))
    setNotifications(notifs)
    setLoading(false)
  }

  const unreadCount = notifications.filter(n => !n.read).length

  function markRead(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return { notifications, loading, unreadCount, markRead, markAllRead, refetch: fetchNotifications }
}

// ─── Composant ────────────────────────────────────────────────
export default function NotificationsPanel({ onNavigate }) {
  const [open, setOpen] = useState(false)
  const { notifications, loading, unreadCount, markRead, markAllRead } = useNotifications()
  const panelRef = useRef()

  useEffect(() => {
    function handle(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  function handleClick(n) {
    // 1. Marquer comme lu
    markRead(n.id)
    // 2. Naviguer vers le bon tab
    if (n.navigateTo && onNavigate) {
      onNavigate(n.navigateTo)
      setOpen(false)
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bouton cloche */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
      >
        <Bell size={18}/>
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Panneau */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{ opacity: 0,   y: 6,  scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 w-80 bg-white rounded-2xl z-50 overflow-hidden"
            style={{ border: '1px solid #f0f0f0', boxShadow: '0 8px 40px rgba(0,0,0,0.1)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5"
              style={{ borderBottom: '1px solid #f5f5f5' }}>
              <div>
                <p className="font-black text-gray-900 text-sm">À traiter</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {unreadCount > 0 ? `${unreadCount} action(s) requise(s)` : 'Tout est à jour 🎉'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-bold transition-colors">
                    <Check size={11}/> Tout lire
                  </button>
                )}
                <button onClick={() => setOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={15}/>
                </button>
              </div>
            </div>

            {/* Liste */}
            <div className="overflow-y-auto" style={{ maxHeight: 380 }}>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={20} className="animate-spin text-gray-300"/>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                  <Check size={32} className="mb-2"/>
                  <p className="text-sm font-black text-gray-400">Tout est à jour !</p>
                  <p className="text-xs mt-1">Aucune action requise</p>
                </div>
              ) : (
                notifications.map((n, i) => {
                  const isBooking = n.icon === 'booking'
                  return (
                    <motion.div key={n.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => handleClick(n)}
                      className="flex items-start gap-3 px-4 py-4 cursor-pointer transition-all group"
                      style={{
                        borderBottom: '1px solid #f5f5f5',
                        background: n.read ? 'white' : '#fffef7',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = n.read ? 'white' : '#fffef7'}
                    >
                      {/* Icône */}
                      <div className="relative shrink-0 mt-0.5">
                        <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
                          style={{ background: isBooking ? '#eff6ff' : '#f5f3ff' }}>
                          {isBooking
                            ? <CalendarCheck size={16} style={{ color: '#2563eb' }}/>
                            : <Users         size={16} style={{ color: '#7c3aed' }}/>
                          }
                        </div>
                        {/* Point non lu */}
                        {!n.read && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"/>
                        )}
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className={`text-xs leading-tight ${n.read ? 'font-semibold text-gray-600' : 'font-black text-gray-900'}`}>
                            {n.title}
                          </p>
                          <span className="text-xs text-gray-300 shrink-0 font-medium">
                            {formatTime(n.time)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 font-medium">{n.message}</p>
                        {n.detail && (
                          <p className="text-xs text-gray-400 mt-0.5">{n.detail}</p>
                        )}
                        {/* Lien d'action */}
                        <p className="text-xs mt-1.5 font-bold flex items-center gap-1 transition-colors"
                          style={{ color: isBooking ? '#2563eb' : '#7c3aed' }}>
                          {isBooking ? 'Aller aux réservations' : 'Aller aux tournois'}
                          <ArrowRight size={10}/>
                        </p>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            {notifications.some(n => !n.read) && (
              <div className="px-4 py-3 flex items-center gap-2"
                style={{ borderTop: '1px solid #fef3c7', background: '#fffbeb' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"/>
                <p className="text-xs text-amber-700 font-semibold">
                  {notifications.filter(n => !n.read).length} action(s) en attente · Cliquez pour traiter
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)     return 'À l\'instant'
  if (diff < 3600)   return `${Math.floor(diff/60)} min`
  if (diff < 86400)  return `${Math.floor(diff/3600)}h`
  if (diff < 604800) return `${Math.floor(diff/86400)}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
