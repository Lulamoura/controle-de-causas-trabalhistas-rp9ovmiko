/**
 * Agregação e exportação CSV dos relatórios por Cliente e por Função do
 * Reclamante. Roda 100% no frontend (regra do projeto: nada de hooks de
 * fases/backend para isso) — recebe a lista de causas já carregada e calcula
 * as métricas por item, com filtro opcional por período da data de abertura
 * (o campo `created` da causa, que é a data de abertura/registro).
 */
import { Causa, Cliente, FuncaoReclamante } from '@/types'
import { formatDateBR, getStatusBadgeVariant } from '@/lib/date-utils'
import { FASES_PROCESSO } from '@/lib/fases'

export type Periodo = { de: string; ate: string } // 'YYYY-MM-DD', '' = sem limite

export type VisaoRelatorio = 'clientes' | 'funcoes'

export interface Distribuicao {
  chave: string
  rotulo: string
  total: number
}

export interface LinhaRelatorio {
  id: string | null
  nome: string
  totalCausas: number
  causasAtivas: number
  valorTotal: number
  porStatus: Distribuicao[]
  porFase: Distribuicao[]
}

/** Comparação de datas 'YYYY-MM-DD' (ou ISO) como strings de dia. */
const diaDe = (data: string): string => data.slice(0, 10)

const dentroDoPeriodo = (created: string, periodo: Periodo): boolean => {
  const dia = diaDe(created)
  if (periodo.de && dia < periodo.de) return false
  if (periodo.ate && dia > periodo.ate) return false
  return true
}

const contar = (
  causas: Causa[],
  pegarChave: (c: Causa) => string | null,
  rotulos: Map<string, string>,
): Distribuicao[] => {
  const contagem = new Map<string, number>()
  for (const c of causas) {
    const chave = pegarChave(c)
    if (!chave) continue
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1)
  }
  return [...contagem.entries()]
    .map(([chave, total]) => ({ chave, rotulo: rotulos.get(chave) ?? chave, total }))
    .sort((a, b) => b.total - a.total || a.rotulo.localeCompare(b.rotulo))
}

/**
 * Agrupa as causas por item (cliente ou função) e calcula as métricas.
 * `itens` são os cadastros (ativos ou todos — quem chama decide); causas sem
 * relação preenchida ficam de fora (a relação é opcional no cadastro da causa).
 */
export function agruparCausas(
  causas: Causa[],
  visao: VisaoRelatorio,
  itens: (Cliente | FuncaoReclamante)[],
  periodo: Periodo,
): LinhaRelatorio[] {
  const noPeriodo = causas.filter((c) => dentroDoPeriodo(c.created, periodo))
  const campo = visao === 'clientes' ? 'cliente' : 'funcao_reclamante'
  const ids = new Set(itens.map((i) => i.id))
  const nomes = new Map(itens.map((i) => [i.id, i.nome]))

  const grupos = new Map<string, Causa[]>()
  for (const c of noPeriodo) {
    const itemId = c[campo as 'cliente' | 'funcao_reclamante']
    if (!itemId || !ids.has(itemId)) continue
    const lista = grupos.get(itemId) ?? []
    lista.push(c)
    grupos.set(itemId, lista)
  }

  const linhas: LinhaRelatorio[] = []
  for (const [itemId, lista] of grupos) {
    const statusRotulos = new Map<string, string>()
    for (const d of lista) {
      statusRotulos.set(d.status, getStatusBadgeVariant(d.status).label)
    }
    const faseRotulos = new Map<string, string>(FASES_PROCESSO.map((f) => [f.value, f.label]))
    const ativas = lista.filter((c) => c.status !== 'arquivada').length
    const valorTotal = lista.reduce(
      (acc, c) => acc + (typeof c.valor_causa === 'number' ? c.valor_causa : 0),
      0,
    )
    linhas.push({
      id: itemId,
      nome: nomes.get(itemId) ?? itemId,
      totalCausas: lista.length,
      causasAtivas: ativas,
      valorTotal,
      porStatus: contar(lista, (c) => c.status, statusRotulos),
      porFase: contar(lista, (c) => c.fase_atual ?? null, faseRotulos),
    })
  }

  return linhas.sort((a, b) => b.totalCausas - a.totalCausas || a.nome.localeCompare(b.nome))
}

/** Totais gerais da visão (linha de resumo acima da tabela). */
export function totaisGerais(linhas: LinhaRelatorio[]) {
  return {
    itens: linhas.length,
    causas: linhas.reduce((acc, l) => acc + l.totalCausas, 0),
    ativas: linhas.reduce((acc, l) => acc + l.causasAtivas, 0),
    valor: linhas.reduce((acc, l) => acc + l.valorTotal, 0),
  }
}

// ---------- Exportação CSV (padrão brasileiro: ; e BOM UTF-8) ----------

const escapar = (valor: string): string => {
  const v = valor.replace(/\r?\n/g, ' ').trim()
  return v.includes(';') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v
}

const fmtValor = (v: number): string =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const baixarArquivo = (conteudo: string, nomeArquivo: string): void => {
  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Exporta o relatório agregado (uma linha por item) para CSV com BOM UTF-8. */
export function exportarRelatorioCSV(
  linhas: LinhaRelatorio[],
  visao: VisaoRelatorio,
  periodo: Periodo,
): void {
  const cabecalho = [
    visao === 'clientes' ? 'Cliente' : 'Função do Reclamante',
    'Total de causas',
    'Causas ativas',
    'Valor somado (R$)',
    'Distribuição por status',
    'Distribuição por fase',
  ]
  const linhasCsv = linhas.map((l) => {
    const status = l.porStatus.map((d) => `${d.rotulo}: ${d.total}`).join(' | ')
    const fases = l.porFase.map((d) => `${d.rotulo}: ${d.total}`).join(' | ')
    return [
      l.nome,
      String(l.totalCausas),
      String(l.causasAtivas),
      fmtValor(l.valorTotal),
      status,
      fases,
    ]
  })
  const csv = [cabecalho, ...linhasCsv].map((row) => row.map(escapar).join(';')).join('\r\n')
  const partes: string[] = []
  if (periodo.de) partes.push(`de ${periodo.de}`)
  if (periodo.ate) partes.push(`até ${periodo.ate}`)
  const sufixo = partes.length ? `_${partes.join('_')}` : ''
  const nomeArquivo = `relatorio_${visao === 'clientes' ? 'clientes' : 'funcoes'}${sufixo}.csv`
  baixarArquivo('\uFEFF' + csv, nomeArquivo)
}

/** Exporta a lista de causas de um item (o que aparece ao clicar) para CSV. */
export function exportarCausasCSV(
  causas: Causa[],
  tituloItem: string,
  visao: VisaoRelatorio,
): void {
  const cabecalho = [
    'Número do Processo',
    'Parte Contrária',
    'Vara / Juízo',
    'Status',
    'Fase Atual',
    'Valor da Causa (R$)',
    'Responsável',
    'Data de Abertura',
  ]
  const linhasCsv = causas.map((c) => [
    c.numero_processo,
    c.parte_contraria,
    c.vara_juizo,
    getStatusBadgeVariant(c.status).label,
    c.fase_atual ?? '',
    c.valor_causa !== undefined && c.valor_causa !== null ? fmtValor(c.valor_causa) : '0,00',
    c.responsavel,
    formatDateBR(c.created),
  ])
  const csv = [cabecalho, ...linhasCsv].map((row) => row.map(escapar).join(';')).join('\r\n')
  const slug = tituloItem
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .toLowerCase()
  baixarArquivo('\uFEFF' + csv, `causas_${visao === 'clientes' ? 'cliente' : 'funcao'}_${slug}.csv`)
}
