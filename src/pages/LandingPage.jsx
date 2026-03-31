// src/pages/LandingPage.jsx
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Zap, CheckCircle2, ArrowRight, Star,
  CalendarCheck, Trophy, Building2, Users,
  BarChart3, Link, Shield, ChevronDown, Globe
} from 'lucide-react'

// ─── Traductions ───────────────────────────────────────────────
const T = {
  fr: {
    dir: 'ltr',
    nav: { login: 'Connexion', start: 'Commencer' },
    badge: 'Plateforme #1 de gestion de terrains au Maroc',
    hero: {
      line1: 'Votre terrain.',
      line2: 'En ligne.',
      line3: 'En 5 minutes.',
      sub: 'Partagez un simple lien WhatsApp. Vos clients réservent eux-mêmes, voient les créneaux disponibles, et vous recevez les demandes instantanément.',
      cta1: 'Créer mon compte gratuitement',
      cta2: 'Voir comment ça marche',
    },
    stats: [
      { val: '500+', label: 'Terrains'      },
      { val: '12K+', label: 'Réservations'  },
      { val: '98%',  label: 'Satisfaction'  },
      { val: '24/7', label: 'Disponible'    },
    ],
    howTag: 'Simple & Rapide',
    howTitle: 'Opérationnel en 5 minutes',
    steps: [
      { n: '01', title: 'Créez votre compte',   desc: 'Inscription en 2 minutes. Nom, email, téléphone.' },
      { n: '02', title: 'Choisissez un plan',   desc: 'À partir de 500 DH/mois. Payez par virement bancaire marocain.' },
      { n: '03', title: 'Ajoutez vos terrains', desc: 'Photos, horaires, prix. Votre profil en ligne en 5 min.' },
      { n: '04', title: 'Partagez votre lien',  desc: "Envoyez le lien à vos clients sur WhatsApp. C'est tout." },
    ],
    featTag: 'Tout ce qu\'il vous faut',
    featTitle: 'Une plateforme complète',
    features: [
      { title: 'Réservations en ligne',  desc: 'Vos clients réservent 24h/24 sans vous appeler. Calendrier temps réel.'            },
      { title: 'Lien de réservation',    desc: 'Partagez un lien unique sur WhatsApp. Vos clients voient les créneaux disponibles.' },
      { title: 'Gestion de tournois',    desc: 'Créez des tournois Round Robin. Le calendrier se génère automatiquement.'            },
      { title: 'Statistiques & revenus', desc: 'Suivez vos revenus mensuels, vos terrains les plus bookés, et vos performances.'    },
      { title: 'Multi-terrains',         desc: 'Gérez plusieurs terrains depuis un seul tableau de bord. Sans limite.'               },
      { title: 'Sécurisé & fiable',      desc: 'Données sécurisées, 99.9% uptime. Votre business tourne même quand vous dormez.'    },
    ],
    pricingTag: 'Tarifs transparents',
    pricingTitle: 'Choisissez votre plan',
    pricingSub: 'Paiement par virement bancaire marocain. Aucune carte requise.',
    plans: [
      { label: '1 Mois',  price: '500',   per: '/mois',  highlight: false, save: null        },
      { label: '3 Mois',  price: '1,300', per: '/total', highlight: false, save: '200 DH'    },
      { label: '6 Mois',  price: '2,400', per: '/total', highlight: true,  save: '600 DH'    },
      { label: '12 Mois', price: '4,200', per: '/total', highlight: false, save: '1,800 DH'  },
    ],
    savePre: 'Économie de',
    popular: '⭐ Populaire',
    choosePlan: 'Choisir ce plan',
    pricingNote: 'Accès complet dès activation · Paiement par virement CIH, Attijariwafa, BCP, etc.',
    testiTitle: 'Ce qu\'ils en disent',
    testimonials: [
      { name: 'Hassan B.',  city: 'Casablanca', text: 'Avant je prenais les réservations sur WhatsApp et j\'oubliais. Maintenant tout est automatique.' },
      { name: 'Youssef M.', city: 'Marrakech',  text: 'Le lien de réservation, c\'est vraiment simple. Mes clients l\'adorent. Je gère 3 terrains depuis un seul endroit.' },
      { name: 'Khalid A.',  city: 'Meknès',     text: 'Les tournois Round Robin se créent automatiquement. Je n\'ai plus besoin de faire les tableaux à la main.' },
    ],
    ctaTitle: 'Prêt à digitaliser votre terrain ?',
    ctaSub: 'Inscription gratuite · Actif en 24h après paiement',
    ctaBtn: 'Créer mon compte maintenant',
    footer: '© 2026 StadiumPro · Maroc · Tous droits réservés',
  },

  en: {
    dir: 'ltr',
    nav: { login: 'Login', start: 'Get Started' },
    badge: '#1 Stadium Management Platform in Morocco',
    hero: {
      line1: 'Your stadium.',
      line2: 'Online.',
      line3: 'In 5 minutes.',
      sub: 'Share a simple WhatsApp link. Your clients book themselves, see available slots, and you receive requests instantly.',
      cta1: 'Create my free account',
      cta2: 'See how it works',
    },
    stats: [
      { val: '500+', label: 'Stadiums'      },
      { val: '12K+', label: 'Bookings'      },
      { val: '98%',  label: 'Satisfaction'  },
      { val: '24/7', label: 'Available'     },
    ],
    howTag: 'Simple & Fast',
    howTitle: 'Up and running in 5 minutes',
    steps: [
      { n: '01', title: 'Create your account', desc: 'Sign up in 2 minutes. Name, email, phone.' },
      { n: '02', title: 'Choose a plan',        desc: 'From 500 DH/month. Pay by Moroccan bank transfer.' },
      { n: '03', title: 'Add your stadiums',    desc: 'Photos, schedule, price. Your profile online in 5 min.' },
      { n: '04', title: 'Share your link',      desc: 'Send the link to your clients on WhatsApp. That\'s it.' },
    ],
    featTag: 'Everything you need',
    featTitle: 'A complete platform',
    features: [
      { title: 'Online bookings',      desc: 'Your clients book 24/7 without calling you. Real-time calendar.'             },
      { title: 'Booking link',         desc: 'Share a unique link on WhatsApp. Clients see available slots.'                },
      { title: 'Tournament manager',   desc: 'Create Round Robin tournaments. Schedule generated automatically.'             },
      { title: 'Stats & revenue',      desc: 'Track monthly revenue, your most booked stadiums, and performance.'           },
      { title: 'Multi-stadium',        desc: 'Manage multiple stadiums from a single dashboard. No limits.'                  },
      { title: 'Secure & reliable',    desc: 'Secured data, 99.9% uptime. Your business runs even when you sleep.'          },
    ],
    pricingTag: 'Transparent pricing',
    pricingTitle: 'Choose your plan',
    pricingSub: 'Payment by Moroccan bank transfer. No card required.',
    plans: [
      { label: '1 Month',   price: '500',   per: '/month', highlight: false, save: null       },
      { label: '3 Months',  price: '1,300', per: '/total', highlight: false, save: '200 DH'   },
      { label: '6 Months',  price: '2,400', per: '/total', highlight: true,  save: '600 DH'   },
      { label: '12 Months', price: '4,200', per: '/total', highlight: false, save: '1,800 DH' },
    ],
    savePre: 'Save',
    popular: '⭐ Popular',
    choosePlan: 'Choose this plan',
    pricingNote: 'Full access upon activation · Payment via CIH, Attijariwafa, BCP, etc.',
    testiTitle: 'What they say',
    testimonials: [
      { name: 'Hassan B.',  city: 'Casablanca', text: 'I used to take bookings on WhatsApp and forget. Now everything is automatic.' },
      { name: 'Youssef M.', city: 'Marrakech',  text: 'The booking link is so simple. My clients love it. I manage 3 stadiums from one place.' },
      { name: 'Khalid A.',  city: 'Meknès',     text: 'Round Robin tournaments are created automatically. No more manual bracket drawing.' },
    ],
    ctaTitle: 'Ready to digitize your stadium?',
    ctaSub: 'Free registration · Active within 24h after payment',
    ctaBtn: 'Create my account now',
    footer: '© 2026 StadiumPro · Morocco · All rights reserved',
  },

  ar: {
    dir: 'rtl',
    nav: { login: 'تسجيل الدخول', start: 'ابدأ الآن' },
    badge: 'المنصة الأولى لإدارة الملاعب في المغرب',
    hero: {
      line1: 'ملعبك.',
      line2: 'على الإنترنت.',
      line3: 'في 5 دقائق.',
      sub: 'شارك رابطاً بسيطاً عبر واتساب. يحجز عملاؤك بأنفسهم، يرون المواعيد المتاحة، وتصلك الطلبات فوراً.',
      cta1: 'إنشاء حساب مجاني',
      cta2: 'كيف يعمل؟',
    },
    stats: [
      { val: '+500', label: 'ملعب'       },
      { val: '+12K', label: 'حجز'        },
      { val: '98%',  label: 'رضا العملاء' },
      { val: '24/7', label: 'متاح'       },
    ],
    howTag: 'سريع وبسيط',
    howTitle: 'جاهز للعمل في 5 دقائق',
    steps: [
      { n: '01', title: 'أنشئ حسابك',        desc: 'التسجيل في دقيقتين. الاسم، البريد، الهاتف.' },
      { n: '02', title: 'اختر الخطة',         desc: 'من 500 درهم/شهر. الدفع بالتحويل البنكي المغربي.' },
      { n: '03', title: 'أضف ملاعبك',        desc: 'صور، مواعيد، أسعار. ملفك الشخصي على الإنترنت في 5 دقائق.' },
      { n: '04', title: 'شارك الرابط',        desc: 'أرسل الرابط لعملائك على واتساب. هذا كل شيء.' },
    ],
    featTag: 'كل ما تحتاجه',
    featTitle: 'منصة متكاملة',
    features: [
      { title: 'الحجز الإلكتروني',    desc: 'يحجز عملاؤك على مدار 24 ساعة دون الاتصال بك. تقويم في الوقت الحقيقي.'  },
      { title: 'رابط الحجز',          desc: 'شارك رابطاً فريداً عبر واتساب. يرى العملاء المواعيد المتاحة.'            },
      { title: 'إدارة البطولات',       desc: 'أنشئ بطولات راوند روبن. يتولد الجدول تلقائياً.'                          },
      { title: 'الإحصاءات والإيرادات', desc: 'تابع إيراداتك الشهرية وأكثر ملاعبك حجزاً وأداءك العام.'                 },
      { title: 'عدة ملاعب',           desc: 'أدر عدة ملاعب من لوحة تحكم واحدة. بلا حدود.'                             },
      { title: 'آمن وموثوق',          desc: 'بيانات مؤمّنة، وقت تشغيل 99.9%. عملك يسير حتى وأنت نائم.'               },
    ],
    pricingTag: 'أسعار شفافة',
    pricingTitle: 'اختر خطتك',
    pricingSub: 'الدفع بالتحويل البنكي المغربي. لا يلزم بطاقة.',
    plans: [
      { label: 'شهر واحد', price: '500',   per: '/شهر',   highlight: false, save: null       },
      { label: '3 أشهر',   price: '1,300', per: '/إجمالي', highlight: false, save: '200 درهم' },
      { label: '6 أشهر',   price: '2,400', per: '/إجمالي', highlight: true,  save: '600 درهم' },
      { label: '12 شهراً', price: '4,200', per: '/إجمالي', highlight: false, save: '1,800 درهم' },
    ],
    savePre: 'وفّر',
    popular: '⭐ الأكثر شعبية',
    choosePlan: 'اختر هذه الخطة',
    pricingNote: 'وصول كامل فور التفعيل · الدفع عبر CIH أو Attijariwafa أو BCP، إلخ.',
    testiTitle: 'ماذا يقولون؟',
    testimonials: [
      { name: 'حسن ب.',   city: 'الدار البيضاء', text: 'كنت أتلقى الحجوزات على واتساب وأنساها. الآن كل شيء تلقائي.' },
      { name: 'يوسف م.',  city: 'مراكش',         text: 'رابط الحجز بسيط جداً. عملائي يعشقونه. أدير 3 ملاعب من مكان واحد.' },
      { name: 'خالد أ.',  city: 'مكناس',         text: 'بطولات راوند روبن تُنشأ تلقائياً. لم أعد أحتاج رسم الجداول يدوياً.' },
    ],
    ctaTitle: 'هل أنت مستعد لرقمنة ملعبك؟',
    ctaSub: 'تسجيل مجاني · نشط خلال 24 ساعة بعد الدفع',
    ctaBtn: 'إنشاء حسابي الآن',
    footer: '© 2026 StadiumPro · المغرب · جميع الحقوق محفوظة',
  },
}

const LANG_OPTIONS = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English',  flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇲🇦' },
]

const FEATURE_ICONS = [CalendarCheck, Link, Trophy, BarChart3, Users, Shield]

export default function LandingPage() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [lang, setLang]         = useState('fr')
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef(null)
  const t = T[lang]

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Fermer dropdown si clic extérieur
  useEffect(() => {
    const fn = e => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const current = LANG_OPTIONS.find(l => l.code === lang)

  return (
    <div dir={t.dir}
      style={{ fontFamily: lang === 'ar' ? "'Cairo', sans-serif" : "'Outfit', sans-serif", background: '#080c08', color: 'white', overflowX: 'hidden' }}>

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background:     scrolled ? 'rgba(8,12,8,0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom:   scrolled ? '1px solid rgba(74,222,128,0.08)' : 'none',
        }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #4ade80, #16a34a)' }}>
              <Zap size={16} className="text-black" fill="black"/>
            </div>
            <span className="font-black text-white text-base sm:text-lg">StadiumPro</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">

            {/* Sélecteur de langue */}
            <div ref={langRef} className="relative">
              <button onClick={() => setLangOpen(o => !o)}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: langOpen ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.8)',
                }}>
                <Globe size={13}/>
                <span className="hidden sm:inline">{current.flag} {current.label}</span>
                <span className="sm:hidden">{current.flag}</span>
              </button>

              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-2 rounded-2xl overflow-hidden shadow-2xl z-50"
                    style={{
                      background: '#111',
                      border: '1px solid rgba(255,255,255,0.1)',
                      minWidth: 140,
                      [lang === 'ar' ? 'left' : 'right']: 0,
                    }}>
                    {LANG_OPTIONS.map(opt => (
                      <button key={opt.code}
                        onClick={() => { setLang(opt.code); setLangOpen(false) }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-all"
                        style={{
                          background: lang === opt.code ? 'rgba(74,222,128,0.1)' : 'transparent',
                          color: lang === opt.code ? '#4ade80' : 'rgba(255,255,255,0.7)',
                          fontWeight: lang === opt.code ? 700 : 500,
                          textAlign: lang === 'ar' ? 'right' : 'left',
                        }}
                        onMouseEnter={e => { if (lang !== opt.code) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                        onMouseLeave={e => { if (lang !== opt.code) e.currentTarget.style.background = 'transparent' }}>
                        <span>{opt.flag}</span> {opt.label}
                        {lang === opt.code && <span className="ml-auto text-green-400">✓</span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button onClick={() => navigate('/auth')}
              className="hidden sm:block text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
              style={{ color: 'rgba(255,255,255,0.6)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'white'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>
              {t.nav.login}
            </button>
            <button onClick={() => navigate('/auth')}
              className="text-xs sm:text-sm font-black px-3 sm:px-5 py-2 rounded-xl transition-all flex items-center gap-1.5"
              style={{ background: 'linear-gradient(135deg, #4ade80, #16a34a)', color: '#000' }}>
              {t.nav.start} <ArrowRight size={13}/>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="min-h-screen flex flex-col items-center justify-center relative px-4 sm:px-6 pt-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(74,222,128,0.04) 1px, transparent 1px),linear-gradient(90deg, rgba(74,222,128,0.04) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}/>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(74,222,128,0.06) 0%, transparent 70%)' }}/>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
            <span className="text-sm font-semibold" style={{ color: '#4ade80' }}>{t.badge}</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-black leading-none mb-6"
            style={{ fontSize: 'clamp(36px, 8vw, 88px)', lineHeight: 1.15 }}>
            {t.hero.line1}<br/>
            <span style={{ background: 'linear-gradient(135deg, #4ade80, #16a34a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {t.hero.line2}
            </span><br/>
            {t.hero.line3}
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-sm sm:text-lg mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.5)' }}>
            {t.hero.sub}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={() => navigate('/auth')}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-base transition-all w-full sm:w-auto justify-center"
              style={{ background: 'linear-gradient(135deg, #4ade80, #16a34a)', color: '#000', boxShadow: '0 0 40px rgba(74,222,128,0.3)' }}>
              {t.hero.cta1} <ArrowRight size={18}/>
            </button>
            <a href="#how"
              className="flex items-center gap-2 px-6 py-4 rounded-2xl font-semibold text-sm transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
              {t.hero.cta2}
            </a>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-5 sm:gap-8 mt-10 sm:mt-14 flex-wrap">
            {t.stats.map(({ val, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-black" style={{ color: '#4ade80' }}>{val}</p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <ChevronDown size={20} className="animate-bounce" style={{ color: 'rgba(255,255,255,0.2)' }}/>
        </motion.div>
      </section>

      {/* ── Comment ça marche ── */}
      <section id="how" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#4ade80' }}>
              {t.howTag}
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">{t.howTitle}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {t.steps.map(({ n, title, desc }, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-6 relative"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-5xl font-black block mb-4"
                  style={{ color: 'rgba(74,222,128,0.15)', lineHeight: 1 }}>{n}</span>
                <h3 className="font-black text-white text-base mb-2">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fonctionnalités ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#4ade80' }}>
              {t.featTag}
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">{t.featTitle}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.features.map(({ title, desc }, i) => {
              const Icon = FEATURE_ICONS[i]
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="rounded-2xl p-6 transition-all duration-300"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={e => { e.currentTarget.style.border = '1px solid rgba(74,222,128,0.2)'; e.currentTarget.style.background = 'rgba(74,222,128,0.04)' }}
                  onMouseLeave={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(74,222,128,0.1)' }}>
                    <Icon size={18} style={{ color: '#4ade80' }}/>
                  </div>
                  <h3 className="font-black text-white mb-2">{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Tarifs ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#4ade80' }}>
              {t.pricingTag}
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">{t.pricingTitle}</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)' }} className="text-sm">{t.pricingSub}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {t.plans.map(({ label, price, per, highlight, save }, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="rounded-2xl p-5 relative flex flex-col"
                style={{
                  background:  highlight ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.03)',
                  border:      highlight ? '1.5px solid rgba(74,222,128,0.35)' : '1px solid rgba(255,255,255,0.07)',
                  boxShadow:   highlight ? '0 0 30px rgba(74,222,128,0.1)' : 'none',
                }}>
                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-black whitespace-nowrap"
                    style={{ background: 'linear-gradient(135deg, #4ade80, #16a34a)', color: '#000' }}>
                    {t.popular}
                  </div>
                )}
                <p className="font-black text-white mb-3">{label}</p>
                <div className="mb-4">
                  <span className="text-3xl font-black text-white">{price}</span>
                  <span className="text-sm ml-1" style={{ color: 'rgba(255,255,255,0.4)' }}>DH{per}</span>
                </div>
                {save
                  ? <p className="text-xs font-bold mb-4" style={{ color: '#4ade80' }}>{t.savePre} {save}</p>
                  : <div className="mb-4"/>
                }
                <button onClick={() => navigate('/auth')}
                  className="mt-auto py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={highlight ? {
                    background: 'linear-gradient(135deg, #4ade80, #16a34a)', color: '#000',
                  } : {
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)',
                  }}>
                  {t.choosePlan}
                </button>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <CheckCircle2 size={14} style={{ color: '#4ade80' }}/>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{t.pricingNote}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Témoignages ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-white">{t.testiTitle}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {t.testimonials.map(({ name, city, text }, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-6"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex gap-1 mb-4">
                  {Array(5).fill(0).map((_, j) => (
                    <Star key={j} size={14} fill="#4ade80" style={{ color: '#4ade80' }}/>
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>"{text}"</p>
                <div>
                  <p className="font-bold text-white text-sm">{name}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{city}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto rounded-3xl p-6 sm:p-12 text-center relative overflow-hidden"
          style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)' }}>
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(circle at center, rgba(74,222,128,0.08) 0%, transparent 70%)' }}/>
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: 'linear-gradient(135deg, #4ade80, #16a34a)' }}>
              <Zap size={26} className="text-black" fill="black"/>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">{t.ctaTitle}</h2>
            <p className="mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>{t.ctaSub}</p>
            <button onClick={() => navigate('/auth')}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-base transition-all"
              style={{ background: 'linear-gradient(135deg, #4ade80, #16a34a)', color: '#000', boxShadow: '0 0 40px rgba(74,222,128,0.3)' }}>
              {t.ctaBtn} <ArrowRight size={18}/>
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4ade80, #16a34a)' }}>
            <Zap size={12} className="text-black" fill="black"/>
          </div>
          <span className="font-black text-white text-sm">StadiumPro</span>
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>{t.footer}</p>
      </footer>
    </div>
  )
}
