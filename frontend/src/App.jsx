import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CiudadanoPortal from './pages/CiudadanoPortal'
import Tramites from './pages/Tramites'
import Alertas from './pages/Alertas'
import Reportes from './pages/Reportes'
import Perfil from './pages/Perfil'
import Layout from './components/Layout/Layout'
import LoadingSpinner from './components/ui/LoadingSpinner'
import './App.css'

// Configurar React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
})

function ProtectedRoute({ children, requiredRoles = [] }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-municipal-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.rol)) {
    return <Navigate to="/portal" replace />
  }
  
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-municipal-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  
  if (user) {
    const redirectTo = user.rol === 'ciudadano' ? '/portal' : '/dashboard'
    return <Navigate to={redirectTo} replace />
  }
  
  return children
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      
      {/* Rutas protegidas - Ciudadanos */}
      <Route path="/portal" element={
        <ProtectedRoute>
          <Layout>
            <CiudadanoPortal />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Rutas protegidas - Personal Municipal */}
      <Route path="/dashboard" element={
        <ProtectedRoute requiredRoles={['administrativo', 'supervisor', 'admin']}>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/tramites" element={
        <ProtectedRoute>
          <Layout>
            <Tramites />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/alertas" element={
        <ProtectedRoute requiredRoles={['administrativo', 'supervisor', 'admin']}>
          <Layout>
            <Alertas />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/reportes" element={
        <ProtectedRoute requiredRoles={['supervisor', 'admin']}>
          <Layout>
            <Reportes />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/perfil" element={
        <ProtectedRoute>
          <Layout>
            <Perfil />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Ruta por defecto */}
      <Route path="/" element={
        <Navigate to={user?.rol === 'ciudadano' ? '/portal' : '/dashboard'} replace />
      } />
      
      {/* Ruta 404 */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center bg-municipal-background">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
            <p className="text-xl text-gray-600 mb-8">Página no encontrada</p>
            <a href="/" className="btn-primary">
              Volver al Inicio
            </a>
          </div>
        </div>
      } />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App