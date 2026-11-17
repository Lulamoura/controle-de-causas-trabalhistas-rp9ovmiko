import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { causasService } from '@/services/causas'
import { CausaStatus } from '@/types'
import {
  ArrowLeft,
  Briefcase,
  Save,
  Building,
  User,
  DollarSign,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { ClientResponseError } from 'pocketbase'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'

const LABELS_CAMPOS: Record<string, string> = {
  numero_processo: 'Número do Processo',
  vara_juizo: 'Vara / Juízo',
  parte_contraria: 'Parte Contrária',
  status: 'Status da Causa',
  valor_causa: 'Valor da Causa',
  responsavel: 'Responsável pelo Processo',
  observacoes: 'Observações',
  fase_atual: 'Fase do Processo',
}

// Traduz o erro real do PocketBase (ex.: "Cannot be blank" em numero_processo)
// para uma mensagem legível: "Número do Processo: cannot be blank."
// Quando o erro vem sem detalhe por campo (data vazio), é falha do servidor
// (ex.: hook quebrado), não dos campos — a mensagem diz isso explicitamente.
function obterMotivoAmigavel(err: unknown): string {
  if (err instanceof ClientResponseError) {
    const campos = extractFieldErrors(err)
    const partes = Object.entries(campos).map(
      ([campo, msg]) => `${LABELS_CAMPOS[campo] || campo}: ${msg}`,
    )
    if (partes.length > 0) return partes.join(' | ')
    if (err.status >= 400 && err.status < 500 && !err.response?.data) {
      return 'Falha no servidor ao gravar a causa. Tente novamente; se persistir, contate o suporte.'
    }
  }
  return getErrorMessage(err)
}

const STATUS_OPTIONS: { value: CausaStatus; label: string }[] = [
  { value: 'ajuizada', label: 'Ajuizada' },
  { value: 'em andamento', label: 'Em andamento' },
  { value: 'audiência marcada', label: 'Audiência marcada' },
  { value: 'contestação', label: 'Contestação' },
  { value: 'sentença', label: 'Sentença' },
  { value: 'recurso', label: 'Recurso' },
  { value: 'arquivada', label: 'Arquivada' },
]

export default function CausaNova() {
  const { user, canEdit } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [numeroProcesso, setNumeroProcesso] = useState('')
  const [varaJuizo, setVaraJuizo] = useState('')
  const [parteContraria, setParteContraria] = useState('')
  const [status, setStatus] = useState<CausaStatus>('ajuizada')
  const [valorCausa, setValorCausa] = useState<string>('')
  const [responsavel, setResponsavel] = useState(user?.name || '')
  const [observacoes, setObservacoes] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!canEdit) {
    return (
      <div className="p-8 text-center">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Seu perfil possui permissão apenas de leitura. Você não pode cadastrar novas causas.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/causas')} className="mt-4" variant="outline">
          Voltar às Causas
        </Button>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!numeroProcesso.trim()) {
      setErrorMsg('Informe o número do processo (ex: 0010452-88.2024.5.02.0042).')
      return
    }
    if (!varaJuizo.trim()) {
      setErrorMsg('Informe a vara ou juízo competente.')
      return
    }
    if (!parteContraria.trim()) {
      setErrorMsg('Informe o nome da parte contrária (reclamante).')
      return
    }
    if (!responsavel.trim()) {
      setErrorMsg('Informe o advogado ou responsável pelo acompanhamento.')
      return
    }

    try {
      setLoading(true)
      const parsedValor = valorCausa ? parseFloat(valorCausa.replace(',', '.')) : undefined

      const nova = await causasService.create({
        numero_processo: numeroProcesso.trim(),
        vara_juizo: varaJuizo.trim(),
        parte_contraria: parteContraria.trim(),
        status,
        valor_causa: isNaN(Number(parsedValor)) ? undefined : Number(parsedValor),
        responsavel: responsavel.trim(),
        observacoes: observacoes.trim() || undefined,
      })

      toast({
        title: 'Causa cadastrada com sucesso!',
        description: `Processo ${nova.numero_processo} criado. Agora você pode adicionar audiências e prazos.`,
      })

      navigate(`/causas/${nova.id}`)
    } catch (err: any) {
      console.error('Erro ao cadastrar causa:', err)
      const fallback = 'Não foi possível salvar os dados da causa. Verifique os campos preenchidos.'
      const campo = obterMotivoAmigavel(err)
      setErrorMsg(campo ? `${fallback} Motivo: ${campo}` : fallback)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Breadcrumb / Top Bar */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/causas')}
          className="text-slate-600 hover:text-slate-900 gap-1 pl-1"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para Causas
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-900" />
            Nova Causa Trabalhista
          </CardTitle>
          <CardDescription>
            Cadastre os dados processuais essenciais para acompanhar audiências e prazos no painel.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {errorMsg && (
              <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{errorMsg}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero">Número do Processo *</Label>
                <Input
                  id="numero"
                  placeholder="0010452-88.2024.5.02.0042"
                  value={numeroProcesso}
                  onChange={(e) => setNumeroProcesso(e.target.value)}
                  required
                />
                <span className="text-[11px] text-slate-500">
                  Formato padrão CNJ (Tribunal Regional do Trabalho)
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vara">Vara / Juízo *</Label>
                <Input
                  id="vara"
                  placeholder="Ex: 42ª Vara do Trabalho de São Paulo/SP"
                  value={varaJuizo}
                  onChange={(e) => setVaraJuizo(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parteContraria">Parte Contrária (Reclamante) *</Label>
                <Input
                  id="parteContraria"
                  placeholder="Nome completo do reclamante"
                  value={parteContraria}
                  onChange={(e) => setParteContraria(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status da Causa *</Label>
                <Select value={status} onValueChange={(val: CausaStatus) => setStatus(val)}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Selecione o status" />
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valorCausa">Valor da Causa (R$)</Label>
                <Input
                  id="valorCausa"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 85000.00"
                  value={valorCausa}
                  onChange={(e) => setValorCausa(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsavel">Responsável pelo Processo *</Label>
                <Input
                  id="responsavel"
                  placeholder="Nome do advogado ou gestor"
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações e Resumo do Pedido</Label>
              <Textarea
                id="observacoes"
                placeholder="Principais pedidos da inicial, alinhamentos com o departamento ou detalhes adicionais..."
                rows={3}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/causas')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-900 hover:bg-blue-800 text-white gap-1.5"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Salvar Causa
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
