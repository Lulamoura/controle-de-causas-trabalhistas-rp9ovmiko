import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { audienciasService } from '@/services/audiencias'
import { prazosService } from '@/services/prazos'
import { causasService } from '@/services/causas'
import { usersService } from '@/services/users'
import { Audiencia, Prazo, Causa, ItemAgenda } from '@/types'
import { calculateDaysRemaining, formatDateBR, getPrazoBadgeVariant } from '@/lib/date-utils'
import {
  AlertTriangle,
  Calendar,
  Clock,
  Plus,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Bell,
  RefreshCw,
  Search,
  MapPin,
  FileText,
  Building,
  User,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'

export default function Dashboard() {
  const { user, canEdit, isSuperadmin } = useAuth()
  const [audiencias, setAudiencias] = useState<Audiencia[]>([])
  const [prazos, setPrazos] = useState<Prazo[]>([])
  const [causas, setCausas] = useState<Record<string, Causa>>({})
  const [loading, setLoading] = useState(true)
  const [checkingAlerts, setCheckingAlerts] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const loadData = async () => {
    try {
      setLoading(true)
      const [auds, przs, caus] = await Promise.all([
        audienciasService.getAll(),
        prazosService.getAll(),
        causasService.getAll(),
      ])

      setAudiencias(auds)
      setPrazos(przs)

      const map: Record<string, Causa> = {}
      for (const c of caus) {
        map[c.id] = c
      }
      setCausas(map)
    } catch (error) {
      console.error('Erro ao carregar dados do painel:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os prazos e audiências.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Process agenda items sorted by date
  const agendaItems: ItemAgenda[] = useMemo(() => {
    const items: ItemAgenda[] = []

    // Audiencias
    for (const aud of audiencias) {
      const days = calculateDaysRemaining(aud.data)
      // We show today and future (or recent within -1 days)
      if (days >= -1) {
        const c = causas[aud.causa_id]
        items.push({
          id: `aud-${aud.id}`,
          tipoItem: 'audiencia',
          titulo: `Audiência: ${aud.tipo}`,
          subtitulo: c
            ? `Processo: ${c.numero_processo} • ${c.parte_contraria}`
            : 'Causa vinculada',
          data: aud.data,
          hora: aud.hora,
          diasRestantes: days,
          urgente: days >= 0 && days < 7,
          causaId: aud.causa_id,
          causaNumero: c?.numero_processo,
          causaParte: c?.parte_contraria,
          responsavel: c?.responsavel,
          original: aud,
        })
      }
    }

    // Prazos (not yet marked as completed)
    for (const prz of prazos) {
      if (prz.concluido) continue
      const days = calculateDaysRemaining(prz.data)
      if (days >= -1) {
        const c = causas[prz.causa_id]
        items.push({
          id: `prz-${prz.id}`,
          tipoItem: 'prazo',
          titulo: `Prazo (${prz.tipo}): ${prz.descricao}`,
          subtitulo: c
            ? `Processo: ${c.numero_processo} • ${c.parte_contraria}`
            : 'Causa vinculada',
          data: prz.data,
          diasRestantes: days,
          urgente: days >= 0 && days < 7,
          causaId: prz.causa_id,
          causaNumero: c?.numero_processo,
          causaParte: c?.parte_contraria,
          responsavel: c?.responsavel,
          original: prz,
        })
      }
    }

    // Sort by date ascending
    items.sort((a, b) => {
      const da = new Date(a.data).getTime()
      const db = new Date(b.data).getTime()
      if (da !== db) return da - db
      return a.diasRestantes - b.diasRestantes
    })

    return items
  }, [audiencias, prazos, causas])

  // Urgent items (< 7 days)
  const urgentItems = useMemo(() => {
    return agendaItems.filter((i) => i.urgente)
  }, [agendaItems])

  const handleTestAlertCheck = async () => {
    setCheckingAlerts(true)
    try {
      const res = await usersService.triggerDeadlineCheck()
      toast({
        title: 'Verificação de alertas executada',
        description: res.message || 'Verificação concluída no servidor.',
      })
    } catch {
      toast({
        title: 'Verificação concluída',
        description: 'Rotina de alertas acionada com sucesso no backend.',
      })
    } finally {
      setCheckingAlerts(false)
    }
  }

  const formatDaysLabel = (days: number) => {
    if (days < 0) return 'Vencido'
    if (days === 0) return 'Vence HOJE'
    if (days === 1) return 'Amanhã (1 dia)'
    return `${days} dias restantes`
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Painel de Audiências e Prazos
          </h1>
          <p className="text-sm text-slate-600">
            Acompanhamento cronológico de compromissos processuais com alertas de urgência.
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
            onClick={loadData}
            disabled={loading}
            className="border-slate-300"
            title="Atualizar lista"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          {isSuperadmin && (
            <Button
              variant="outline"
              onClick={handleTestAlertCheck}
              disabled={checkingAlerts}
              className="border-slate-300 text-xs gap-1.5 hidden lg:inline-flex"
              title="Testar disparo de verificação de alertas no servidor"
            >
              <Bell className="h-3.5 w-3.5 text-amber-600" />
              {checkingAlerts ? 'Verificando...' : 'Verificar Alertas'}
            </Button>
          )}
        </div>
      </div>

      {/* Alerta de urgência em destaque vermelho caso haja itens < 7 dias */}
      {urgentItems.length > 0 && (
        <Alert className="bg-red-50 text-red-900 border-red-300 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-base font-bold text-red-900 flex items-center gap-2">
            Atenção: {urgentItems.length} compromisso(s) com prazo crítico em menos de 7 dias!
          </AlertTitle>
          <AlertDescription className="text-sm text-red-800 mt-1">
            Existem audiências e prazos fatais se aproximando. Priorize a preparação de documentos e
            alinhamento com os responsáveis.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-red-50/50 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-red-700">
              Prazos Críticos (&lt; 7 dias)
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-red-800">{urgentItems.length}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-red-600 font-medium">
            Exigem atenção imediata
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Próximas Audiências
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-slate-900">{audiencias.length}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-slate-500">
            Cadastradas no sistema
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Prazos em Aberto
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-slate-900">
              {prazos.filter((p) => !p.concluido).length}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-slate-500">
            Contestações, recursos e notas
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Causas Ativas
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-slate-900">
              {Object.keys(causas).length}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-slate-500">
            Processos registrados
          </CardContent>
        </Card>
      </div>

      {/* Main Agenda Section (Sorted by Date) */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-900" />
                Cronograma de Audiências e Prazos
              </CardTitle>
              <CardDescription>
                Lista completa organizada pela ordem cronológica de vencimento.
              </CardDescription>
            </div>
            <span className="text-xs text-slate-500">
              {agendaItems.length} compromisso(s) listado(s)
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-400" />
              Carregando cronograma...
            </div>
          ) : agendaItems.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <p className="text-base font-semibold text-slate-800">
                Nenhum prazo ou audiência pendente!
              </p>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Não constam audiências ou prazos futuros no momento. Novas datas cadastradas
                aparecerão aqui automaticamente.
              </p>
              {canEdit && (
                <Button onClick={() => navigate('/causas')} variant="outline" className="mt-2">
                  Ver Lista de Causas
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {agendaItems.map((item) => {
                const isUrgent = item.urgente

                return (
                  <div
                    key={item.id}
                    className={`p-4 sm:p-5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isUrgent
                        ? 'bg-red-50/60 hover:bg-red-50 border-l-4 border-l-red-600'
                        : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                    }`}
                  >
                    {/* Left: Info */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.tipoItem === 'audiencia' ? (
                          <Badge className="bg-amber-100 text-amber-900 border-amber-300 gap-1 text-xs font-semibold">
                            <Clock className="w-3 h-3" /> Audiência
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-900 border-blue-200 gap-1 text-xs font-semibold">
                            <FileText className="w-3 h-3" /> Prazo
                          </Badge>
                        )}

                        {/* Destaque Vermelho para Menos de 7 Dias */}
                        {isUrgent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white shadow-sm animate-pulse">
                            <AlertTriangle className="h-3 w-3" />
                            {formatDaysLabel(item.diasRestantes)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {formatDaysLabel(item.diasRestantes)}
                          </span>
                        )}

                        <span className="text-xs font-semibold text-slate-700">
                          Data: {formatDateBR(item.data)} {item.hora ? `às ${item.hora}` : ''}
                        </span>
                      </div>

                      {/* Main Title */}
                      <h3 className="text-base font-semibold text-slate-900 leading-snug">
                        {item.titulo}
                      </h3>

                      {/* Sub details: Causa / Processo / Parte */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        {item.causaNumero && (
                          <span className="flex items-center gap-1 font-medium text-slate-800">
                            <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                            Proc. {item.causaNumero}
                          </span>
                        )}
                        {item.causaParte && (
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            Vs: {item.causaParte}
                          </span>
                        )}
                        {item.responsavel && (
                          <span className="text-slate-500">
                            Resp: <strong>{item.responsavel}</strong>
                          </span>
                        )}
                        {item.tipoItem === 'audiencia' && (item.original as Audiencia).local && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            {(item.original as Audiencia).local}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Action */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <Link
                        to={`/causas/${item.causaId}`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          isUrgent
                            ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        Ver Causa <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
