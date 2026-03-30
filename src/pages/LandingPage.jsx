// src/pages/LandingPage.jsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Zap, CheckCircle2, ArrowRight, Star,
  CalendarCheck, Trophy, Building2, Users,
  BarChart3, Link, Shield, ChevronDown
} from 'lucide-react'

const PLANS = [
  { label: '1 Mois',  price: '500',   per: '/mois',  highlight: false, save: null       },
  { label: '3 Mois',  price: '1,300', per: '/total', highlight: false, save: '200 DH'   },
  { label: '6 Mois',  price: '2,400', per: '/total', highlight: true,  save: '600 DH'   },
  { label: '12 Mois', price: '4,200', per: '/total', highlight: false, save: '1,800 DH' },
]

const FEATURES = [
  { icon: CalendarCheck, title: 'Réservations en ligne',    desc: 'Vos clients réservent 24h/24 sans vous appeler. Calendrier temps réel.'             },
  { icon: Link,          title: 'Lien de réservation',      desc: 'Partagez un lien unique sur WhatsApp. Vos clients voient les créneaux disponibles.'   },
  { icon: Trophy,        title: 'Gestion de tournois',      desc: 'Créez des tournois Round Robin. Le calendrier se génère automatiquement.'             },
  { icon: BarChart3,     title: 'Statistiques & revenus',   desc: 'Suivez vos revenus mensuels, vos terrains les plus bookés, et vos performances.'     },
  { icon: Users,         title: 'Multi-terrains',           desc: 'Gérez plusieurs terrains depuis un seul tableau de bord. Sans limite.'                },
  { icon: Shield,        title: 'Sécurisé & fiable',        desc: 'Données sécurisées, 99.9% uptime. Votre business tourne même quand vous dormez.'     },
]

const STEPS = [
  { n: '01', title: 'Créez votre compte',     desc: 'Inscription en 2 minutes. Nom, email, téléphone.' },
  { n: '02', title: 'Choisissez un plan',     desc: 'De 500 DH/mois. Payez par virement bancaire marocain.' },
  { n: '03', title: 'Ajoutez vos terrains',   desc: 'Photos, horaires, prix. Votre profil en ligne en 5 min.' },
  { n: '04', title: 'Partagez votre lien',    desc: 'Envoyez le lien à vos clients sur WhatsApp. C\'est tout.' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: '#080c08', color: 'white', overflowX: 'hidden' }}>

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background:   scrolled ? 'rgba(8,12,8,0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(74,222,128,0.08)' : 'none',
        }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #4ade80, #16a34a)' }}>
              <Zap size={16} className="text-black" fill="black"/>
            </div>
            <span className="font-black text-white text-lg">StadiumPro</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/auth')}
              className="text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
              style={{ color: 'rgba(255,255,255,0.6)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'white'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>
              Connexion
            </button>
            <button onClick={() => navigate('/auth')}
              className="text-sm font-black px-5 py-2 rounded-xl transition-all flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #4ade80, #16a34a)', color: '#000' }}>
              Commencer <ArrowRight size={14}/>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="min-h-screen flex flex-col items-center justify-center relative px-6 pt-20">
        {/* Grille */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(74,222,128,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(74,222,128,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}/>
        {/* Glow central */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(74,222,128,0.06) 0%, transparent 70%)' }}/>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
            <span className="text-sm font-semibold" style={{ color: '#4ade80' }}>
              Plateforme #1 de gestion de terrains au Maroc
            </span>
          </motion.div>

          {/* Titre */}
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-black leading-none mb-6"
            style={{ fontSize: 'clamp(48px, 8vw, 88px)', lineHeight: 1.05 }}>
            Votre terrain.<br/>
            <span style={{
              background: 'linear-gradient(135deg, #4ade80, #16a34a)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>En ligne.</span><br/>
            En 5 minutes.
          </motion.h1>

          {/* Sous-titre */}
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-lg mb-10 max-w-2xl mx-auto leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.5)' }}>
            Partagez un simple lien WhatsApp. Vos clients réservent eux-mêmes,
            voient les créneaux disponibles, et vous recevez les demandes instantanément.
          </motion.p>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={() => navigate('/auth')}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-base transition-all"
              style={{
                background: 'linear-gradient(135deg, #4ade80, #16a34a)',
                color: '#000',
                boxShadow: '0 0 40px rgba(74,222,128,0.3)',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 60px rgba(74,222,128,0.5)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 40px rgba(74,222,128,0.3)'}>
              Créer mon compte gratuitement
              <ArrowRight size={18}/>
            </button>
            <a href="#how"
              className="flex items-center gap-2 px-6 py-4 rounded-2xl font-semibold text-sm transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(74,222,128,0.3)'; e.currentTarget.style.color = 'white' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}>
              Voir comment ça marche
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-8 mt-14 flex-wrap">
            {[
              { val: '500+',  label: 'Terrains'     },
              { val: '12K+',  label: 'Réservations' },
              { val: '98%',   label: 'Satisfaction' },
              { val: '24/7',  label: 'Disponible'   },
            ].map(({ val, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-black" style={{ color: '#4ade80' }}>{val}</p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <ChevronDown size={20} className="animate-bounce" style={{ color: 'rgba(255,255,255,0.2)' }}/>
        </motion.div>
      </section>

      {/* ── Comment ça marche ── */}
      <section id="how" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#4ade80' }}>
              Simple & Rapide
            </p>
            <h2 className="text-4xl font-black text-white">Opérationnel en 5 minutes</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map(({ n, title, desc }, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-6 relative"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-5xl font-black block mb-4"
                  style={{ color: 'rgba(74,222,128,0.15)', lineHeight: 1 }}>{n}</span>
                <h3 className="font-black text-white text-base mb-2">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-2 w-4 h-px"
                    style={{ background: 'rgba(74,222,128,0.3)' }}/>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fonctionnalités ── */}
      <section className="py-24 px-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#4ade80' }}>
              Tout ce qu'il vous faut
            </p>
            <h2 className="text-4xl font-black text-white">Une plateforme complète</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="rounded-2xl p-6 group transition-all duration-300"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.border = '1px solid rgba(74,222,128,0.2)'
                  e.currentTarget.style.background = 'rgba(74,222,128,0.04)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(74,222,128,0.1)' }}>
                  <Icon size={18} style={{ color: '#4ade80' }}/>
                </div>
                <h3 className="font-black text-white mb-2">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tarifs ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#4ade80' }}>
              Tarifs transparents
            </p>
            <h2 className="text-4xl font-black text-white mb-4">Choisissez votre plan</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)' }} className="text-sm">
              Paiement par virement bancaire marocain. Aucune carte requise.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map(({ label, price, per, highlight, save }, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="rounded-2xl p-5 relative flex flex-col"
                style={{
                  background:   highlight ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.03)',
                  border:       highlight ? '1.5px solid rgba(74,222,128,0.35)' : '1px solid rgba(255,255,255,0.07)',
                  boxShadow:    highlight ? '0 0 30px rgba(74,222,128,0.1)' : 'none',
                }}>
                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-black"
                    style={{ background: 'linear-gradient(135deg, #4ade80, #16a34a)', color: '#000' }}>
                    ⭐ Populaire
                  </div>
                )}
                <p className="font-black text-white mb-3">{label}</p>
                <div className="mb-4">
                  <span className="text-3xl font-black text-white">{price}</span>
                  <span className="text-sm ml-1" style={{ color: 'rgba(255,255,255,0.4)' }}>DH{per}</span>
                </div>
                {save ? (
                  <p className="text-xs font-bold mb-4" style={{ color: '#4ade80' }}>
                    Économie de {save}
                  </p>
                ) : <div className="mb-4"/>}
                <button onClick={() => navigate('/auth')}
                  className="mt-auto py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={highlight ? {
                    background: 'linear-gradient(135deg, #4ade80, #16a34a)',
                    color: '#000',
                  } : {
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)',
                  }}>
                  Choisir ce plan
                </button>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <CheckCircle2 size={14} style={{ color: '#4ade80' }}/>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Accès complet dès activation · Paiement par virement CIH, Attijariwafa, BCP, etc.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Témoignages ── */}
      <section className="py-24 px-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white">Ce qu'ils en disent</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Hassan B.', city: 'Casablanca', text: 'Avant je prenais les réservations sur WhatsApp et j\'oubliais. Maintenant tout est automatique.', stars: 5 },
              { name: 'Youssef M.', city: 'Marrakech', text: 'Le lien de réservation, c\'est vraiment simple. Mes clients l\'adorent. Je gère 3 terrains depuis un seul endroit.', stars: 5 },
              { name: 'Khalid A.', city: 'Meknès', text: 'Les tournois Round Robin se créent automatiquement. Je n\'ai plus besoin de faire les tableaux à la main.', stars: 5 },
            ].map(({ name, city, text, stars }, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-6"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex gap-1 mb-4">
                  {Array(stars).fill(0).map((_, j) => (
                    <Star key={j} size={14} fill="#4ade80" style={{ color: '#4ade80' }}/>
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  "{text}"
                </p>
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
      <section className="py-24 px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto rounded-3xl p-12 text-center relative overflow-hidden"
          style={{
            background: 'rgba(74,222,128,0.06)',
            border: '1px solid rgba(74,222,128,0.2)',
          }}>
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(circle at center, rgba(74,222,128,0.08) 0%, transparent 70%)' }}/>
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: 'linear-gradient(135deg, #4ade80, #16a34a)' }}>
              <Zap size={26} className="text-black" fill="black"/>
            </div>
            <h2 className="text-3xl font-black text-white mb-4">
              Prêt à digitaliser votre terrain ?
            </h2>
            <p className="mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Inscription gratuite · Actif en 24h après paiement
            </p>
            <button onClick={() => navigate('/auth')}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-base transition-all"
              style={{
                background: 'linear-gradient(135deg, #4ade80, #16a34a)',
                color: '#000',
                boxShadow: '0 0 40px rgba(74,222,128,0.3)',
              }}>
              Créer mon compte maintenant
              <ArrowRight size={18}/>
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
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
          © 2026 StadiumPro · Maroc · Tous droits réservés
        </p>
      </footer>
    </div>
  )
}
