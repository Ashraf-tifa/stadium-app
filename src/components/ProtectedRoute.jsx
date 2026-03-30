// src/components/ProtectedRoute.jsx
// ─────────────────────────────────────────────────────────────
// Protège les routes selon l'état de connexion et le rôle
// ─────────────────────────────────────────────────────────────
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <div style={loadingStyle}>Chargement...</div>

  // Non connecté → rediriger vers login
  if (!user) return <Navigate to="/auth" replace />

  // Rôle requis non correspondant
  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

const loadingStyle = {
  minHeight: '100vh', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
  fontSize: '16px', color: '#6b7280',
}


// ─────────────────────────────────────────────────────────────
// src/App.jsx — Configuration principale des routes
// ─────────────────────────────────────────────────────────────
// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
// import { AuthProvider } from './context/AuthContext'
// import ProtectedRoute from './components/ProtectedRoute'
// import AuthPage from './pages/AuthPage'
//
// function App() {
//   return (
//     <BrowserRouter>
//       <AuthProvider>
//         <Routes>
//           {/* Routes publiques */}
//           <Route path="/"     element={<HomePage />} />
//           <Route path="/auth" element={<AuthPage />} />
//           <Route path="/auth/callback" element={<AuthCallback />} />
//
//           {/* Routes protégées - Client */}
//           <Route path="/dashboard" element={
//             <ProtectedRoute>
//               <DashboardPage />
//             </ProtectedRoute>
//           } />
//
//           <Route path="/bookings" element={
//             <ProtectedRoute requiredRole="customer">
//               <BookingsPage />
//             </ProtectedRoute>
//           } />
//
//           {/* Routes protégées - Propriétaire */}
//           <Route path="/owner/*" element={
//             <ProtectedRoute requiredRole="owner">
//               <OwnerDashboard />
//             </ProtectedRoute>
//           } />
//
//           {/* Fallback */}
//           <Route path="*" element={<Navigate to="/" replace />} />
//         </Routes>
//       </AuthProvider>
//     </BrowserRouter>
//   )
// }
//
// export default App


// ─────────────────────────────────────────────────────────────
// src/pages/AuthCallback.jsx — Gère le retour OAuth Google
// ─────────────────────────────────────────────────────────────
// import { useEffect } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { supabase } from '../lib/supabase'
//
// export default function AuthCallback() {
//   const navigate = useNavigate()
//
//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       if (session) navigate('/dashboard')
//       else navigate('/auth')
//     })
//   }, [])
//
//   return <div style={loadingStyle}>Connexion en cours...</div>
// }
