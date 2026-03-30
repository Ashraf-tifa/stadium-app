// src/components/Modal.jsx
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

// ─── Modal de base ────────────────────────────────────────────
export function Modal({ isOpen, title, children, onClose, size = 'md' }) {
  // Empêcher le scroll du body
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop — ne pas fermer en cliquant dessus */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Contenu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{ opacity: 0,  scale: 0.95,   y: 10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`relative w-full ${sizes[size]} bg-white rounded-3xl shadow-2xl overflow-hidden`}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                >
                  <X size={18}/>
                </button>
              </div>
            )}
            <div className="overflow-y-auto max-h-[85vh]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ─── Modal de confirmation (Supprimer) ────────────────────────
export function ConfirmModal({ isOpen, title, message, confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler', onConfirm, onCancel, type = 'danger', loading = false }) {

  const colors = {
    danger:  { btn: 'bg-red-600 hover:bg-red-700 shadow-red-200',    icon: '🗑️' },
    warning: { btn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200', icon: '⚠️' },
    info:    { btn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200',  icon: 'ℹ️' },
  }
  const c = colors[type] || colors.danger

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1,   y: 0  }}
            exit={{ opacity: 0,  scale: 0.9,   y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 text-center"
          >
            {/* Icône */}
            <div className="text-4xl mb-4">{c.icon}</div>

            {/* Titre */}
            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>

            {/* Message */}
            <p className="text-sm text-gray-500 leading-relaxed mb-6">{message}</p>

            {/* Boutons */}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={loading}
                className="flex-1 py-3 text-sm font-semibold text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-2xl transition-all disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 py-3 text-sm font-semibold text-white rounded-2xl transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 ${c.btn}`}
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                )}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
