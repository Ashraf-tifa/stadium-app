// src/pages/owner/PaymentsPage.jsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowDownLeft, ArrowUpRight, Search, Filter,
  Plus, Loader2, CheckCircle2, Clock, XCircle,
  X, AlertCircle, ChevronLeft, ChevronRight,
  Building2, CreditCard, Wallet, TrendingUp
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const ITEMS_PER_PAGE = 8

export default function PaymentsPage() {
  const { user, loading: authLoading }      = useAuth()
  const [transactions, setTransactions]     = useState([])
  const [loading, setLoading]               = useState(true)
  const [tab, setTab]                       = useState('all')     // all | deposit | withdrawal
  const [statusFilter, setStatusFilter]     = useState('')
  const [search, setSearch]                 = useState('')
  const [page, setPage]                     = useState(1)
  const [showDeposit, setShowDeposit]       = useState(false)
  const [showWithdrawal, setShowWithdrawal] = useState(false)
  const [balance, setBalance]               = useState(0)

  useEffect(() => {
    if (authLoading) return
    if (user) { fetchTransactions(); fetchBalance() }
    else setLoading(false)
  }, [user, authLoading])

  async function fetchTransactions() {
    setLoading(true)
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
    setTransactions(data || [])
    setLoading(false)
  }

  async function fetchBalance() {
    const { data } = await supabase
      .from('transactions')
      .select('amount, type, status')
      .eq('owner_id', user.id)
      .eq('status', 'confirmed')
    let bal = 0
    data?.forEach(t => {
      if (t.type === 'deposit')    bal += Number(t.amount)
      if (t.type === 'withdrawal') bal -= Number(t.amount)
    })
    setBalance(bal)
  }

  // Filtres
  const filtered = transactions.filter(t => {
    const matchTab    = tab === 'all' || t.type === tab
    const matchStatus = !statusFilter || t.status === statusFilter
    const matchSearch = !search ||
      t.transaction_no?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchStatus && matchSearch
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  return (
    <div className="space-y-5">

      {/* Modals */}
      <DepositModal    isOpen={showDeposit}     onClose={() => setShowDeposit(false)}    onSuccess={() => { fetchTransactions(); fetchBalance() }}/>
      <WithdrawalModal isOpen={showWithdrawal}  onClose={() => setShowWithdrawal(false)} onSuccess={() => { fetchTransactions(); fetchBalance() }}/>

      {/* ── Résumé solde ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label:  'Solde disponible',
            value:  `${balance.toLocaleString()} DH`,
            icon:   Wallet,
            color:  '#16a34a',
            bg:     '#f0fdf4',
            accent: '#16a34a',
          },
          {
            label:  'Total déposé',
            value:  `${transactions.filter(t=>t.type==='deposit'&&t.status==='confirmed').reduce((s,t)=>s+Number(t.amount),0).toLocaleString()} DH`,
            icon:   ArrowDownLeft,
            color:  '#2563eb',
            bg:     '#eff6ff',
            accent: '#2563eb',
          },
          {
            label:  'Total retiré',
            value:  `${transactions.filter(t=>t.type==='withdrawal'&&t.status==='confirmed').reduce((s,t)=>s+Number(t.amount),0).toLocaleString()} DH`,
            icon:   ArrowUpRight,
            color:  '#d97706',
            bg:     '#fffbeb',
            accent: '#d97706',
          },
        ].map(({ label, value, icon: Icon, color, bg, accent }, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white rounded-2xl p-5 relative overflow-hidden"
            style={{ border: '1px solid #f0f0f0' }}>
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: accent }}/>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon size={18} style={{ color }}/>
              </div>
              <TrendingUp size={13} className="text-gray-300 mt-1"/>
            </div>
            <p className="text-2xl font-black text-gray-900">{loading ? '...' : value}</p>
            <p className="text-xs text-gray-400 font-semibold mt-1.5 uppercase tracking-wide">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── En-tête avec boutons ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-black text-gray-900 text-lg">Transactions</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowWithdrawal(true)}
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 hover:border-gray-900 text-gray-700 hover:text-gray-900 text-sm font-bold rounded-xl transition-all">
            <ArrowUpRight size={15}/> Request withdrawal
          </button>
          <button onClick={() => setShowDeposit(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-colors">
            <Plus size={15}/> Add deposit
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f0' }}>

        {/* Filtres */}
        <div className="flex items-center gap-3 px-5 py-4 flex-wrap" style={{ borderBottom: '1px solid #f5f5f5' }}>
          {/* Tabs Transfer / Withdrawal / All */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
            {[
              { key: 'all',        label: 'Tout'       },
              { key: 'deposit',    label: 'Transfer'   },
              { key: 'withdrawal', label: 'Operational'},
            ].map(({ key, label }) => (
              <button key={key} onClick={() => { setTab(key); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {label}
              </button>
            ))}
          </div>

          {/* Filtre statut */}
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 outline-none focus:border-gray-900 bg-white">
            <option value="">Filter by status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Recherche */}
          <div className="flex-1 min-w-48 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search By transaction NO..."
              className="w-full pl-8 pr-4 py-2 rounded-xl text-xs border border-gray-200 outline-none focus:border-gray-900 text-gray-700 font-medium placeholder-gray-400"/>
          </div>
        </div>

        {/* En-tête colonnes */}
        <div className="grid grid-cols-12 gap-2 px-5 py-3 text-xs font-black text-gray-400 uppercase tracking-wide"
          style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
          <div className="col-span-3">Transaction No</div>
          <div className="col-span-4">Description</div>
          <div className="col-span-1 text-right">Amount</div>
          <div className="col-span-2 text-center">Created At</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-1 text-center">State</div>
        </div>

        {/* Lignes */}
        {loading ? (
          <div className="divide-y divide-gray-50">
            {[1,2,3,4].map(i => (
              <div key={i} className="grid grid-cols-12 gap-2 px-5 py-4">
                <div className="col-span-3 h-3 bg-gray-100 rounded animate-pulse"/>
                <div className="col-span-4 h-3 bg-gray-100 rounded animate-pulse"/>
                <div className="col-span-1 h-3 bg-gray-100 rounded animate-pulse"/>
                <div className="col-span-2 h-3 bg-gray-100 rounded animate-pulse"/>
                <div className="col-span-1 h-3 bg-gray-100 rounded animate-pulse"/>
                <div className="col-span-1 h-3 bg-gray-100 rounded animate-pulse"/>
              </div>
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300">
            <CreditCard size={28} className="mb-2"/>
            <p className="text-sm font-semibold">Aucune transaction trouvée</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {paginated.map((t, i) => (
              <motion.div key={t.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-12 gap-2 px-5 py-4 items-center hover:bg-gray-50 transition-colors">
                {/* Transaction No */}
                <div className="col-span-3">
                  <p className="text-sm font-bold text-gray-900 font-mono">{t.transaction_no}</p>
                </div>
                {/* Description */}
                <div className="col-span-4">
                  <p className="text-sm text-gray-600">{t.description || (t.type === 'deposit' ? 'Adding Balance To Your Account.' : 'Withdrawal Request.')}</p>
                </div>
                {/* Amount */}
                <div className="col-span-1 text-right">
                  <span className="text-sm font-black text-gray-900 px-2 py-1 bg-gray-100 rounded-lg">
                    {Number(t.amount).toLocaleString()} DH
                  </span>
                </div>
                {/* Date */}
                <div className="col-span-2 text-center">
                  <p className="text-xs text-gray-500 font-medium">
                    {new Date(t.created_at).toISOString().slice(0,10)}
                  </p>
                </div>
                {/* Type badge */}
                <div className="col-span-1 text-center">
                  <span className="text-xs font-bold px-2 py-1 rounded-full"
                    style={t.type === 'deposit'
                      ? { background: '#dbeafe', color: '#1d4ed8' }
                      : { background: '#fce7f3', color: '#be185d' }}>
                    {t.type === 'deposit' ? 'DEPOSIT' : 'WITHDRAW'}
                  </span>
                </div>
                {/* State */}
                <div className="col-span-1 text-center">
                  <StateBadge status={t.status}/>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-5 py-4"
            style={{ borderTop: '1px solid #f5f5f5' }}>
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
              className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 disabled:opacity-30 transition-all">
              <ChevronLeft size={15}/>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i+1).map(n => (
              <button key={n} onClick={() => setPage(n)}
                className={`w-8 h-8 rounded-xl text-sm font-bold transition-all ${
                  page === n ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-500 hover:border-gray-900'
                }`}>{n}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
              className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 disabled:opacity-30 transition-all">
              <ChevronRight size={15}/>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Badge état ───────────────────────────────────────────────
function StateBadge({ status }) {
  const C = {
    confirmed: { label: 'CONFIRMED', bg: '#dcfce7', color: '#15803d'  },
    pending:   { label: 'PENDING',   bg: '#fef9c3', color: '#a16207'  },
    rejected:  { label: 'REJECTED',  bg: '#fee2e2', color: '#dc2626'  },
  }
  const c = C[status] || C.pending
  return (
    <span className="text-xs font-black px-2 py-1 rounded-full"
      style={{ background: c.bg, color: c.color }}>
      {c.label}
    </span>
  )
}

// ─── Modal Add Deposit ────────────────────────────────────────
function DepositModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth()
  const [amount, setAmount]       = useState('')
  const [note, setNote]           = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => { if (isOpen) { setAmount(''); setNote(''); setError('') } }, [isOpen])

  async function handleSubmit() {
    if (!amount || Number(amount) <= 0) { setError('Montant invalide.'); return }
    setError(''); setLoading(true)
    try {
      const txNo = `Tran-${Date.now()}`
      const { error } = await supabase.from('transactions').insert({
        owner_id:       user.id,
        transaction_no: txNo,
        type:           'deposit',
        amount:         Number(amount),
        status:         'pending',
        description:    note || 'Adding Balance To Your Account.',
      })
      if (error) throw error
      onSuccess?.()
      onClose()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Add Deposit" accent="#16a34a">
      <div className="space-y-4">
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5 text-xs">
              <AlertCircle size={13}/> {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-1.5">
            Montant (DH) *
          </label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="Ex: 500"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 text-sm font-bold text-gray-900 outline-none transition-all bg-gray-50 focus:bg-white"/>
        </div>

        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-1.5">
            Note (optionnel)
          </label>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="Description du dépôt..." rows={2}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 text-sm text-gray-700 outline-none transition-all resize-none bg-gray-50 focus:bg-white"/>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <p className="text-xs font-bold text-green-800 mb-1">ℹ️ Informations</p>
          <p className="text-xs text-green-700 leading-relaxed">
            Votre demande de dépôt sera traitée manuellement. Veuillez effectuer votre virement bancaire et joindre votre reçu si nécessaire.
          </p>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-200 hover:border-gray-900 text-gray-700 font-bold text-sm rounded-xl transition-all">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={15} className="animate-spin"/> Envoi...</> : <><Plus size={15}/> Soumettre</>}
          </button>
        </div>
      </div>
    </BaseModal>
  )
}

// ─── Modal Request Withdrawal ─────────────────────────────────
function WithdrawalModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth()
  const [amount, setAmount]     = useState('')
  const [bankName, setBankName] = useState('')
  const [rib, setRib]           = useState('')
  const [note, setNote]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [balance, setBalance]   = useState(0)

  useEffect(() => {
    if (!isOpen) return
    setAmount(''); setBankName(''); setRib(''); setNote(''); setError('')
    // Charger le solde
    supabase.from('transactions').select('amount, type, status')
      .eq('owner_id', user.id).eq('status', 'confirmed')
      .then(({ data }) => {
        let bal = 0
        data?.forEach(t => {
          if (t.type === 'deposit')    bal += Number(t.amount)
          if (t.type === 'withdrawal') bal -= Number(t.amount)
        })
        setBalance(bal)
      })
  }, [isOpen])

  async function handleSubmit() {
    if (!amount || Number(amount) <= 0)  { setError('Montant invalide.'); return }
    if (Number(amount) > balance)        { setError(`Solde insuffisant (${balance} DH disponible).`); return }
    if (!rib.trim())                     { setError('RIB / IBAN obligatoire.'); return }
    setError(''); setLoading(true)
    try {
      const txNo = `Tran-${Date.now()}`
      const { error } = await supabase.from('transactions').insert({
        owner_id:       user.id,
        transaction_no: txNo,
        type:           'withdrawal',
        amount:         Number(amount),
        status:         'pending',
        description:    `Retrait vers ${bankName || 'compte bancaire'} — RIB: ${rib}`,
        metadata:       JSON.stringify({ bank_name: bankName, rib, note }),
      })
      if (error) throw error
      onSuccess?.()
      onClose()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Request Withdrawal" accent="#d97706">
      <div className="space-y-4">
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5 text-xs">
              <AlertCircle size={13}/> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Solde */}
        <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500">Solde disponible</p>
          <p className="text-lg font-black text-gray-900">{balance.toLocaleString()} DH</p>
        </div>

        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-1.5">
            Montant à retirer (DH) *
          </label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder={`Max: ${balance} DH`}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 text-sm font-bold text-gray-900 outline-none transition-all bg-gray-50 focus:bg-white"/>
        </div>

        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-1.5">
            Nom de la banque
          </label>
          <input value={bankName} onChange={e => setBankName(e.target.value)}
            placeholder="Ex: CIH Bank, Attijariwafa..."
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 text-sm text-gray-700 outline-none transition-all bg-gray-50 focus:bg-white"/>
        </div>

        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-1.5">
            RIB / IBAN *
          </label>
          <input value={rib} onChange={e => setRib(e.target.value)}
            placeholder="Ex: 0123456789012345678901"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 text-sm font-mono text-gray-700 outline-none transition-all bg-gray-50 focus:bg-white"/>
        </div>

        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-1.5">
            Note (optionnel)
          </label>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="Informations supplémentaires..." rows={2}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 text-sm text-gray-700 outline-none transition-all resize-none bg-gray-50 focus:bg-white"/>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-xs font-bold text-amber-800 mb-1">⚠️ Délai de traitement</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Les retraits sont traités manuellement sous 2-5 jours ouvrés. Assurez-vous que votre RIB est correct.
          </p>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-200 hover:border-gray-900 text-gray-700 font-bold text-sm rounded-xl transition-all">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading
              ? <><Loader2 size={15} className="animate-spin"/> Envoi...</>
              : <><ArrowUpRight size={15}/> Soumettre la demande</>
            }
          </button>
        </div>
      </div>
    </BaseModal>
  )
}

// ─── Modal de base ────────────────────────────────────────────
function BaseModal({ isOpen, onClose, title, accent, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{ opacity: 0,  scale: 0.95,   y: 8  }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="h-1" style={{ background: accent }}/>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #f5f5f5' }}>
              <h2 className="font-black text-gray-900 text-base">{title}</h2>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors">
                <X size={17}/>
              </button>
            </div>
            <div className="p-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
