import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import {
  Scale,
  LayoutDashboard,
  Briefcase,
  Users,
  LogOut,
  User as UserIcon,
  FolderKanban,
  BarChart3,
  ShieldCheck,
  ShieldAlert,
  Eye,
  ChevronLeft,
  Menu,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const SIDEBAR_COLLAPSED_KEY = 'sidebar:collapsed'

const NAV_ITEMS = [
  { to: '/', label: 'Painel', icon: LayoutDashboard, exact: true },
  { to: '/causas', label: 'Causas', icon: Briefcase, exact: false },
  { to: '/cadastros', label: 'Cadastros', icon: FolderKanban, exact: false, adminOnly: true },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3, exact: false, adminOnly: true },
  { to: '/usuarios', label: 'Usuários', icon: Users, exact: false, superadminOnly: true },
]

type SidebarContentProps = {
  collapsed: boolean
  onNavigate?: () => void
}

function getRoleBadge(role?: string) {
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

function SidebarContent({ collapsed, onNavigate }: SidebarContentProps) {
  const { user, signOut, canEdit, isSuperadmin } = useAuth()
  const location = useLocation()

  const isActive = (to: string, exact: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to)

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.superadminOnly) return isSuperadmin
    if (item.adminOnly) return canEdit
    return true
  })

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Logo & Brand */}
      <div
        className={cn(
          'flex items-center h-16 border-b border-slate-800 shrink-0',
          collapsed ? 'justify-center px-2' : 'px-4 gap-2.5',
        )}
      >
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-2.5 group min-w-0"
          title="Causas Trabalhistas"
        >
          <div className="p-2 bg-blue-600 rounded-lg group-hover:bg-blue-500 transition-colors shrink-0">
            <Scale className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="font-bold text-sm tracking-tight text-white block leading-tight truncate">
                Causas Trabalhistas
              </span>
              <span className="text-[11px] text-slate-400 block leading-none truncate">
                Gestão Jurídica Corporativa
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Nav Links */}
      <nav className={cn('flex-1 overflow-y-auto py-3', collapsed ? 'px-2' : 'px-3')}>
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.to, item.exact)
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={onNavigate}
                  title={item.label}
                  className={cn(
                    'flex items-center rounded-md text-sm font-medium transition-colors',
                    collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
                    active
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User info & actions */}
      <div
        className={cn(
          'border-t border-slate-800 py-3 space-y-1 shrink-0',
          collapsed ? 'px-2' : 'px-3',
        )}
      >
        {collapsed ? (
          <>
            <Link
              to="/minha-conta"
              onClick={onNavigate}
              title="Minha Conta"
              className={cn(
                'flex items-center justify-center p-2.5 rounded-md text-sm font-medium transition-colors',
                isActive('/minha-conta', false)
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60',
              )}
            >
              <UserIcon className="h-4 w-4 shrink-0" />
            </Link>
            <button
              type="button"
              onClick={signOut}
              title="Sair do sistema"
              className="w-full flex items-center justify-center p-2.5 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
            </button>
          </>
        ) : (
          <>
            <Link
              to="/minha-conta"
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive('/minha-conta', false)
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60',
              )}
            >
              <UserIcon className="h-4 w-4 shrink-0" />
              <span className="flex-1 min-w-0">
                <span className="block truncate leading-tight">{user?.name}</span>
                <span className="block text-[11px] text-slate-400 truncate leading-tight">
                  {user?.email}
                </span>
              </span>
            </Link>
            <div className="px-3 pt-1">{getRoleBadge(user?.role)}</div>
            <button
              type="button"
              onClick={signOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sair
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { signOut } = useAuth()

  // Fecha o drawer do mobile ao navegar
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0')
      } catch {
        // localStorage indisponível: estado apenas em memória
      }
      return next
    })
  }

  return (
    <>
      {/* ===== Desktop: sidebar fixa à esquerda ===== */}
      <aside
        className={cn(
          'hidden md:flex flex-col shrink-0 h-screen sticky top-0 transition-[width] duration-200 ease-in-out',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        <SidebarContent collapsed={collapsed} />

        {/* Botão recolher/expandir */}
        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className="absolute top-[72px] -right-3 z-20 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white border-2 border-slate-50 shadow-md hover:bg-blue-500 transition-colors"
        >
          <ChevronLeft
            className={cn('h-3.5 w-3.5 transition-transform', collapsed && 'rotate-180')}
          />
        </button>
      </aside>

      {/* ===== Mobile: barra superior com hamburger + drawer ===== */}
      <div className="md:hidden sticky top-0 z-40">
        <header className="bg-slate-900 text-white border-b border-slate-800 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Abrir menu"
                className="p-2 -ml-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
              <Link to="/" className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 bg-blue-600 rounded-lg shrink-0">
                  <Scale className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-sm tracking-tight truncate">
                  Causas Trabalhistas
                </span>
              </Link>
            </div>
            <button
              type="button"
              onClick={signOut}
              aria-label="Sair do sistema"
              className="p-2 -mr-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 w-full h-full bg-slate-900/60 backdrop-blur-sm"
            />
            <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl animate-in slide-in-from-left duration-200">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu"
                className="absolute top-4 right-3 z-10 p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
