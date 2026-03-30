// src/components/BookingModal.jsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, CalendarCheck, Clock, DollarSign,
  CheckCircle2, AlertCircle, Loader2,
  ChevronLeft, ChevronRight, Building2
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

export default function BookingModal({ isOpen, stadium, onClose, onSuccess }) {
  const { user } = useAuth()
  const [step, setStep]             = useState(1) // 1: date, 2: heure, 3: confirm
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null) // { start, end }
  const [availableSlots, setAvailableSlots] = useState([])
  const [bookedSlots, setBookedSlots]       = useState([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState(false)

  // Calendrier
  const today = new Date()
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [calYear, setCalYear]   = useState(today.getFullYear())

  // Reset à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setStep(1); setSelectedDate(null); setSelectedSlot(null)
      setError(''); setSuccess(false)
      const t = new Date()
      setCalMonth(t.getMonth()); setCalYear(t.getFullYear())
    }
  }, [isOpen])

  // Charger les créneaux disponibles quand date sélectionnée
  useEffect(() => {
    if (!selectedDate || !stadium) return
    loadSlots()
  }, [selectedDate])

  async function loadSlots() {
    setLoading(true)
    setError('')
    const dayOfWeek = selectedDate.getDay()

    try {
      // 1. جلب جميع الفتحات الزمنية للترين في هذا اليوم
      const { data: slots, error: slotsError } = await supabase
        .from('time_slots')
        .select('*')
        .eq('stadium_id', stadium.id)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true)

      if (slotsError) throw slotsError

      // 2. جلب جميع الحجوزات المؤكدة لهذا التاريخ
      const dateStr = formatDate(selectedDate)
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('stadium_id', stadium.id)
        .eq('booking_date', dateStr)
        .neq('status', 'cancelled')

      if (bookingsError) throw bookingsError

      setBookedSlots(bookings || [])

      // 3. توليد الفتحات المتاحة (كل ساعة) من time_slots
      const generated = []
      for (const slot of slots || []) {
        // تحويل أوقات البدء والانتهاء إلى دقائق للمقارنة بسهولة
        const [startHour, startMinute] = slot.start_time.split(':').map(Number)
        const [endHour, endMinute] = slot.end_time.split(':').map(Number)
        
        let currentStart = startHour * 60 + startMinute
        const endTime = endHour * 60 + endMinute
        
        // توليد فتحات كل ساعة
        while (currentStart + 60 <= endTime) {
          const startTimeStr = formatTimeFromMinutes(currentStart)
          const endTimeStr = formatTimeFromMinutes(currentStart + 60)
          
          generated.push({ 
            start: startTimeStr, 
            end: endTimeStr,
            // إضافة خصائص للمقارنة بالدقائق لتجنب المشاكل
            startMinutes: currentStart,
            endMinutes: currentStart + 60
          })
          
          currentStart += 60
        }
      }

      // 4. تصفية الفتحات المكررة والمحجوزة
      // أولاً: إزالة الفتحات المكررة (إذا كان هناك تداخل في time_slots)
      const uniqueSlots = []
      const slotKeyMap = new Map()
      
      for (const slot of generated) {
        const key = `${slot.start}-${slot.end}`
        if (!slotKeyMap.has(key)) {
          slotKeyMap.set(key, slot)
          uniqueSlots.push(slot)
        }
      }
      
      // ثانياً: تصفية الفتحات المحجوزة
      const filteredSlots = uniqueSlots.filter(slot => {
        // تحويل الحجوزات إلى مقارنة دقيقة بالدقائق
        return !bookings?.some(booking => {
          // تحويل وقت الحجز إلى دقائق
          const [bookingStartHour, bookingStartMinute] = booking.start_time.split(':').map(Number)
          const [bookingEndHour, bookingEndMinute] = booking.end_time.split(':').map(Number)
          
          const bookingStartMinutes = bookingStartHour * 60 + bookingStartMinute
          const bookingEndMinutes = bookingEndHour * 60 + bookingEndMinute
          
          // التحقق من التداخل: إذا كان الفتحة تتداخل مع حجز موجود
          // الفتحة محجوزة إذا:
          // 1. الفتحة تبدأ في نفس وقت الحجز أو بعده بقليل
          // 2. الفتحة تنتهي في نفس وقت الحجز أو قبله بقليل
          // 3. الفتحة تقع بالكامل داخل الحجز
          const slotStart = slot.startMinutes
          const slotEnd = slot.endMinutes
          
          // التداخل الكامل أو الجزئي
          return (slotStart >= bookingStartMinutes && slotStart < bookingEndMinutes) ||
                 (slotEnd > bookingStartMinutes && slotEnd <= bookingEndMinutes) ||
                 (slotStart <= bookingStartMinutes && slotEnd >= bookingEndMinutes)
        })
      })
      
      setAvailableSlots(filteredSlots)
    } catch (err) {
      console.error('Error loading slots:', err)
      setError('حدث خطأ أثناء تحميل المواعيد المتاحة')
    } finally {
      setLoading(false)
    }
  }

  // دالة مساعدة لتحويل الدقائق إلى نص الوقت (HH:MM)
  function formatTimeFromMinutes(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }

  // دالة للتحقق مما إذا كان الكريون محجوزاً (بديلة عن isSlotBooked)
  function isSlotBooked(slot) {
    if (!bookedSlots.length) return false
    
    return bookedSlots.some(booking => {
      const [bookingStartHour, bookingStartMinute] = booking.start_time.split(':').map(Number)
      const [bookingEndHour, bookingEndMinute] = booking.end_time.split(':').map(Number)
      
      const bookingStartMinutes = bookingStartHour * 60 + bookingStartMinute
      const bookingEndMinutes = bookingEndHour * 60 + bookingEndMinute
      
      const slotStartMinutes = slot.startMinutes
      const slotEndMinutes = slot.endMinutes
      
      // التحقق من التداخل
      return (slotStartMinutes >= bookingStartMinutes && slotStartMinutes < bookingEndMinutes) ||
             (slotEndMinutes > bookingStartMinutes && slotEndMinutes <= bookingEndMinutes) ||
             (slotStartMinutes <= bookingStartMinutes && slotEndMinutes >= bookingEndMinutes)
    })
  }

  function formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
  }

  function formatDateFr(date) {
    return `${date.getDate()} ${MONTHS_FR[date.getMonth()]} ${date.getFullYear()}`
  }

  // Calcul du prix
  const totalPrice = stadium?.price_per_hour || 0

  // Confirmer la réservation
  async function handleConfirm() {
    if (!selectedDate || !selectedSlot) return
    setLoading(true); setError('')
    try {
      const { error } = await supabase.from('bookings').insert({
        stadium_id:   stadium.id,
        customer_id:  user.id,
        booking_date: formatDate(selectedDate),
        start_time:   selectedSlot.start + ':00',
        end_time:     selectedSlot.end   + ':00',
        total_price:  totalPrice,
        status:       'pending',
      })
      if (error) throw error
      setSuccess(true)
      setTimeout(() => { onSuccess?.(); onClose() }, 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Génération du calendrier
  function getCalendarDays() {
    const firstDay = new Date(calYear, calMonth, 1).getDay()
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
    const days = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(calYear, calMonth, d))
    return days
  }

  function isPast(date) {
    const t = new Date(); t.setHours(0,0,0,0)
    return date < t
  }

  function isSelected(date) {
    return selectedDate && date.toDateString() === selectedDate.toDateString()
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
            <div className="h-1 bg-gradient-to-r from-green-400 to-emerald-600"/>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                  <CalendarCheck size={17} className="text-green-600"/>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Réserver — {stadium?.name}</h2>
                  <p className="text-xs text-gray-400">{stadium?.city} · {stadium?.size} · {stadium?.price_per_hour} DH/h</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400">
                <X size={18}/>
              </button>
            </div>

            {/* Stepper */}
            <div className="flex items-center px-6 py-3 bg-gray-50 border-b border-gray-100 gap-2">
              {[{n:1,l:'Date'},{n:2,l:'Heure'},{n:3,l:'Confirmer'}].map(({n,l}, i, arr) => (
                <div key={n} className="flex items-center flex-1">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step === n ? 'bg-green-600 text-white' : step > n ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-400'
                    }`}>{step > n ? '✓' : n}</div>
                    <span className={`text-xs font-medium hidden sm:block ${step === n ? 'text-gray-900' : 'text-gray-400'}`}>{l}</span>
                  </div>
                  {i < arr.length-1 && <div className={`flex-1 h-0.5 mx-2 ${step > n ? 'bg-green-300' : 'bg-gray-200'}`}/>}
                </div>
              ))}
            </div>

            {/* Corps */}
            <div className="p-5" style={{ minHeight: 320 }}>
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5 text-xs mb-4">
                    <AlertCircle size={13}/> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {success ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={32} className="text-green-600"/>
                  </div>
                  <p className="font-bold text-gray-900">Réservation envoyée !</p>
                  <p className="text-sm text-gray-500 text-center">
                    Votre demande est en attente de confirmation par le propriétaire.
                  </p>
                </motion.div>
              ) : (
                <AnimatePresence mode="wait">

                  {/* ── Étape 1 : Calendrier ── */}
                  {step === 1 && (
                    <motion.div key="s1"
                      initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}
                    >
                      {/* Navigation mois */}
                      <div className="flex items-center justify-between mb-4">
                        <button onClick={() => {
                          if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1) }
                          else setCalMonth(m => m-1)
                        }} className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors">
                          <ChevronLeft size={18} className="text-gray-500"/>
                        </button>
                        <p className="text-sm font-bold text-gray-900">
                          {MONTHS_FR[calMonth]} {calYear}
                        </p>
                        <button onClick={() => {
                          if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1) }
                          else setCalMonth(m => m+1)
                        }} className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors">
                          <ChevronRight size={18} className="text-gray-500"/>
                        </button>
                      </div>

                      {/* Jours de la semaine */}
                      <div className="grid grid-cols-7 mb-2">
                        {DAYS_FR.map(d => (
                          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
                        ))}
                      </div>

                      {/* Jours */}
                      <div className="grid grid-cols-7 gap-1">
                        {getCalendarDays().map((date, idx) => (
                          <div key={idx}>
                            {date ? (
                              <button
                                onClick={() => !isPast(date) && setSelectedDate(date)}
                                disabled={isPast(date)}
                                className={`w-full aspect-square rounded-xl text-xs font-medium transition-all ${
                                  isSelected(date)
                                    ? 'bg-green-600 text-white shadow-md shadow-green-200'
                                    : isPast(date)
                                      ? 'text-gray-300 cursor-not-allowed'
                                      : 'hover:bg-green-50 text-gray-700 hover:text-green-700'
                                }`}>
                                {date.getDate()}
                              </button>
                            ) : <div/>}
                          </div>
                        ))}
                      </div>

                      {selectedDate && (
                        <p className="text-xs text-center text-green-600 font-medium mt-3">
                          ✓ {formatDateFr(selectedDate)} sélectionné
                        </p>
                      )}
                    </motion.div>
                  )}

                  {/* ── Étape 2 : Créneaux ── */}
                  {step === 2 && (
                    <motion.div key="s2"
                      initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}
                    >
                      <p className="text-sm font-semibold text-gray-700 mb-3">
                        Choisissez un créneau — {formatDateFr(selectedDate)}
                      </p>

                      {loading ? (
                        <div className="flex items-center justify-center py-10">
                          <Loader2 size={24} className="animate-spin text-green-600"/>
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                          <Clock size={32} className="mb-2 opacity-30"/>
                          <p className="text-sm">Aucun créneau disponible ce jour</p>
                          <button onClick={() => setStep(1)}
                            className="mt-3 text-xs text-green-600 font-medium">
                            Choisir une autre date
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {availableSlots.map((slot, i) => {
                            const booked = isSlotBooked(slot)
                            const isChosen = selectedSlot?.start === slot.start && selectedSlot?.end === slot.end
                            return (
                              <button key={i}
                                onClick={() => !booked && setSelectedSlot(slot)}
                                disabled={booked}
                                className={`py-3 rounded-xl text-xs font-semibold border-2 transition-all ${
                                  isChosen
                                    ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                                    : booked
                                      ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                                      : 'border-gray-200 text-gray-700 hover:border-green-400 hover:bg-green-50'
                                }`}>
                                {slot.start}
                                {booked && <span className="block text-gray-300 font-normal">Occupé</span>}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* ── Étape 3 : Confirmation ── */}
                  {step === 3 && (
                    <motion.div key="s3"
                      initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}
                      className="space-y-3"
                    >
                      <p className="text-sm font-semibold text-gray-700 mb-3">Récapitulatif</p>

                      {/* Terrain */}
                      <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-green-800 to-emerald-900 flex-shrink-0">
                            {stadium?.images?.[0] ? (
                              <img src={stadium.images[0]} alt="" className="w-full h-full object-cover"/>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building2 size={20} className="text-white/30"/>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{stadium?.name}</p>
                            <p className="text-xs text-gray-500">{stadium?.city} · {stadium?.size}</p>
                          </div>
                        </div>

                        <div className="h-px bg-gray-200"/>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 flex items-center gap-1.5">
                            <CalendarCheck size={14} className="text-green-600"/> Date
                          </span>
                          <span className="font-semibold text-gray-900">{formatDateFr(selectedDate)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 flex items-center gap-1.5">
                            <Clock size={14} className="text-blue-500"/> Créneau
                          </span>
                          <span className="font-semibold text-gray-900">{selectedSlot?.start} – {selectedSlot?.end}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 flex items-center gap-1.5">
                            <DollarSign size={14} className="text-amber-500"/> Total
                          </span>
                          <span className="font-bold text-green-600 text-base">{totalPrice} DH</span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-400 text-center">
                        La réservation sera confirmée par le propriétaire du terrain.
                      </p>
                    </motion.div>
                  )}

                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {!success && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                {step === 1 ? (
                  <button onClick={onClose}
                    className="px-5 py-2.5 text-sm font-semibold text-gray-600 border-2 border-gray-200 hover:bg-white rounded-2xl transition-all">
                    Annuler
                  </button>
                ) : (
                  <button onClick={() => setStep(s => s-1)}
                    className="px-5 py-2.5 text-sm font-semibold text-gray-600 border-2 border-gray-200 hover:bg-white rounded-2xl transition-all">
                    ← Retour
                  </button>
                )}

                {step === 1 && (
                  <button
                    onClick={() => { if (selectedDate) setStep(2) }}
                    disabled={!selectedDate}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-40 rounded-2xl transition-all shadow-sm">
                    Suivant →
                  </button>
                )}
                {step === 2 && (
                  <button
                    onClick={() => { if (selectedSlot) setStep(3) }}
                    disabled={!selectedSlot}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-40 rounded-2xl transition-all shadow-sm">
                    Suivant →
                  </button>
                )}
                {step === 3 && (
                  <button onClick={handleConfirm} disabled={loading}
                    className="px-6 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 rounded-2xl transition-all shadow-sm flex items-center gap-2">
                    {loading
                      ? <><Loader2 size={15} className="animate-spin"/> Envoi...</>
                      : <><CheckCircle2 size={15}/> Confirmer la réservation</>
                    }
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}