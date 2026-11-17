import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import {
  Scale,
  LayoutDashboard,
  Briefcase,
  Users,
  LogOut,
  Bell,
  User as UserIcon,
  ShieldCheck,
  ShieldAlert,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function AppNavbar() {
  const { user, signOut, isSuperadmin } = useAuth()
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const getRoleBadge = (role?: string) => {
    if (role === 'superadmin') {
      return (
        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200 gap-1 text-xs font-semibold">
          <ShieldAlert className="w-3 h-3" /> Superadmin
        </Badge>
      )
    }
    if (role === 'admin') {
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 gap-1 text-xs font-semibold">
          <ShieldCheck className="w-3 h-3" /> Admin
        </Badge>
      )
    }
    return (
      <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200 gap-1 text-xs">
        <Eye className="w-3 h-3" /> Leitura
      </Badge>
    )
  }

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="p-2 bg-blue-600 rounded-lg group-hover:bg-blue-500 transition-colors">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-white block leading-tight">
                  Causas Trabalhistas
                </span>
                <span className="text-[11px] text-slate-400 block leading-none">
                  Gestão Jurídica Corporativa
                </span>
              </div>
            </Link>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  isActive('/')
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Painel
              </Link>

              <Link
                to="/causas"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  isActive('/causas')
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Briefcase className="h-4 w-4" />
                Causas
              </Link>

              {isSuperadmin && (
                <Link
                  to="/usuarios"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive('/usuarios')
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  Usuários
                </Link>
              )}

              <Link
                to="/minha-conta"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  isActive('/minha-conta')
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <UserIcon className="h-4 w-4" />
                Minha Conta
              </Link>
            </nav>
          </div>

          {/* User & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-200 max-w-[180px] truncate">
                  {user?.name}
                </span>
                {getRoleBadge(user?.role)}
              </div>
              <span className="text-xs text-slate-400 max-w-[200px] truncate">{user?.email}</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-slate-300 hover:text-white hover:bg-slate-800 gap-1.5"
              title="Sair do sistema"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>

        {/* Mobile Nav Links */}
        <div className="md:hidden flex items-center gap-1 pb-3 pt-1 border-t border-slate-800/60">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 ${
              isActive('/') ? 'bg-slate-800 text-white' : 'text-slate-300'
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Painel
          </Link>
          <Link
            to="/causas"
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 ${
              isActive('/causas') ? 'bg-slate-800 text-white' : 'text-slate-300'
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            Causas
          </Link>
          {isSuperadmin && (
            <Link
              to="/usuarios"
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 ${
                isActive('/usuarios') ? 'bg-slate-800 text-white' : 'text-slate-300'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Usuários
            </Link>
          )}
          <Link
            to="/minha-conta"
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 ${
              isActive('/minha-conta') ? 'bg-slate-800 text-white' : 'text-slate-300'
            }`}
          >
            <UserIcon className="h-3.5 w-3.5" />
            Minha Conta
          </Link>
        </div>
      </div>
    </header>
  )
}
