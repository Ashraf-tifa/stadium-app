// src/components/TeamsManagementModal.jsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Users, CheckCircle2, XCircle, Clock,
  Shield, Loader2, AlertCircle, ChevronDown
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function TeamsManagementModal({ isOpen, tournament, onClose }) {
  const [teams, setTeams]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')

  useEffect(() => {
    if (isOpen && tournament) loadTeams()
  }, [isOpen, tournament])

  async function loadTeams() {
    setLoading(true)
    const { data } = await supabase
      .from('tournament_teams')
      .select('*, profiles(full_name, phone)')
      .eq('tournament_id', tournament.id)
      .order('registered_at')
    setTeams(data || [])
    setLoading(false)
  }

  async function updateStatus(teamId, status) {
    await supabase
      .from('tournament_teams')
      .update({ status })
      .eq('id', teamId)
    await loadTeams()
  }

  const statuses = ['all', 'pending', 'approved', 'rejected']
  const labels   = { all: 'Tout', pending: 'En attente', approved: 'Acceptées', rejected: 'Refusées' }
  const filtered = filter === 'all' ? teams : teams.filter(t => t.status === filter)

  const counts = {
    pending:  teams.filter(t => t.status === 'pending').length,
    approved: teams.filter(t => t.status === 'approved').length,
    rejected: teams.filter(t => t.status === 'rejected').length,
  }

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
            <div className="h-1 bg-gradient-to-r from-purple-400 to-indigo-600"/>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Users size={17} className="text-purple-600"/>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Gestion des équipes</h2>
                  <p className="text-xs text-gray-400">{tournament?.name}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400">
                <X size={18}/>
              </button>
            </div>

            {/* Stats rapides */}
            <div className="grid grid-cols-3 gap-3 px-6 py-3 border-b border-gray-100 bg-gray-50">
              <div className="text-center">
                <p className="text-lg font-black text-amber-500">{counts.pending}</p>
                <p className="text-xs text-gray-500">En attente</p>
              </div>
              <div className="text-center border-x border-gray-200">
                <p className="text-lg font-black text-green-600">{counts.approved}</p>
                <p className="text-xs text-gray-500">Acceptées</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-red-500">{counts.rejected}</p>
                <p className="text-xs text-gray-500">Refusées</p>
              </div>
            </div>

            {/* Filtres */}
            <div className="flex gap-1.5 px-6 py-3 border-b border-gray-100">
              {statuses.map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    filter === s
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {labels[s]}
                  {s !== 'all' && (
                    <span className={`ml-1 ${filter === s ? 'opacity-70' : 'text-gray-400'}`}>
                      ({s === 'pending' ? counts.pending : s === 'approved' ? counts.approved : counts.rejected})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Liste équipes */}
            <div className="overflow-y-auto" style={{ maxHeight: '50vh' }}>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-purple-500"/>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Users size={28} className="mb-2 opacity-30"/>
                  <p className="text-sm">Aucune équipe</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {filtered.map(team => (
                    <TeamItem
                      key={team.id}
                      team={team}
                      onApprove={() => updateStatus(team.id, 'approved')}
                      onReject={()  => updateStatus(team.id, 'rejected')}
                      maxTeams={tournament?.max_teams}
                      approvedCount={counts.approved}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {counts.approved}/{tournament?.max_teams} équipes acceptées
              </p>
              <button onClick={onClose}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 border-2 border-gray-200 hover:bg-white rounded-2xl transition-all">
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ─── Ligne équipe ─────────────────────────────────────────────
function TeamItem({ team, onApprove, onReject, maxTeams, approvedCount }) {
  const [open, setOpen]         = useState(false)
  const [loadingA, setLoadingA] = useState(false)
  const [loadingR, setLoadingR] = useState(false)

  const isFull    = approvedCount >= maxTeams && team.status !== 'approved'
  const isApproved = team.status === 'approved'
  const isRejected = team.status === 'rejected'
  const isPending  = team.status === 'pending'

  async function handleApprove() {
    setLoadingA(true)
    try { await onApprove() } finally { setLoadingA(false) }
  }
  async function handleReject() {
    setLoadingR(true)
    try { await onReject() } finally { setLoadingR(false) }
  }

  return (
    <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between gap-3">
        {/* Infos équipe */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isApproved ? 'bg-green-100' : isRejected ? 'bg-red-100' : 'bg-amber-100'
          }`}>
            <Shield size={18} className={
              isApproved ? 'text-green-600' : isRejected ? 'text-red-500' : 'text-amber-500'
            }/>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{team.name}</p>
            <p className="text-xs text-gray-500">
              Cap: {team.profiles?.full_name || 'N/A'}
              {team.profiles?.phone && ` · ${team.profiles.phone}`}
            </p>
          </div>
        </div>

        {/* Statut + Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Badge statut */}
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            isApproved ? 'bg-green-100 text-green-700' :
            isRejected ? 'bg-red-100 text-red-600'     :
            'bg-amber-100 text-amber-700'
          }`}>
            {isApproved ? '✓ Acceptée' : isRejected ? '✗ Refusée' : '⏳ Attente'}
          </span>

          {/* Boutons */}
          {isPending && (
            <>
              <button onClick={handleApprove} disabled={loadingA || isFull}
                title={isFull ? 'Tournoi complet' : 'Accepter'}
                className="p-2 text-green-600 hover:bg-green-50 disabled:opacity-40 rounded-xl transition-colors">
                {loadingA ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle2 size={16}/>}
              </button>
              <button onClick={handleReject} disabled={loadingR}
                title="Refuser"
                className="p-2 text-red-500 hover:bg-red-50 disabled:opacity-40 rounded-xl transition-colors">
                {loadingR ? <Loader2 size={16} className="animate-spin"/> : <XCircle size={16}/>}
              </button>
            </>
          )}

          {/* Annuler acceptation */}
          {isApproved && (
            <button onClick={handleReject} disabled={loadingR}
              title="Annuler l'acceptation"
              className="p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500 rounded-xl transition-colors">
              {loadingR ? <Loader2 size={14} className="animate-spin"/> : <XCircle size={14}/>}
            </button>
          )}

          {/* Réaccepter si refusé */}
          {isRejected && (
            <button onClick={handleApprove} disabled={loadingA || isFull}
              title={isFull ? 'Tournoi complet' : 'Accepter quand même'}
              className="p-2 text-gray-400 hover:bg-gray-100 hover:text-green-600 disabled:opacity-40 rounded-xl transition-colors">
              {loadingA ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle2 size={14}/>}
            </button>
          )}

          {/* Voir joueurs */}
          <button onClick={() => setOpen(!open)}
            className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors">
            <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`}/>
          </button>
        </div>
      </div>

      {/* Joueurs (dropdown) */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pl-13">
              {team.players?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pl-13">
                  {team.players.map((p, i) => (
                    <span key={i}
                      className="text-xs px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full font-medium">
                      {i === 0 ? '⭐ ' : ''}{p}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 pl-13">Aucun joueur renseigné</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avertissement tournoi complet */}
      {isFull && isPending && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
          <AlertCircle size={12}/>
          <span>Tournoi complet — refusez une équipe pour libérer une place</span>
        </div>
      )}
    </div>
  )
}
