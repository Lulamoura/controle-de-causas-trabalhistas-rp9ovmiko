export type UserRole = 'superadmin' | 'admin' | 'leitura'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: UserRole
  receive_email_alerts?: boolean
  active?: boolean
  created?: string
  updated?: string
}

export type CausaStatus =
  | 'ajuizada'
  | 'em andamento'
  | 'audiência marcada'
  | 'contestação'
  | 'sentença'
  | 'recurso'
  | 'arquivada'

export type FaseProcesso =
  | 'Petição Inicial'
  | 'Defesa do Reclamado'
  | 'Audiência de Conciliação'
  | 'Instrução e Produção de Provas'
  | 'Sentença'

export interface Causa {
  id: string
  numero_processo: string
  vara_juizo: string
  parte_contraria: string
  status: CausaStatus
  valor_causa?: number
  responsavel: string
  observacoes?: string
  fase_atual?: FaseProcesso
  created: string
  updated: string
}

export interface Audiencia {
  id: string
  causa_id: string
  data: string // YYYY-MM-DD or ISO string
  hora: string // HH:mm
  local: string
  tipo: string
  prazo_preparacao_dias?: number
  observacoes?: string
  fase?: FaseProcesso
  observacao_fase?: string
  created: string
  updated: string
  // expand optional
  expand?: {
    causa_id?: Causa
  }
}

export type PrazoTipo = 'audiência' | 'contestação' | 'sentença' | 'recurso' | 'outro'

export interface Prazo {
  id: string
  causa_id: string
  tipo: PrazoTipo
  data: string // YYYY-MM-DD or ISO string
  descricao: string
  concluido?: boolean
  created: string
  updated: string
  // expand optional
  expand?: {
    causa_id?: Causa
  }
}

export interface ItemAgenda {
  id: string
  tipoItem: 'audiencia' | 'prazo'
  titulo: string
  subtitulo: string
  data: string
  hora?: string
  diasRestantes: number
  urgente: boolean // < 7 dias
  causaId: string
  causaNumero?: string
  causaParte?: string
  responsavel?: string
  original: Audiencia | Prazo
}
