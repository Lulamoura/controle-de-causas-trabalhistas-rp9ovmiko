import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { causasService } from '@/services/causas'
import { clientesService, funcoesService } from '@/services/cadastros'
import { Causa, Cliente, FuncaoReclamante } from '@/types'
import { formatCurrencyBRL, formatDateBR, getStatusBadgeVariant } from '@/lib/date-utils'
import { getFaseBadgeClass } from '@/lib/fases'
import {
  agruparCausas,
  exportarCausasCSV,
  exportarRelatorioCSV,
  totaisGerais,
  VisaoRelatorio,
} from '@/lib/relatorios'
import {
  BarChart3,
  Building,
  HardHat,
  RefreshCw,
  Download,
  CalendarRange,
  Briefcase,
  Loader2,
  FileSpreadsheet,
  ChevronLeft,
  Eye,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

type Aba = 'clientes' | 'funcoes'

export default function Relatorios() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [aba, setAba] = useState<Aba>('clientes')
  const [causas, setCausas] = useState<Causa[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [funcoes, setFuncoes] = useState<FuncaoReclamante[]>([])
  const [loading, setLoading] = useState(true)

  // Filtro por período da data de abertura ('' = sem limite)
  const [dataDe, setDataDe] = useState('')
  const [dataAte, setDataAte] = useState('')

  // Diálogo com a lista de causas do item clicado
  const [itemSelecionado, setItemSelecionado] = useState<{ nome: string; causas: Causa[] } | null>(
    null,
  )

  const carregar = async () => {
    try {
      setLoading(true)
      const [cs, cls, fns] = await Promise.all([
        causasService.getAll(),
        clientesService.getAll(),
        funcoesService.getAll(),
      ])
      setCausas(cs)
      setClientes(cls as Cliente[])
      setFuncoes(fns as FuncaoReclamante[])
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar os dados dos relatórios.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const visao: VisaoRelatorio = aba
  const itens = visao === 'clientes' ? clientes : funcoes
  const linhas = useMemo(
    () => agruparCausas(causas, visao, itens, { de: dataDe, ate: dataAte }),
    [causas, visao, itens, dataDe, dataAte],
  )
  const totais = useMemo(() => totaisGerais(linhas), [linhas])

  const periodoAtivo = Boolean(dataDe || dataAte)
  const limparPeriodo = () => {
    setDataDe('')
    setDataAte('')
  }

  const exportar = () => {
    if (linhas.length === 0) {
      toast({
        title: 'Nada para exportar',
        description: 'O relatório exibido está vazio — ajuste o período ou cadastre causas.',
      })
      return
    }
    exportarRelatorioCSV(linhas, visao, { de: dataDe, ate: dataAte })
    toast({ title: 'Relatório exportado', description: 'O arquivo CSV foi baixado.' })
  }

  const abrirCausas = (id: string | null, nome: string) => {
    if (!id) return
    const campo = visao === 'clientes' ? 'cliente' : 'funcao_reclamante'
    const doItem = causas.filter((c) => {
      if (c[campo as 'cliente' | 'funcao_reclamante'] !== id) return false
      if (dataDe && c.created.slice(0, 10) < dataDe) return false
      if (dataAte && c.created.slice(0, 10) > dataAte) return false
      return true
    })
    setItemSelecionado({ nome, causas: doItem })
  }

  const exportarCausasDoItem = () => {
    if (!itemSelecionado || itemSelecionado.causas.length === 0) return
    exportarCausasCSV(itemSelecionado.causas, itemSelecionado.nome, visao)
    toast({ title: 'Lista exportada', description: 'O arquivo CSV foi baixado.' })
  }

  const labelItem = visao === 'clientes' ? 'Cliente' : 'Função do Reclamante'

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Relatórios</h1>
          <p className="text-sm text-slate-600">
            Ocorrências por cliente e por função do reclamante, com valor somado e distribuição por
            status e fase.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={carregar}
            disabled={loading}
            className="border-slate-300"
            title="Recarregar"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={exportar}
            disabled={loading || linhas.length === 0}
            className="bg-blue-900 hover:bg-blue-800 text-white gap-1.5 shadow-sm"
          >
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </div>
      </div>

      {/* Abas das duas visões */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setAba('clientes')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            aba === 'clientes'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="h-4 w-4" /> Ocorrências por Cliente
        </button>
        <button
          type="button"
          onClick={() => setAba('funcoes')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            aba === 'funcoes'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HardHat className="h-4 w-4" /> Ocorrências por Função do Reclamante
        </button>
      </div>

      {/* Filtro por período (data de abertura da causa) */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex items-center gap-2 text-slate-700 md:mr-2">
            <CalendarRange className="h-4 w-4 text-blue-900" />
            <span className="text-sm font-medium">Período da abertura</span>
          </div>
          <div className="space-y-1">
            <label htmlFor="rel-de" className="text-xs text-slate-500">
              De
            </label>
            <Input
              id="rel-de"
              type="date"
              value={dataDe}
              onChange={(e) => setDataDe(e.target.value)}
              className="bg-white w-full md:w-44"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="rel-ate" className="text-xs text-slate-500">
              Até
            </label>
            <Input
              id="rel-ate"
              type="date"
              value={dataAte}
              onChange={(e) => setDataAte(e.target.value)}
              className="bg-white w-full md:w-44"
            />
          </div>
          {periodoAtivo && (
            <Button variant="ghost" size="sm" onClick={limparPeriodo} className="text-slate-500">
              Limpar período
            </Button>
          )}
          <p className="text-xs text-slate-500 md:ml-auto md:max-w-xs">
            As métricas consideram a data de abertura da causa (cadastro no sistema).
          </p>
        </CardContent>
      </Card>

      {/* Resumo geral */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-900" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{labelItem}s com causas</p>
              <p className="text-xl font-bold text-slate-900">{totais.itens}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Briefcase className="h-5 w-5 text-blue-900" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total de causas</p>
              <p className="text-xl font-bold text-slate-900">{totais.causas}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Briefcase className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Causas ativas</p>
              <p className="text-xl font-bold text-slate-900">{totais.ativas}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <FileSpreadsheet className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Valor somado</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrencyBRL(totais.valor)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela do relatório */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Ocorrências por {visao === 'clientes' ? 'Cliente' : 'Função do Reclamante'}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Clique em um {visao === 'clientes' ? 'cliente' : 'função'} para ver as causas dele.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-400" />
              Carregando relatório...
            </div>
          ) : linhas.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <BarChart3 className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-base font-semibold text-slate-800">
                Nenhum dado para o período selecionado
              </p>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                {periodoAtivo
                  ? 'Nenhuma causa com cliente/função preenchidos foi aberta nesse período. Tente ampliar ou limpar o filtro.'
                  : 'Nenhuma causa com cliente/função preenchidos foi encontrada.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">{labelItem}</th>
                    <th className="py-3 px-4 font-semibold text-right">Total de Causas</th>
                    <th className="py-3 px-4 font-semibold text-right">Causas Ativas</th>
                    <th className="py-3 px-4 font-semibold text-right">Valor Somado</th>
                    <th className="py-3 px-4 font-semibold">Distribuição por Status</th>
                    <th className="py-3 px-4 font-semibold">Distribuição por Fase</th>
                    <th className="py-3 px-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {linhas.map((linha) => (
                    <tr
                      key={linha.id ?? linha.nome}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <button
                          type="button"
                          onClick={() => abrirCausas(linha.id, linha.nome)}
                          className="text-blue-900 hover:underline font-semibold text-left"
                        >
                          {linha.nome}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900">
                        {linha.totalCausas}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">
                        {linha.causasAtivas}
                        {linha.causasAtivas < linha.totalCausas && (
                          <span className="text-[11px] text-slate-400 block">
                            {linha.totalCausas - linha.causasAtivas} arquivada(s)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-800 whitespace-nowrap">
                        {formatCurrencyBRL(linha.valorTotal)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {linha.porStatus.map((d) => (
                            <Badge
                              key={d.chave}
                              className={getStatusBadgeVariant(d.chave).className}
                              title={`${d.rotulo}: ${d.total}`}
                            >
                              {d.rotulo}: {d.total}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {linha.porFase.map((d) => (
                            <Badge
                              key={d.chave}
                              className={getFaseBadgeClass(d.chave)}
                              title={`${d.rotulo}: ${d.total}`}
                            >
                              {d.rotulo}: {d.total}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => abrirCausas(linha.id, linha.nome)}
                          className="h-8 text-blue-900 hover:text-blue-700 hover:bg-blue-50"
                          title="Ver causas deste item"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          <span className="text-xs">Ver causas</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo com as causas do item clicado */}
      <Dialog open={!!itemSelecionado} onOpenChange={(open) => !open && setItemSelecionado(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setItemSelecionado(null)}
                className="h-7 w-7 p-0 text-slate-500"
                title="Voltar"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              Causas de {itemSelecionado?.nome}
            </DialogTitle>
            <DialogDescription>
              {periodoAtivo ? 'Filtradas pela data de abertura no período escolhido. ' : ''}
              {itemSelecionado?.causas.length ?? 0} causa(s) encontrada(s).
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto -mx-6 px-6">
            {(itemSelecionado?.causas.length ?? 0) === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Nenhuma causa neste período para este {visao === 'clientes' ? 'cliente' : 'função'}.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Número do Processo</th>
                    <th className="py-2.5 px-3 font-semibold">Parte Contrária</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold">Fase</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Valor</th>
                    <th className="py-2.5 px-3 font-semibold">Abertura</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itemSelecionado?.causas.map((c) => {
                    const badge = getStatusBadgeVariant(c.status)
                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                        onClick={() => navigate(`/causas/${c.id}`)}
                      >
                        <td className="py-2.5 px-3 font-semibold text-blue-900">
                          {c.numero_processo}
                        </td>
                        <td className="py-2.5 px-3 text-slate-800 max-w-[180px] truncate">
                          {c.parte_contraria}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getFaseBadgeClass(c.fase_atual)}`}
                          >
                            {c.fase_atual ?? 'Petição Inicial'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          {formatCurrencyBRL(c.valor_causa)}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                          {formatDateBR(c.created)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Loader2 className="h-3 w-3 hidden" />
              Clique em uma causa para abrir o detalhe completo.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={exportarCausasDoItem}
              disabled={(itemSelecionado?.causas.length ?? 0) === 0}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" /> Exportar esta lista
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
