import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'

import { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: 'superadmin' | 'admin' | 'leitura'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-900 mb-2" />
        <span className="text-sm">Carregando permissões...</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Hierarquia de perfis: superadmin > admin > leitura.
  // requiredRole="superadmin" libera só superadmin; "admin" libera admin e
  // superadmin; "leitura" (ou ausente) libera qualquer usuário autenticado.
  const hierarquia: Record<string, number> = { leitura: 1, admin: 2, superadmin: 3 }
  if (requiredRole) {
    const perfilAtual = hierarquia[user?.role ?? 'leitura'] ?? 0
    const minimo = hierarquia[requiredRole] ?? 0
    if (perfilAtual < minimo) {
      return <Navigate to="/" replace />
    }
  }

  return children
}
