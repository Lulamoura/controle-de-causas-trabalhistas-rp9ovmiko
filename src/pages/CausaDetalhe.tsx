import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { causasService } from '@/services/causas'
import { audienciasService } from '@/services/audiencias'
import { prazosService } from '@/services/prazos'
import { clientesService, funcoesService } from '@/services/cadastros'
import {
  Causa,
  Audiencia,
  Prazo,
  CausaStatus,
  PrazoTipo,
  FaseProcesso,
  Cliente,
  FuncaoReclamante,
} from '@/types'
import { FASES_PROCESSO, FASE_INICIAL, getFaseInfo, getFaseBadgeClass } from '@/lib/fases'
import { recalcularFaseCausa } from '@/lib/fases-frontend'
import { FasesTimeline, FaseAtualBadge } from '@/components/FasesProcesso'
import { DocumentosProcesso } from '@/components/DocumentosProcesso'
import {
  formatDateBR,
  formatCurrencyBRL,
  getStatusBadgeVariant,
  getPrazoBadgeVariant,
  calculateDaysRemaining,
} from '@/lib/date-utils'
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Building,
  User,
  DollarSign,
  FileText,
  MapPin,
  RefreshCw,
  X,
  Check,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

const STATUS_OPTIONS: { value: CausaStatus; label: string }[] = [
  { value: 'ajuizada', label: 'Ajuizada' },
  { value: 'em andamento', label: 'Em andamento' },
  { value: 'audiência marcada', label: 'Audiência marcada' },
  { value: 'contestação', label: 'Contestação' },
  { value: 'sentença', label: 'Sentença' },
  { value: 'recurso', label: 'Recurso' },
  { value: 'arquivada', label: 'Arquivada' },
]

const PRAZO_TIPOS: { value: PrazoTipo; label: string }[] = [
  { value: 'audiência', label: 'Audiência' },
  { value: 'contestação', label: 'Contestação' },
  { value: 'sentença', label: 'Sentença' },
  { value: 'recurso', label: 'Recurso' },
  { value: 'outro', label: 'Outro' },
]

export default function CausaDetalhe() {
  const { id } = useParams<{ id: string }>()
  const { canEdit, canDelete } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [causa, setCausa] = useState<Causa | null>(null)
  const [audiencias, setAudiencias] = useState<Audiencia[]>([])
  const [prazos, setPrazos] = useState<Prazo[]>([])
  const [loading, setLoading] = useState(true)

  // Edit Causa State
  const [isEditingCausa, setIsEditingCausa] = useState(false)
  const [editNumero, setEditNumero] = useState('')
  const [editVara, setEditVara] = useState('')
  const [editParte, setEditParte] = useState('')
  const [editStatus, setEditStatus] = useState<CausaStatus>('ajuizada')
  const [editValor, setEditValor] = useState('')
  const [editResponsavel, setEditResponsavel] = useState('')
  const [editObservacoes, setEditObservacoes] = useState('')
  const [editCliente, setEditCliente] = useState<string>('')
  const [editFuncao, setEditFuncao] = useState<string>('')
  const [savingCausa, setSavingCausa] = useState(false)

  // Cadastros (clientes / funções) para os combos
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [funcoes, setFuncoes] = useState<FuncaoReclamante[]>([])

  useEffect(() => {
    const carregarCadastros = async () => {
      try {
        const [cls, fns] = await Promise.all([
          clientesService.getAll(true),
          funcoesService.getAll(true),
        ])
        setClientes(cls as Cliente[])
        setFuncoes(fns as FuncaoReclamante[])
      } catch (error) {
        console.error('Erro ao carregar cadastros (clientes/funções):', error)
      }
    }
    carregarCadastros()
  }, [])

  // Modals for Audiencia / Prazo
  const [audienciaModalOpen, setAudienciaModalOpen] = useState(false)
  const [editingAudiencia, setEditingAudiencia] = useState<Audiencia | null>(null)
  const [audData, setAudData] = useState('')
  const [audHora, setAudHora] = useState('14:00')
  const [audLocal, setAudLocal] = useState('')
  const [audTipo, setAudTipo] = useState('')
  const [audPrazoPrep, setAudPrazoPrep] = useState('')
  const [audObs, setAudObs] = useState('')
  const [audFase, setAudFase] = useState<FaseProcesso>(FASE_INICIAL)
  const [audFaseObs, setAudFaseObs] = useState('')
  const [savingAud, setSavingAud] = useState(false)

  const [prazoModalOpen, setPrazoModalOpen] = useState(false)
  const [editingPrazo, setEditingPrazo] = useState<Prazo | null>(null)
  const [przTipo, setPrzTipo] = useState<PrazoTipo>('contestação')
  const [przData, setPrzData] = useState('')
  const [przDescricao, setPrzDescricao] = useState('')
  const [przConcluido, setPrzConcluido] = useState(false)
  const [savingPrz, setSavingPrz] = useState(false)

  // Deletion targets
  const [deleteAudTarget, setDeleteAudTarget] = useState<Audiencia | null>(null)
  const [deletePrzTarget, setDeletePrzTarget] = useState<Prazo | null>(null)
  const [deleteCausaTarget, setDeleteCausaTarget] = useState<boolean>(false)
  const [deletingItem, setDeletingItem] = useState(false)

  const loadAll = async () => {
    if (!id) return
    try {
      setLoading(true)
      const [c, auds, przs] = await Promise.all([
        causasService.getById(id),
        audienciasService.getByCausa(id),
        prazosService.getByCausa(id),
      ])
      setCausa(c)
      setAudiencias(auds)
      setPrazos(przs)

      // Sync edit inputs
      setEditNumero(c.numero_processo)
      setEditVara(c.vara_juizo)
      setEditParte(c.parte_contraria)
      setEditStatus(c.status)
      setEditValor(c.valor_causa ? String(c.valor_causa) : '')
      setEditResponsavel(c.responsavel)
      setEditObservacoes(c.observacoes || '')
      setEditCliente(c.cliente || '')
      setEditFuncao(c.funcao_reclamante || '')
    } catch (error) {
      console.error('Erro ao carregar causa:', error)
      toast({
        variant: 'destructive',
        title: 'Causa não encontrada',
        description: 'Não foi possível encontrar a causa selecionada.',
      })
      navigate('/causas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [id])

  const handleSaveCausa = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!causa || !canEdit) return

    try {
      setSavingCausa(true)
      const parsedValor = editValor ? parseFloat(editValor.replace(',', '.')) : undefined

      const updated = await causasService.update(causa.id, {
        numero_processo: editNumero.trim(),
        vara_juizo: editVara.trim(),
        parte_contraria: editParte.trim(),
        status: editStatus,
        valor_causa: isNaN(Number(parsedValor)) ? undefined : Number(parsedValor),
        responsavel: editResponsavel.trim(),
        observacoes: editObservacoes.trim() || undefined,
        cliente: editCliente || undefined,
        funcao_reclamante: editFuncao || undefined,
      })

      setCausa(updated)
      setIsEditingCausa(false)
      toast({
        title: 'Causa atualizada',
        description: 'Os dados do processo foram salvos com sucesso.',
      })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: 'Não foi possível salvar as alterações na causa.',
      })
    } finally {
      setSavingCausa(false)
    }
  }

  // --- Audiência handlers ---
  const openNewAudienciaModal = () => {
    setEditingAudiencia(null)
    setAudData(new Date().toISOString().split('T')[0])
    setAudHora('14:00')
    setAudLocal(causa ? causa.vara_juizo : '')
    setAudTipo('Instrução e Julgamento')
    setAudPrazoPrep('5')
    setAudObs('')
    setAudFase(FASE_INICIAL)
    setAudFaseObs('')
    setAudienciaModalOpen(true)
  }

  const openEditAudienciaModal = (aud: Audiencia) => {
    setEditingAudiencia(aud)
    setAudData(aud.data ? aud.data.split('T')[0] : '')
    setAudHora(aud.hora || '14:00')
    setAudLocal(aud.local)
    setAudTipo(aud.tipo)
    setAudPrazoPrep(aud.prazo_preparacao_dias ? String(aud.prazo_preparacao_dias) : '')
    setAudObs(aud.observacoes || '')
    setAudFase(getFaseInfo(aud.fase).value)
    setAudFaseObs(aud.observacao_fase || '')
    setAudienciaModalOpen(true)
  }

  const handleSaveAudiencia = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !canEdit) return
    if (!audData || !audHora || !audLocal || !audTipo) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Preencha data, hora, local e tipo da audiência.',
      })
      return
    }

    try {
      setSavingAud(true)
      const prepDays = audPrazoPrep ? parseInt(audPrazoPrep, 10) : undefined

      if (editingAudiencia) {
        await audienciasService.update(editingAudiencia.id, {
          data: `${audData} 12:00:00.000Z`,
          hora: audHora,
          local: audLocal.trim(),
          tipo: audTipo.trim(),
          prazo_preparacao_dias: isNaN(Number(prepDays)) ? undefined : prepDays,
          observacoes: audObs.trim() || undefined,
          fase: audFase,
          observacao_fase: audFaseObs.trim() || undefined,
        })
      } else {
        await audienciasService.create({
          causa_id: id,
          data: `${audData} 12:00:00.000Z`,
          hora: audHora,
          local: audLocal.trim(),
          tipo: audTipo.trim(),
          prazo_preparacao_dias: isNaN(Number(prepDays)) ? undefined : prepDays,
          observacoes: audObs.trim() || undefined,
          fase: audFase,
          observacao_fase: audFaseObs.trim() || undefined,
        })
      }

      // Recalcula a fase da causa no FRONTEND (fase da audiência mais recente)
      // e atualiza o campo fase_atual diretamente pela API do PocketBase.
      const causaAtualizada = await recalcularFaseCausa(id)

      toast({
        title: editingAudiencia
          ? 'Audiência atualizada com sucesso!'
          : 'Audiência agendada com sucesso!',
        description: causaAtualizada
          ? `Fase do processo atualizada para: ${causaAtualizada.fase_atual}.`
          : 'A fase do processo foi recalculada com base na audiência mais recente.',
      })

      setAudienciaModalOpen(false)
      loadAll()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar audiência',
        description: 'Verifique as informações fornecidas.',
      })
    } finally {
      setSavingAud(false)
    }
  }

  const handleDeleteAudiencia = async () => {
    if (!deleteAudTarget || !canDelete) return
    try {
      setDeletingItem(true)
      await audienciasService.delete(deleteAudTarget.id)

      // Recalcula a fase da causa no FRONTEND (fase da audiência restante
      // mais recente por data) e grava o campo fase_atual diretamente.
      await recalcularFaseCausa(id)

      toast({ title: 'Audiência excluída com sucesso.' })
      setDeleteAudTarget(null)
      loadAll()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir audiência',
      })
    } finally {
      setDeletingItem(false)
    }
  }

  // --- Prazos handlers ---
  const openNewPrazoModal = () => {
    setEditingPrazo(null)
    setPrzTipo('contestação')
    setPrzData(new Date().toISOString().split('T')[0])
    setPrzDescricao('')
    setPrzConcluido(false)
    setPrazoModalOpen(true)
  }

  const openEditPrazoModal = (prz: Prazo) => {
    setEditingPrazo(prz)
    setPrzTipo(prz.tipo)
    setPrzData(prz.data ? prz.data.split('T')[0] : '')
    setPrzDescricao(prz.descricao)
    setPrzConcluido(Boolean(prz.concluido))
    setPrazoModalOpen(true)
  }

  const handleSavePrazo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !canEdit) return
    if (!przData || !przDescricao.trim()) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Informe a data fatal e a descrição do prazo.',
      })
      return
    }

    try {
      setSavingPrz(true)
      if (editingPrazo) {
        await prazosService.update(editingPrazo.id, {
          tipo: przTipo,
          data: `${przData} 23:59:00.000Z`,
          descricao: przDescricao.trim(),
          concluido: przConcluido,
        })
        toast({ title: 'Prazo atualizado com sucesso!' })
      } else {
        await prazosService.create({
          causa_id: id,
          tipo: przTipo,
          data: `${przData} 23:59:00.000Z`,
          descricao: przDescricao.trim(),
          concluido: false,
        })
        toast({ title: 'Prazo cadastrado com sucesso!' })
      }

      setPrazoModalOpen(false)
      loadAll()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar prazo',
      })
    } finally {
      setSavingPrz(false)
    }
  }

  const handleTogglePrazoConcluido = async (prz: Prazo) => {
    if (!canEdit) return
    try {
      await prazosService.update(prz.id, {
        concluido: !prz.concluido,
      })
      loadAll()
      toast({
        title: prz.concluido ? 'Prazo reaberto' : 'Prazo marcado como concluído!',
      })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao alterar status do prazo',
      })
    }
  }

  const handleDeletePrazo = async () => {
    if (!deletePrzTarget || !canDelete) return
    try {
      setDeletingItem(true)
      await prazosService.delete(deletePrzTarget.id)
      toast({ title: 'Prazo excluído com sucesso.' })
      setDeletePrzTarget(null)
      loadAll()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir prazo',
      })
    } finally {
      setDeletingItem(false)
    }
  }

  // --- Causa Delete handler ---
  const handleDeleteCausa = async () => {
    if (!causa || !canDelete) return
    try {
      setDeletingItem(true)
      await causasService.delete(causa.id)
      toast({
        title: 'Causa excluída',
        description: 'Processo e dependências removidos com sucesso.',
      })
      navigate('/causas')
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir causa',
      })
    } finally {
      setDeletingItem(false)
    }
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-slate-400" />
        Carregando detalhes da causa...
      </div>
    )
  }

  if (!causa) return null

  const badge = getStatusBadgeVariant(causa.status)

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/causas')}
            className="text-slate-600 hover:text-slate-900 gap-1 pl-1"
          >
            <ArrowLeft className="h-4 w-4" /> Causas
          </Button>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-semibold text-slate-800 truncate max-w-xs sm:max-w-md">
            {causa.numero_processo}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && !isEditingCausa && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingCausa(true)}
              className="gap-1.5 border-slate-300"
            >
              <Edit2 className="h-3.5 w-3.5" /> Editar Causa
            </Button>
          )}

          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteCausaTarget(true)}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 gap-1.5"
              title="Excluir Causa (Apenas Superadmin)"
            >
              <Trash2 className="h-3.5 w-3.5" /> Excluir
            </Button>
          )}
        </div>
      </div>

      {/* Main Causa Card (View or Edit Mode) */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.className}`}
                >
                  {badge.label}
                </span>
                <FaseAtualBadge fase={causa.fase_atual} />
                <span className="text-xs text-slate-400">
                  Cadastrada em {formatDateBR(causa.created)}
                </span>
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900 mt-1">
                {causa.numero_processo}
              </CardTitle>
              <CardDescription className="text-sm text-slate-700 font-medium">
                Reclamante (Parte Contrária): <strong>{causa.parte_contraria}</strong>
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {isEditingCausa ? (
            <form onSubmit={handleSaveCausa} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editNumero">Número do Processo *</Label>
                  <Input
                    id="editNumero"
                    value={editNumero}
                    onChange={(e) => setEditNumero(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editVara">Vara / Juízo *</Label>
                  <Input
                    id="editVara"
                    value={editVara}
                    onChange={(e) => setEditVara(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editParte">Parte Contrária *</Label>
                  <Input
                    id="editParte"
                    value={editParte}
                    onChange={(e) => setEditParte(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editStatus">Status da Causa *</Label>
                  <Select
                    value={editStatus}
                    onValueChange={(val: CausaStatus) => setEditStatus(val)}
                  >
                    <SelectTrigger id="editStatus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editValor">Valor da Causa (R$)</Label>
                  <Input
                    id="editValor"
                    type="number"
                    step="0.01"
                    value={editValor}
                    onChange={(e) => setEditValor(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editCliente">Cliente</Label>
                  <Select
                    value={editCliente || undefined}
                    onValueChange={(val) => setEditCliente(val === '__vazio__' ? '' : val)}
                  >
                    <SelectTrigger id="editCliente">
                      <SelectValue placeholder="Selecione o cliente (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__vazio__">—</SelectItem>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editFuncao">Função do Reclamante</Label>
                  <Select
                    value={editFuncao || undefined}
                    onValueChange={(val) => setEditFuncao(val === '__vazio__' ? '' : val)}
                  >
                    <SelectTrigger id="editFuncao">
                      <SelectValue placeholder="Selecione a função (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__vazio__">—</SelectItem>
                      {funcoes.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editResponsavel">Responsável *</Label>
                <Input
                  id="editResponsavel"
                  value={editResponsavel}
                  onChange={(e) => setEditResponsavel(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editObservacoes">Observações</Label>
                <Textarea
                  id="editObservacoes"
                  rows={3}
                  value={editObservacoes}
                  onChange={(e) => setEditObservacoes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditingCausa(false)}
                  disabled={savingCausa}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-900 text-white gap-1.5"
                  disabled={savingCausa}
                >
                  {savingCausa ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">
                  Vara / Juízo
                </span>
                <p className="text-sm font-medium text-slate-900">{causa.vara_juizo}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">
                  Valor da Causa
                </span>
                <p className="text-sm font-medium text-slate-900">
                  {formatCurrencyBRL(causa.valor_causa)}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">
                  Responsável
                </span>
                <p className="text-sm font-medium text-slate-900">{causa.responsavel}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">
                  Cliente
                </span>
                <p className="text-sm font-medium text-slate-900">
                  {clientes.find((c) => c.id === causa.cliente)?.nome || '—'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">
                  Função do Reclamante
                </span>
                <p className="text-sm font-medium text-slate-900">
                  {funcoes.find((f) => f.id === causa.funcao_reclamante)?.nome || '—'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">
                  Última Atualização
                </span>
                <p className="text-sm font-medium text-slate-900">{formatDateBR(causa.updated)}</p>
              </div>

              {causa.observacoes && (
                <div className="col-span-full pt-4 border-t border-slate-100">
                  <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider block mb-1">
                    Observações e Notas
                  </span>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded-md border border-slate-200">
                    {causa.observacoes}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentos do Processo */}
      <DocumentosProcesso causa={causa} canEdit={canEdit} canDelete={canDelete} />

      {/* Grid: Audiências & Prazos da Causa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Audiências */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600" />
                Audiências ({audiencias.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Sessões de conciliação, instrução e julgamento
              </CardDescription>
            </div>

            {canEdit && (
              <Button
                size="sm"
                onClick={openNewAudienciaModal}
                className="bg-amber-600 hover:bg-amber-700 text-white gap-1 text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Nova Audiência
              </Button>
            )}
          </CardHeader>

          <CardContent className="p-0">
            {audiencias.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Nenhuma audiência marcada para esta causa.
                {canEdit && (
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openNewAudienciaModal}
                      className="text-xs"
                    >
                      Agendar Primeira Audiência
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {audiencias.map((aud) => {
                  const days = calculateDaysRemaining(aud.data)
                  const isUrgent = days >= 0 && days < 7

                  return (
                    <div
                      key={aud.id}
                      className={`p-4 transition-colors ${
                        isUrgent ? 'bg-red-50/70 border-l-4 border-l-red-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-slate-900 text-sm">{aud.tipo}</span>
                            {isUrgent ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-600 text-white animate-pulse">
                                <AlertTriangle className="h-3 w-3" />
                                {days === 0 ? 'HOJE' : `em ${days} dia(s)`}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                                {days < 0 ? 'Realizada' : `em ${days} dias`}
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                            <span className="font-medium text-slate-800">
                              📅 {formatDateBR(aud.data)} às {aud.hora}
                            </span>
                            <span>📍 {aud.local}</span>
                            {aud.prazo_preparacao_dias !== undefined && (
                              <span className="text-amber-800 font-medium">
                                ⏱️ Preparação: {aud.prazo_preparacao_dias} dias de antecedência
                              </span>
                            )}
                          </div>

                          {aud.observacoes && (
                            <p className="text-xs text-slate-500 italic mt-1">
                              &ldquo;{aud.observacoes}&rdquo;
                            </p>
                          )}

                          {aud.fase && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getFaseBadgeClass(aud.fase)}`}
                                title={getFaseInfo(aud.fase).descricao}
                              >
                                Fase: {getFaseInfo(aud.fase).label}
                              </span>
                              {aud.observacao_fase && (
                                <span
                                  className="text-[11px] text-slate-500 italic truncate max-w-[240px]"
                                  title={aud.observacao_fase}
                                >
                                  {aud.observacao_fase}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditAudienciaModal(aud)}
                              className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900"
                              title="Editar audiência"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteAudTarget(aud)}
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-800"
                              title="Excluir audiência (Superadmin)"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Prazos Processuais */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-900" />
                Prazos Fatais ({prazos.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Contestações, recursos, sentenças e manifestações
              </CardDescription>
            </div>

            {canEdit && (
              <Button
                size="sm"
                onClick={openNewPrazoModal}
                className="bg-blue-900 hover:bg-blue-800 text-white gap-1 text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Novo Prazo
              </Button>
            )}
          </CardHeader>

          <CardContent className="p-0">
            {prazos.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Nenhum prazo cadastrado para esta causa.
                {canEdit && (
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openNewPrazoModal}
                      className="text-xs"
                    >
                      Cadastrar Primeiro Prazo
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {prazos.map((prz) => {
                  const days = calculateDaysRemaining(prz.data)
                  const isUrgent = !prz.concluido && days >= 0 && days < 7
                  const przBadge = getPrazoBadgeVariant(prz.tipo)

                  return (
                    <div
                      key={prz.id}
                      className={`p-4 transition-colors ${
                        prz.concluido
                          ? 'bg-slate-50/40 opacity-70'
                          : isUrgent
                            ? 'bg-red-50/70 border-l-4 border-l-red-600'
                            : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${przBadge.className}`}
                            >
                              {przBadge.label}
                            </span>

                            {prz.concluido ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="h-3 w-3" /> Concluído
                              </span>
                            ) : isUrgent ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-600 text-white animate-pulse">
                                <AlertTriangle className="h-3 w-3" />
                                {days === 0 ? 'Vence HOJE' : `Vence em ${days} dia(s)`}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                                {days < 0 ? 'Vencido' : `em ${days} dias`}
                              </span>
                            )}

                            <span className="text-xs font-semibold text-slate-700">
                              Data fatal: {formatDateBR(prz.data)}
                            </span>
                          </div>

                          <p
                            className={`text-sm text-slate-800 font-medium ${prz.concluido ? 'line-through text-slate-500' : ''}`}
                          >
                            {prz.descricao}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTogglePrazoConcluido(prz)}
                              className={`h-7 px-2 text-xs gap-1 ${
                                prz.concluido
                                  ? 'text-slate-600 hover:text-slate-900'
                                  : 'text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800'
                              }`}
                              title={prz.concluido ? 'Reabrir prazo' : 'Concluir prazo'}
                            >
                              <Check className="h-3.5 w-3.5" />
                              {prz.concluido ? 'Reabrir' : 'Concluir'}
                            </Button>
                          )}

                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditPrazoModal(prz)}
                              className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900"
                              title="Editar prazo"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletePrzTarget(prz)}
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-800"
                              title="Excluir prazo (Superadmin)"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fases do Processo: histórico/timeline */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Histórico das Fases do Processo
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Linha do tempo das fases registradas nas audiências, com as observações de cada fase
                para consulta posterior.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <FasesTimeline audiencias={audiencias} />
          </CardContent>
        </Card>
      </div>

      {/* Modal: Nova / Editar Audiência */}
      <Dialog open={audienciaModalOpen} onOpenChange={setAudienciaModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSaveAudiencia}>
            <DialogHeader>
              <DialogTitle>{editingAudiencia ? 'Editar Audiência' : 'Nova Audiência'}</DialogTitle>
              <DialogDescription>
                Informe a data, horário, modalidade/local e dias necessários para preparação prévia.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="audData">Data da Audiência *</Label>
                  <Input
                    id="audData"
                    type="date"
                    value={audData}
                    onChange={(e) => setAudData(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="audHora">Horário *</Label>
                  <Input
                    id="audHora"
                    placeholder="Ex: 14:00"
                    value={audHora}
                    onChange={(e) => setAudHora(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="audTipo">Tipo de Audiência *</Label>
                <Input
                  id="audTipo"
                  placeholder="Ex: Instrução e Julgamento, UNA, Inicial, Conciliação"
                  value={audTipo}
                  onChange={(e) => setAudTipo(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="audLocal">Local / Sala / Link Telepresencial *</Label>
                <Input
                  id="audLocal"
                  placeholder="Ex: Sala de Audiências 2 - Presencial ou Link Zoom/PJe-JT"
                  value={audLocal}
                  onChange={(e) => setAudLocal(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="audPrazoPrep">Prazo de Preparação (dias de antecedência)</Label>
                <Input
                  id="audPrazoPrep"
                  type="number"
                  placeholder="Ex: 5"
                  value={audPrazoPrep}
                  onChange={(e) => setAudPrazoPrep(e.target.value)}
                />
                <span className="text-[11px] text-slate-500">
                  Dias que a equipe necessita antes da audiência para contato com testemunhas e
                  alinhamento.
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="audFase">Fase do Processo *</Label>
                <Select value={audFase} onValueChange={(val: FaseProcesso) => setAudFase(val)}>
                  <SelectTrigger id="audFase">
                    <SelectValue placeholder="Selecione a fase" />
                  </SelectTrigger>
                  <SelectContent>
                    {FASES_PROCESSO.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-[11px] text-slate-500 leading-snug block">
                  {getFaseInfo(audFase).descricao} Ao salvar, a fase do processo é atualizada
                  automaticamente para a fase da audiência mais recente.
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="audFaseObs">Observações da Fase</Label>
                <Textarea
                  id="audFaseObs"
                  rows={3}
                  placeholder="Descreva os detalhes desta fase (ex: resultado da conciliação, provas produzidas, decisão...) para consulta posterior."
                  value={audFaseObs}
                  onChange={(e) => setAudFaseObs(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="audObs">Observações</Label>
                <Textarea
                  id="audObs"
                  rows={2}
                  placeholder="Instruções para o preposto, testemunhas ou orientações..."
                  value={audObs}
                  onChange={(e) => setAudObs(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAudienciaModalOpen(false)}
                disabled={savingAud}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white"
                disabled={savingAud}
              >
                {savingAud ? 'Salvando...' : 'Salvar Audiência'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Novo / Editar Prazo */}
      <Dialog open={prazoModalOpen} onOpenChange={setPrazoModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSavePrazo}>
            <DialogHeader>
              <DialogTitle>{editingPrazo ? 'Editar Prazo' : 'Novo Prazo Processual'}</DialogTitle>
              <DialogDescription>
                Cadastre a data de vencimento e a descrição da providência requerida.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="przTipo">Tipo de Prazo *</Label>
                  <Select value={przTipo} onValueChange={(val: PrazoTipo) => setPrzTipo(val)}>
                    <SelectTrigger id="przTipo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRAZO_TIPOS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="przData">Data Fatal *</Label>
                  <Input
                    id="przData"
                    type="date"
                    value={przData}
                    onChange={(e) => setPrzData(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="przDesc">Descrição do Prazo *</Label>
                <Textarea
                  id="przDesc"
                  rows={3}
                  placeholder="Ex: Protocolar contestação acompanhada de documentos comprobatórios..."
                  value={przDescricao}
                  onChange={(e) => setPrzDescricao(e.target.value)}
                  required
                />
              </div>

              {editingPrazo && (
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="przConcluido"
                    checked={przConcluido}
                    onChange={(e) => setPrzConcluido(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                  />
                  <Label htmlFor="przConcluido" className="cursor-pointer text-sm">
                    Marcar prazo como cumprido / concluído
                  </Label>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPrazoModalOpen(false)}
                disabled={savingPrz}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-blue-900 hover:bg-blue-800 text-white"
                disabled={savingPrz}
              >
                {savingPrz ? 'Salvando...' : 'Salvar Prazo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Audiência Confirmation */}
      <AlertDialog
        open={!!deleteAudTarget}
        onOpenChange={(open) => !open && setDeleteAudTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Audiência?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta audiência ({deleteAudTarget?.tipo} em{' '}
              {formatDateBR(deleteAudTarget?.data)})? Apenas o superadministrador pode realizar
              exclusões.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingItem}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAudiencia}
              disabled={deletingItem}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingItem ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Prazo Confirmation */}
      <AlertDialog
        open={!!deletePrzTarget}
        onOpenChange={(open) => !open && setDeletePrzTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Prazo?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este prazo ({deletePrzTarget?.descricao})? Apenas o
              superadministrador pode realizar exclusões.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingItem}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePrazo}
              disabled={deletingItem}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingItem ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Causa Confirmation */}
      <AlertDialog open={deleteCausaTarget} onOpenChange={setDeleteCausaTarget}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Processo Inteiro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá permanentemente a causa <strong>{causa.numero_processo}</strong> e
              todas as suas audiências e prazos. Esta operação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingItem}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCausa}
              disabled={deletingItem}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingItem ? 'Excluindo...' : 'Excluir Definitivamente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
