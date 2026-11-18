/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import Layout from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'

// Pages
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ConfirmEmailChange from './pages/ConfirmEmailChange'
import CausasList from './pages/CausasList'
import CausaNova from './pages/CausaNova'
import CausaDetalhe from './pages/CausaDetalhe'
import UsuariosPage from './pages/Usuarios'
import Cadastros from './pages/Cadastros'
import MinhaConta from './pages/MinhaConta'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/recuperar-senha" element={<ForgotPassword />} />
            <Route path="/redefinir-senha" element={<ResetPassword />} />
            <Route path="/confirmar-troca-email" element={<ConfirmEmailChange />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/causas"
              element={
                <ProtectedRoute>
                  <CausasList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/causas/nova"
              element={
                <ProtectedRoute>
                  <CausaNova />
                </ProtectedRoute>
              }
            />

            <Route
              path="/causas/:id"
              element={
                <ProtectedRoute>
                  <CausaDetalhe />
                </ProtectedRoute>
              }
            />

            <Route
              path="/minha-conta"
              element={
                <ProtectedRoute>
                  <MinhaConta />
                </ProtectedRoute>
              }
            />

            <Route
              path="/usuarios"
              element={
                <ProtectedRoute requiredRole="superadmin">
                  <UsuariosPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/cadastros"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Cadastros />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
