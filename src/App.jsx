// src/App.jsx
import { Component, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

const AuthPage          = lazy(() => import('./pages/AuthPage'))
const OwnerDashboard    = lazy(() => import('./pages/owner/OwnerDashboard'))
const AdminDashboard    = lazy(() => import('./pages/admin/AdminDashboard'))
const BookingPublicPage = lazy(() => import('./pages/public/BookingPublicPage'))
const LandingPage       = lazy(() => import('./pages/LandingPage'))
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
          <div className="max-w-lg text-center bg-white p-6 rounded-xl shadow">
            <h1 className="text-xl font-bold mb-2">Une erreur est survenue</h1>
            <p className="text-sm text-gray-600 mb-4">
              Merci de rafraîchir la page. Si le problème persiste, contactez le support.
            </p>
            <pre className="text-xs text-red-600 overflow-auto max-h-40">{String(this.state.error)}</pre>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// Redirection intelligente selon le rôle
function SmartRedirect() {
  const { user, profile, loading } = useAuth()

  // ✅ انتظر حتى يكتمل التحميل
  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#080c08'
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid #16a34a', borderTopColor: 'transparent',
        animation: 'spin 0.8s linear infinite'
      }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  // ✅ انتظر profile إذا كان user موجود
  if (user && !profile) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#080c08'
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid #16a34a', borderTopColor: 'transparent',
        animation: 'spin 0.8s linear infinite'
      }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!user) return <Navigate to="/auth" replace/>
  if (profile?.role === 'admin') return <Navigate to="/admin"           replace/>
  if (profile?.role === 'owner') return <Navigate to="/dashboard/owner" replace/>
  return <Navigate to="/auth" replace/>
}
// Route protégée par rôle
function PrivateRoute({ children, role }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <Spinner/>
  if (!user) return <Navigate to="/auth" replace/>
  if (role && profile?.role !== role) return <Navigate to="/auth" replace/>
  return children
}

function Spinner() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#080c08'
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid #16a34a', borderTopColor: 'transparent',
        animation: 'spin 0.8s linear infinite'
      }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <Suspense fallback={<Spinner/>}>
          <Routes>
          <Route path="/"     element={<LandingPage/>}/>
          <Route path="/app"  element={<SmartRedirect/>}/>
          <Route path="/auth" element={<AuthPage/>}/>

          {/* Admin */}
          <Route path="/admin" element={
            <PrivateRoute role="admin"><AdminDashboard/></PrivateRoute>
          }/>

          {/* Owner */}
          <Route path="/dashboard/owner" element={
            <PrivateRoute role="owner"><OwnerDashboard/></PrivateRoute>
          }/>

         
          <Route path="/dashboard" element={<Navigate to="/app" replace/>}/>
          <Route path="/book/:ownerId" element={<BookingPublicPage/>}/>
          <Route path="*"          element={<Navigate to="/" replace/>}/>
        </Routes>
          </Suspense>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
