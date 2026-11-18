import { Outlet, useLocation } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'
import { useAuth } from '@/hooks/use-auth'

export default function Layout() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  // Pages that don't need sidebar (login, forgot password, etc.)
  const isPublicAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/recuperar-senha' ||
    location.pathname === '/redefinir-senha' ||
    location.pathname === '/confirmar-troca-email'

  const withSidebar = !isPublicAuthPage && isAuthenticated

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {withSidebar ? (
        <div className="flex min-h-screen">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">
              <Outlet />
            </main>
            <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
              <div className="px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span>Controle de Causas Trabalhistas &copy; {new Date().getFullYear()}</span>
                <span>Sistema corporativo de gestão processual e prazos judiciais</span>
              </div>
            </footer>
          </div>
        </div>
      ) : (
        <div className="flex flex-col min-h-screen">
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      )}
    </div>
  )
}
