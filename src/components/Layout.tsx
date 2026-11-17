import { Outlet, useLocation } from 'react-router-dom'
import { AppNavbar } from './AppNavbar'
import { useAuth } from '@/hooks/use-auth'

export default function Layout() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  // Pages that don't need navbar (login, forgot password, etc.)
  const isPublicAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/recuperar-senha' ||
    location.pathname === '/redefinir-senha' ||
    location.pathname === '/confirmar-troca-email'

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      {!isPublicAuthPage && isAuthenticated && <AppNavbar />}
      <main
        className={`flex-1 ${!isPublicAuthPage && isAuthenticated ? 'max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6' : ''}`}
      >
        <Outlet />
      </main>
      {!isPublicAuthPage && isAuthenticated && (
        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Controle de Causas Trabalhistas &copy; {new Date().getFullYear()}</span>
            <span>Sistema corporativo de gestão processual e prazos judiciais</span>
          </div>
        </footer>
      )}
    </div>
  )
}
