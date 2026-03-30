// src/pages/customer/TournamentsPage.jsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Users, Calendar, MapPin, ChevronRight,
  X, CheckCircle2, AlertCircle, Loader2, Star,
  Shield, Clock, DollarSign, Info, ChevronDown
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

// ─── Page principale ──────────────────────────────────────────
export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState(null) // tournoi sélectionné

  useEffect(() => { fetchTournaments() }, [])

  async function fetchTournaments() {
    setLoading(true)
    const { data } = await supabase
      .from('tournaments')
      .select(`
        *,
        stadiums(name, city, images),
        tournament_teams(count)
      `)
      .in('status', ['open', 'ongoing', 'finished'])
      .order('created_at', { ascending: false })

    const enriched = (data || []).map(t => ({
      ...t,
      teamCount:   t.tournament_teams?.[0]?.count || 0,
      stadiumName: t.stadiums?.name  || '',
      stadiumCity: t.stadiums?.city  || '',
      stadiumImg:  t.stadiums?.images?.[0] || null,
    }))
    setTournaments(enriched)
    setLoading(false)
  }

  if (selected) {
    return (
      <TournamentDetail
        tournament={selected}
        onBack={() => { setSelected(null); fetchTournaments() }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        {loading ? 'Chargement...' : `${tournaments.length} tournoi(s) disponible(s)`}
      </p>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-white rounded-2xl animate-pulse border border-gray-100"/>)}
        </div>
      ) : tournaments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Trophy size={40} className="mb-3 opacity-30"/>
          <p className="text-sm font-medium">Aucun tournoi disponible</p>
          <p className="text-xs mt-1">Revenez plus tard</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tournaments.map((t, i) => (
            <motion.div key={t.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer group"
              onClick={() => setSelected(t)}
            >
              {/* Image terrain */}
              <div className="h-36 bg-gradient-to-br from-purple-800 to-indigo-900 relative overflow-hidden">
                {t.stadiumImg ? (
                  <img src={t.stadiumImg} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-60"/>
                ) : null}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Trophy size={48} className="text-white/20"/>
                </div>
                <div className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full ${
                  t.status === 'open'     ? 'bg-blue-500 text-white'   :
                  t.status === 'ongoing'  ? 'bg-green-500 text-white'  :
                  'bg-purple-500 text-white'
                }`}>
                  {t.status === 'open' ? 'Inscriptions ouvertes' : t.status === 'ongoing' ? 'En cours' : 'Terminé'}
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-bold text-gray-900">{t.name}</h3>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin size={11} className="text-gray-400"/>
                  <p className="text-xs text-gray-500">{t.stadiumName} · {t.stadiumCity}</p>
                </div>

                {/* Progress */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Équipes</span>
                    <span className="font-semibold">{t.teamCount}/{t.max_teams}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${Math.round((t.teamCount/t.max_teams)*100)}%` }}/>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{t.team_size}v{t.team_size}</span>
                    <span>·</span>
                    <span>{t.entry_fee > 0 ? `${t.entry_fee} DH` : 'Gratuit'}</span>
                  </div>
                  <span className="text-xs text-purple-600 font-semibold flex items-center gap-1">
                    Voir <ChevronRight size={13}/>
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Détail tournoi ───────────────────────────────────────────
function TournamentDetail({ tournament: t, onBack }) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('info')
  const [teams, setTeams]         = useState([])
  const [matches, setMatches]     = useState([])
  const [standings, setStandings] = useState([])
  const [myTeam, setMyTeam]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [showRegister, setShowRegister] = useState(false)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [teamsRes, matchesRes, standingsRes] = await Promise.all([
      supabase.from('tournament_teams')
        .select('*, profiles(full_name)')
        .eq('tournament_id', t.id)
        .order('registered_at'),
      supabase.from('tournament_matches')
        .select('*, home:home_team_id(name), away:away_team_id(name)')
        .eq('tournament_id', t.id)
        .order('round'),
      supabase.from('tournament_standings')
        .select('*, tournament_teams(name)')
        .eq('tournament_id', t.id)
        .order('points', { ascending: false })
        .order('goal_diff', { ascending: false }),
    ])

    setTeams(teamsRes.data || [])
    setMatches(matchesRes.data || [])
    setStandings(standingsRes.data || [])

    // Vérifier si l'utilisateur a déjà une équipe
    const mine = teamsRes.data?.find(tm => tm.captain_id === user?.id)
    setMyTeam(mine || null)
    setLoading(false)
  }

  const TABS = [
    { key: 'info',      label: 'Infos'     },
    { key: 'teams',     label: `Équipes (${teams.length})`   },
    { key: 'matches',   label: 'Matchs'    },
    { key: 'standings', label: 'Classement'},
  ]

  return (
    <div className="space-y-4">
      {/* Header retour */}
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
          <ChevronRight size={20} className="rotate-180"/>
        </button>
        <div>
          <h2 className="font-bold text-gray-900">{t.name}</h2>
          <p className="text-xs text-gray-500">{t.stadiumName} · {t.stadiumCity}</p>
        </div>
        <div className={`ml-auto text-xs font-bold px-3 py-1.5 rounded-full ${
          t.status === 'open'     ? 'bg-blue-100 text-blue-700'   :
          t.status === 'ongoing'  ? 'bg-green-100 text-green-700' :
          'bg-purple-100 text-purple-700'
        }`}>
          {t.status === 'open' ? 'Inscriptions' : t.status === 'ongoing' ? 'En cours' : 'Terminé'}
        </div>
      </div>

      {/* Bouton s'inscrire */}
      {t.status === 'open' && !myTeam && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="font-bold text-white text-sm">Inscrivez votre équipe !</p>
            <p className="text-xs text-purple-200 mt-0.5">
              {t.max_teams - (teams.filter(tm => tm.status !== 'rejected').length)} place(s) restante(s)
            </p>
          </div>
          <button onClick={() => setShowRegister(true)}
            className="px-4 py-2.5 bg-white text-purple-700 font-bold text-sm rounded-xl hover:bg-purple-50 transition-colors shadow-sm">
            S'inscrire
          </button>
        </motion.div>
      )}

      {/* Mon équipe */}
      {myTeam && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className={`rounded-2xl p-4 border flex items-center gap-3 ${
            myTeam.status === 'approved' ? 'bg-green-50 border-green-200' :
            myTeam.status === 'rejected' ? 'bg-red-50 border-red-200'    :
            'bg-amber-50 border-amber-200'
          }`}>
          <Shield size={20} className={
            myTeam.status === 'approved' ? 'text-green-600' :
            myTeam.status === 'rejected' ? 'text-red-500'   : 'text-amber-500'
          }/>
          <div>
            <p className="font-bold text-gray-900 text-sm">Mon équipe : {myTeam.name}</p>
            <p className={`text-xs font-medium ${
              myTeam.status === 'approved' ? 'text-green-600' :
              myTeam.status === 'rejected' ? 'text-red-500'   : 'text-amber-600'
            }`}>
              {myTeam.status === 'approved' ? '✓ Équipe acceptée' :
               myTeam.status === 'rejected' ? '✗ Équipe refusée'  :
               '⏳ En attente de validation'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === key ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-purple-600"/>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
          >
            {activeTab === 'info'      && <InfoTab tournament={t}/>}
            {activeTab === 'teams'     && <TeamsTab teams={teams}/>}
            {activeTab === 'matches'   && <MatchesTab matches={matches}/>}
            {activeTab === 'standings' && <StandingsTab standings={standings}/>}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Modal inscription */}
      <RegisterTeamModal
        isOpen={showRegister}
        tournament={t}
        onClose={() => setShowRegister(false)}
        onSuccess={() => { setShowRegister(false); loadAll() }}
      />
    </div>
  )
}

// ─── Tab Infos ────────────────────────────────────────────────
function InfoTab({ tournament: t }) {
  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        {t.description && (
          <p className="text-sm text-gray-600 leading-relaxed">{t.description}</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Début',         value: t.start_date,            icon: Calendar    },
            { label: 'Fin',           value: t.end_date,              icon: Calendar    },
            { label: "Limite d'inscription", value: t.registration_deadline, icon: Clock },
            { label: 'Format',        value: `${t.team_size}v${t.team_size}`, icon: Users },
            { label: 'Max équipes',   value: `${t.max_teams} équipes`, icon: Shield     },
            { label: 'Inscription',   value: t.entry_fee > 0 ? `${t.entry_fee} DH` : 'Gratuit', icon: DollarSign },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={12} className="text-purple-500"/>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
              </div>
              <p className="text-sm font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>
        {t.prize_description && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
            <Star size={16} className="text-amber-500 mt-0.5 shrink-0" fill="currentColor"/>
            <div>
              <p className="text-xs font-bold text-amber-800 mb-0.5">Récompense</p>
              <p className="text-sm text-amber-700">{t.prize_description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab Équipes ──────────────────────────────────────────────
function TeamsTab({ teams }) {
  const approved = teams.filter(t => t.status === 'approved')
  const pending  = teams.filter(t => t.status === 'pending')

  return (
    <div className="space-y-3">
      {approved.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-green-50">
            <p className="text-xs font-bold text-green-700">✓ Équipes acceptées ({approved.length})</p>
          </div>
          {approved.map((team, i) => <TeamRow key={team.id} team={team} rank={i+1}/>)}
        </div>
      )}
      {pending.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-amber-50">
            <p className="text-xs font-bold text-amber-700">⏳ En attente ({pending.length})</p>
          </div>
          {pending.map(team => <TeamRow key={team.id} team={team}/>)}
        </div>
      )}
      {teams.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Users size={32} className="mb-2 opacity-30"/>
          <p className="text-sm">Aucune équipe inscrite pour le moment</p>
        </div>
      )}
    </div>
  )
}

function TeamRow({ team, rank }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-50 last:border-0">
      <div className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3">
          {rank && (
            <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center text-xs font-bold text-purple-700">
              {rank}
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-gray-900">{team.name}</p>
            <p className="text-xs text-gray-500">
              Capitaine: {team.profiles?.full_name || 'N/A'}
            </p>
          </div>
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}/>
      </div>
      {open && team.players?.length > 0 && (
        <div className="px-5 pb-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">Joueurs :</p>
          <div className="flex flex-wrap gap-1.5">
            {team.players.map((p, i) => (
              <span key={i} className="text-xs px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full font-medium">
                {p}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab Matchs ───────────────────────────────────────────────
function MatchesTab({ matches }) {
  // Grouper par round
  const rounds = matches.reduce((acc, m) => {
    if (!acc[m.round]) acc[m.round] = []
    acc[m.round].push(m)
    return acc
  }, {})

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Calendar size={32} className="mb-2 opacity-30"/>
        <p className="text-sm">Le calendrier n'est pas encore généré</p>
        <p className="text-xs mt-1">Il sera disponible au lancement du tournoi</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {Object.entries(rounds).map(([round, roundMatches]) => (
        <div key={round} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-600">Journée {round}</p>
          </div>
          {roundMatches.map(m => (
            <div key={m.id} className="flex items-center px-5 py-4 border-b border-gray-50 last:border-0">
              {/* Équipe domicile */}
              <div className="flex-1 text-right">
                <p className="text-sm font-bold text-gray-900">{m.home?.name || '—'}</p>
              </div>

              {/* Score */}
              <div className="mx-4 flex items-center gap-2">
                {m.status === 'finished' ? (
                  <div className="flex items-center gap-1.5">
                    <span className={`text-lg font-black ${m.home_score > m.away_score ? 'text-green-600' : 'text-gray-400'}`}>
                      {m.home_score}
                    </span>
                    <span className="text-gray-300 font-bold">—</span>
                    <span className={`text-lg font-black ${m.away_score > m.home_score ? 'text-green-600' : 'text-gray-400'}`}>
                      {m.away_score}
                    </span>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 bg-gray-100 rounded-xl">
                    <p className="text-xs font-bold text-gray-500">
                      {m.status === 'ongoing' ? '🔴 En direct' : m.match_date ? new Date(m.match_date).toLocaleDateString('fr-FR', { day:'numeric', month:'short' }) : 'À planifier'}
                    </p>
                  </div>
                )}
              </div>

              {/* Équipe extérieure */}
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-gray-900">{m.away?.name || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Tab Classement ───────────────────────────────────────────
function StandingsTab({ standings }) {
  if (standings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Trophy size={32} className="mb-2 opacity-30"/>
        <p className="text-sm">Classement disponible après le lancement</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* En-tête */}
      <div className="grid grid-cols-12 gap-1 px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-4">Équipe</div>
        <div className="col-span-1 text-center">J</div>
        <div className="col-span-1 text-center">V</div>
        <div className="col-span-1 text-center">N</div>
        <div className="col-span-1 text-center">D</div>
        <div className="col-span-1 text-center">Diff</div>
        <div className="col-span-2 text-center font-black text-purple-600">Pts</div>
      </div>

      {standings.map((s, i) => (
        <div key={s.id}
          className={`grid grid-cols-12 gap-1 px-4 py-3 border-b border-gray-50 last:border-0 items-center ${
            i === 0 ? 'bg-amber-50' : i === 1 ? 'bg-gray-50/50' : ''
          }`}>
          <div className="col-span-1 text-center">
            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (
              <span className="text-xs font-bold text-gray-400">{i+1}</span>
            )}
          </div>
          <div className="col-span-4">
            <p className="text-sm font-bold text-gray-900 truncate">
              {s.tournament_teams?.name || '—'}
            </p>
          </div>
          <div className="col-span-1 text-center text-xs text-gray-600">{s.played}</div>
          <div className="col-span-1 text-center text-xs text-green-600 font-semibold">{s.won}</div>
          <div className="col-span-1 text-center text-xs text-gray-500">{s.drawn}</div>
          <div className="col-span-1 text-center text-xs text-red-500">{s.lost}</div>
          <div className="col-span-1 text-center text-xs text-gray-600">
            {s.goal_diff > 0 ? `+${s.goal_diff}` : s.goal_diff}
          </div>
          <div className="col-span-2 text-center">
            <span className="text-sm font-black text-purple-600">{s.points}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Modal inscription équipe ─────────────────────────────────
function RegisterTeamModal({ isOpen, tournament, onClose, onSuccess }) {
  const { user } = useAuth()
  const [teamName, setTeamName]   = useState('')
  const [players, setPlayers]     = useState(['', '', '', '', ''])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => {
    if (isOpen) {
      setTeamName(''); setError('')
      // Initialiser avec le bon nombre de joueurs
      setPlayers(Array(tournament?.team_size || 5).fill(''))
    }
  }, [isOpen, tournament])

  function updatePlayer(i, val) {
    setPlayers(p => p.map((v, idx) => idx === i ? val : v))
  }

  async function handleSubmit() {
    if (!teamName.trim()) { setError("Le nom de l'équipe est obligatoire."); return }
    const filledPlayers = players.filter(p => p.trim())
    if (filledPlayers.length < 1) { setError("Ajoutez au moins un joueur."); return }

    setError(''); setLoading(true)
    try {
      const { error } = await supabase.from('tournament_teams').insert({
        tournament_id: tournament.id,
        captain_id:    user.id,
        name:          teamName.trim(),
        players:       filledPlayers,
        status:        'pending',
      })
      if (error) throw error
      onSuccess?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
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
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="h-1 bg-gradient-to-r from-purple-400 to-indigo-600"/>

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Shield size={17} className="text-purple-600"/>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Inscrire mon équipe</h2>
                  <p className="text-xs text-gray-400">{tournament?.name}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400">
                <X size={18}/>
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-4" style={{ maxHeight: '60vh' }}>
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5 text-xs">
                    <AlertCircle size={13}/> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Nom équipe */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Nom de l'équipe *
                </label>
                <input value={teamName} onChange={e => setTeamName(e.target.value)}
                  placeholder="Ex: Les Lions de Casablanca"
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 bg-white transition-all"/>
              </div>

              {/* Joueurs */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Noms des joueurs ({players.length} joueurs)
                </label>
                <div className="space-y-2">
                  {players.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-bold text-purple-600 shrink-0">
                        {i+1}
                      </span>
                      <input value={p} onChange={e => updatePlayer(i, e.target.value)}
                        placeholder={i === 0 ? 'Capitaine (vous)' : `Joueur ${i+1}`}
                        className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 bg-white transition-all"/>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <Info size={13} className="text-blue-500 mt-0.5 shrink-0"/>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Votre inscription sera envoyée au propriétaire du terrain pour validation. Vous serez notifié une fois accepté.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button onClick={onClose}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 border-2 border-gray-200 hover:bg-white rounded-2xl transition-all">
                Annuler
              </button>
              <button onClick={handleSubmit} disabled={loading}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-60 rounded-2xl transition-all shadow-sm shadow-purple-200 flex items-center gap-2">
                {loading
                  ? <><Loader2 size={15} className="animate-spin"/> Envoi...</>
                  : <><CheckCircle2 size={15}/> Envoyer la demande</>
                }
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
