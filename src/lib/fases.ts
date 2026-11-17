import { FaseProcesso } from '@/types'

/**
 * As 5 fases do processo trabalhista, com as definições fornecidas pelo usuário
 * (usadas como descrição/tooltip das opções do combo e nos cards da timeline).
 */
export const FASES_PROCESSO: { value: FaseProcesso; label: string; descricao: string }[] = [
  {
    value: 'Petição Inicial',
    label: 'Petição Inicial',
    descricao:
      'O trabalhador apresenta formalmente a reclamação, detalhando os fatos, direitos violados e valores reivindicados, anexando documentos como contratos, holerites e registros de ponto.',
  },
  {
    value: 'Defesa do Reclamado',
    label: 'Defesa do Reclamado',
    descricao:
      'O empregador apresenta sua contestação, podendo incluir provas e argumentos para refutar as alegações.',
  },
  {
    value: 'Audiência de Conciliação',
    label: 'Audiência de Conciliação',
    descricao:
      'As partes se encontram perante o juiz para tentar um acordo amigável. Se não houver acordo, o processo segue para instrução.',
  },
  {
    value: 'Instrução e Produção de Provas',
    label: 'Instrução e Produção de Provas',
    descricao:
      'O juiz coleta provas, ouve testemunhas e, se necessário, designa perícia técnica para avaliar questões específicas, como condições de trabalho ou danos físicos.',
  },
  {
    value: 'Sentença',
    label: 'Sentença',
    descricao:
      'O juiz decide sobre os direitos reclamados, podendo ser procedente, parcialmente procedente ou improcedente.',
  },
]

export const FASE_INICIAL: FaseProcesso = 'Petição Inicial'

export function getFaseInfo(fase?: string | null) {
  const encontrada = FASES_PROCESSO.find((f) => f.value === fase)
  if (encontrada) return encontrada
  return {
    value: FASE_INICIAL,
    label: FASE_INICIAL,
    descricao: FASES_PROCESSO[0].descricao,
  }
}

/** Estilo do badge por fase (índice no array = ordem do fluxo). */
export function getFaseBadgeClass(fase?: string | null): string {
  const idx = FASES_PROCESSO.findIndex((f) => f.value === fase)
  const classes = [
    'bg-blue-50 text-blue-800 border-blue-200', // Petição Inicial
    'bg-orange-50 text-orange-800 border-orange-200', // Defesa do Reclamado
    'bg-amber-50 text-amber-800 border-amber-200', // Audiência de Conciliação
    'bg-violet-50 text-violet-800 border-violet-200', // Instrução e Produção de Provas
    'bg-emerald-50 text-emerald-800 border-emerald-200', // Sentença
  ]
  return classes[idx >= 0 ? idx : 0]
}
