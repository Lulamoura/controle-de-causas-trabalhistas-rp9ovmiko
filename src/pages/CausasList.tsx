import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { causasService } from '@/services/causas'
import { Causa, CausaStatus } from '@/types'
import { formatCurrencyBRL, formatDateBR, getStatusBadgeVariant } from '@/lib/date-utils'
import {
  Search,
  Plus,
  Filter,
  Briefcase,
  User,
  Scale,
  RefreshCw,
  Eye,
  Trash2,
  Calendar,
  Building,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'

const ALL_STATUSES: { value: string; label: string }[] = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'ajuizada', label: 'Ajuizada' },
  { value: 'em andamento', label: 'Em andamento' },
  { value: 'audiência marcada', label: 'Audiência marcada' },
  { value: 'contestação', label: 'Contestação' },
  { value: 'sentença', label: 'Sentença' },
  { value: 'recurso', label: 'Recurso' },
  { value: 'arquivada', label: 'Arquivada' },
]

export default function CausasList() {
  const { canEdit, canDelete } = useAuth()
  const [causas, setCausas] = useState<Causa[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [deleteTarget, setDeleteTarget] = useState<Causa | null>(null)
  const [deleting, setDeleting] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const loadCausas = async () => {
    try {
      setLoading(true)
      const data = await causasService.getAll()
      setCausas(data)
    } catch (error) {
      console.error('Erro ao listar causas:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar as causas trabalhistas.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCausas()
  }, [])

  const filteredCausas = useMemo(() => {
    return causas.filter((item) => {
      // Status filter
      if (statusFilter !== 'todos' && item.status !== statusFilter) {
        return false
      }

      // Text search: numero_processo, parte_contraria, vara_juizo, responsavel
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchesNumero = item.numero_processo?.toLowerCase().includes(q)
        const matchesParte = item.parte_contraria?.toLowerCase().includes(q)
        const matchesVara = item.vara_juizo?.toLowerCase().includes(q)
        const matchesResp = item.responsavel?.toLowerCase().includes(q)
        if (!matchesNumero && !matchesParte && !matchesVara && !matchesResp) {
          return false
        }
      }

      return true
    })
  }, [causas, search, statusFilter])

  const handleDelete = async () => {
    if (!deleteTarget || !canDelete) return
    try {
      setDeleting(true)
      await causasService.delete(deleteTarget.id)
      toast({
        title: 'Causa excluída',
        description: `Processo ${deleteTarget.numero_processo} foi removido com sucesso.`,
      })
      setDeleteTarget(null)
      loadCausas()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a causa.',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Causas Trabalhistas</h1>
          <p className="text-sm text-slate-600">
            Acompanhamento processual, partes envolvidas, varas do trabalho e status atual.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Button
              onClick={() => navigate('/causas/nova')}
              className="bg-blue-900 hover:bg-blue-800 text-white gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Nova Causa
            </Button>
          )}

          <Button
            variant="outline"
            onClick={loadCausas}
            disabled={loading}
            className="border-slate-300"
            title="Recarregar lista"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por número do processo, reclamante, vara ou responsável..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>

        <div className="w-full md:w-64">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              {ALL_STATUSES.map((st) => (
                <SelectItem key={st.value} value={st.value}>
                  {st.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Causas Table / Card List */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Processos Cadastrados
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Total de {filteredCausas.length} causa(s) encontrada(s)
            </CardDescription>
          </div>
          {statusFilter !== 'todos' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter('todos')}
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              Limpar filtro
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-400" />
              Carregando processos...
            </div>
          ) : filteredCausas.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Briefcase className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-base font-semibold text-slate-800">Nenhuma causa encontrada</p>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                {search || statusFilter !== 'todos'
                  ? 'Nenhum processo corresponde aos filtros aplicados. Tente ajustar os termos.'
                  : 'Nenhuma causa cadastrada ainda.'}
              </p>
              {canEdit && (
                <Button
                  onClick={() => navigate('/causas/nova')}
                  className="bg-blue-900 text-white mt-2"
                >
                  <Plus className="mr-1 h-4 w-4" /> Cadastrar Causa
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Número do Processo</th>
                    <th className="py-3 px-4 font-semibold">Parte Contrária</th>
                    <th className="py-3 px-4 font-semibold">Vara / Juízo</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Valor da Causa</th>
                    <th className="py-3 px-4 font-semibold">Responsável</th>
                    <th className="py-3 px-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCausas.map((causa) => {
                    const badge = getStatusBadgeVariant(causa.status)

                    return (
                      <tr key={causa.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                          <Link
                            to={`/causas/${causa.id}`}
                            className="text-blue-900 hover:underline font-semibold block"
                          >
                            {causa.numero_processo}
                          </Link>
                          <span className="text-[11px] text-slate-400">
                            Cadastrada em {formatDateBR(causa.created)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-800 font-medium">
                          {causa.parte_contraria}
                        </td>
                        <td
                          className="py-3.5 px-4 text-slate-600 max-w-[200px] truncate"
                          title={causa.vara_juizo}
                        >
                          {causa.vara_juizo}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap font-medium">
                          {formatCurrencyBRL(causa.valor_causa)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                          {causa.responsavel}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/causas/${causa.id}`)}
                              className="h-8 text-blue-900 hover:text-blue-700 hover:bg-blue-50"
                              title="Visualizar ou editar detalhes"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              <span className="text-xs">Ver</span>
                            </Button>

                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteTarget(causa)}
                                className="h-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                                title="Excluir causa (Superadmin)"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Deletion (Superadmin only) */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Causa Trabalhista?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá permanentemente o processo{' '}
              <strong>{deleteTarget?.numero_processo}</strong> ({deleteTarget?.parte_contraria}) e
              todas as suas audiências e prazos vinculados. Apenas o superadministrador pode
              realizar esta operação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Excluindo...' : 'Sim, Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
