// src/hooks/useOwnerData.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// ─── useOwnerStats ────────────────────────────────────────────
export function useOwnerStats() {
  const { user } = useAuth()
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchStats()
  }, [user])

  async function fetchStats() {
    setLoading(true)
    try {
      // Tous les terrains (actifs + inactifs) pour les revenus complets
      const { data: allStadiums } = await supabase
        .from('stadiums')
        .select('id, is_active')
        .eq('owner_id', user.id)

      const allIds    = allStadiums?.map(s => s.id) || []
      const activeIds = allStadiums?.filter(s => s.is_active).map(s => s.id) || []

      // Filtrer par booking_date (date de la séance) — pas created_at
      const now  = new Date()
      const year = now.getFullYear()
      const mon  = now.getMonth() // 0-indexed

      // Premier jour du mois courant
      const monthStart = `${year}-${String(mon + 1).padStart(2, '0')}-01`
      // Premier jour du mois SUIVANT (évite les dates invalides genre 31 avril)
      const nextMonthDate = new Date(year, mon + 1, 1)
      const monthEndExcl  = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-01`

      // ✅ Inclure tous les terrains (même inactifs) pour les finances
      let bookings = []
      if (allIds.length > 0) {
        const { data } = await supabase
          .from('bookings')
          .select('id, total_price, status, booking_date')
          .in('stadium_id', allIds)
          .gte('booking_date', monthStart)
          .lt('booking_date', monthEndExcl)   // lt = strictement < premier du mois suivant
        bookings = data || []
      }

      const { data: tournaments } = await supabase
        .from('tournaments')
        .select('id, status')
        .eq('owner_id', user.id)
        .in('status', ['open', 'ongoing'])

      const revenue = bookings
        .filter(b => b.status === 'confirmed')
        .reduce((sum, b) => sum + Number(b.total_price || 0), 0)

      const pendingRevenue = bookings
        .filter(b => b.status === 'pending')
        .reduce((sum, b) => sum + Number(b.total_price || 0), 0)

      setStats({
        activeStadiums:    activeIds.length,   // seulement actifs pour le compteur
        totalBookings:     bookings.length,
        monthlyRevenue:    revenue,
        pendingRevenue,
        activeTournaments: tournaments?.length || 0,
      })
    } catch (err) {
      console.error('Erreur stats:', err)
    } finally {
      setLoading(false)
    }
  }

  return { stats, loading, refetch: fetchStats }
}

// ─── useOwnerStadiums ─────────────────────────────────────────
export function useOwnerStadiums() {
  const { user } = useAuth()
  const [stadiums, setStadiums] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    if (!user) return
    fetchStadiums()
  }, [user])

  async function fetchStadiums() {
    setLoading(true)
    const { data, error } = await supabase
      .from('stadiums')
      .select('id, name, city, size, surface, price_per_hour, is_active, images, owner_id, bookings(count), reviews(rating)')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (error) { setError(error.message); setLoading(false); return }

    const enriched = (data || []).map(s => ({
      ...s,
      bookingCount: s.bookings?.[0]?.count || 0,
      avgRating: s.reviews?.length
        ? (s.reviews.reduce((sum, r) => sum + r.rating, 0) / s.reviews.length).toFixed(1)
        : null,
    }))

    setStadiums(enriched)
    setLoading(false)
  }

  async function addStadium(data) {
    const { error } = await supabase
      .from('stadiums').insert({ ...data, owner_id: user.id })
    if (error) throw error
    await fetchStadiums()
  }

  async function updateStadium(id, data) {
    const { error } = await supabase
      .from('stadiums').update(data).eq('id', id).eq('owner_id', user.id)
    if (error) throw error
    await fetchStadiums()
  }

  async function deleteStadium(id) {
    const { error } = await supabase
      .from('stadiums').delete().eq('id', id).eq('owner_id', user.id)
    if (error) throw error
    await fetchStadiums()
  }

  async function toggleStadium(id, currentStatus) {
    await updateStadium(id, { is_active: !currentStatus })
  }

  return {
    stadiums, loading, error,
    addStadium, updateStadium, deleteStadium, toggleStadium,
    refetch: fetchStadiums,
  }
}

// ─── useOwnerBookings ─────────────────────────────────────────
export function useOwnerBookings() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    if (!user) return
    fetchBookings()
  }, [user])

  async function fetchBookings() {
    setLoading(true)

    const { data: stadiums } = await supabase
      .from('stadiums').select('id').eq('owner_id', user.id)

    const stadiumIds = stadiums?.map(s => s.id) || []

    // ✅ Guard
    if (stadiumIds.length === 0) {
      setBookings([])
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('bookings')
      .select('id, booking_date, start_time, end_time, total_price, status, notes, booker_name, booker_phone, created_at, stadium_id, stadiums(name, city), profiles:customer_id(full_name, phone)')
      .in('stadium_id', stadiumIds)
      .order('booking_date', { ascending: false })
      .order('start_time',   { ascending: false })

    if (error) { setError(error.message); setLoading(false); return }
    setBookings(data || [])
    setLoading(false)
  }

  async function confirmBooking(id) {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', id)
      .select('id, status')
    if (error) throw error
    if (!data || data.length === 0) throw new Error('Échec: permission refusée (RLS). Ajoutez la policy UPDATE sur la table bookings.')
    await fetchBookings()
  }

  async function cancelBooking(id) {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select('id, status')
    if (error) throw error
    if (!data || data.length === 0) throw new Error('Échec: permission refusée (RLS). Ajoutez la policy UPDATE sur la table bookings.')
    await fetchBookings()
  }

  return { bookings, loading, error, confirmBooking, cancelBooking, refetch: fetchBookings }
}

// ─── useOwnerTournaments ──────────────────────────────────────
export function useOwnerTournaments() {
  const { user } = useAuth()
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)

  useEffect(() => {
    if (!user) return
    fetchTournaments()
  }, [user])

  async function fetchTournaments() {
    setLoading(true)
    const { data, error } = await supabase
      .from('tournaments')
      .select('id, name, status, start_date, entry_fee, team_size, max_teams, prize_description, owner_id, stadiums(name), tournament_teams(count)')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (error) { setError(error.message); setLoading(false); return }

    const enriched = (data || []).map(t => ({
      ...t,
      teamCount:   t.tournament_teams?.[0]?.count || 0,
      stadiumName: t.stadiums?.name || '',
    }))

    setTournaments(enriched)
    setLoading(false)
  }

  async function createTournament(data) {
    const { error } = await supabase
      .from('tournaments').insert({ ...data, owner_id: user.id })
    if (error) throw error
    await fetchTournaments()
  }

  async function updateTournamentStatus(id, status) {
    const { error } = await supabase
      .from('tournaments').update({ status }).eq('id', id).eq('owner_id', user.id)
    if (error) throw error
    await fetchTournaments()
  }

  async function generateCalendar(tournamentId) {
    const { error } = await supabase.rpc('generer_calendrier', {
      p_tournament_id: tournamentId
    })
    if (error) throw error
  }

  return {
    tournaments, loading, error,
    createTournament, updateTournamentStatus, generateCalendar,
    refetch: fetchTournaments,
  }
}
