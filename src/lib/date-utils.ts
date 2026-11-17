import { format, parseISO, differenceInCalendarDays, isBefore, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatDateBR(dateStr?: string | null): string {
  if (!dateStr) return '-'
  try {
    // Handle both YYYY-MM-DD and ISO strings
    const date =
      typeof dateStr === 'string' && dateStr.length === 10
        ? new Date(`${dateStr}T12:00:00`)
        : parseISO(dateStr)
    return format(date, 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return dateStr
  }
}

export function formatDateTimeBR(dateStr?: string | null, timeStr?: string | null): string {
  if (!dateStr) return '-'
  const d = formatDateBR(dateStr)
  if (timeStr) {
    return `${d} às ${timeStr}`
  }
  return d
}

export function formatCurrencyBRL(value?: number | null): string {
  if (value === undefined || value === null) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function calculateDaysRemaining(targetDateStr: string): number {
  try {
    const targetDate =
      typeof targetDateStr === 'string' && targetDateStr.length === 10
        ? new Date(`${targetDateStr}T12:00:00`)
        : parseISO(targetDateStr)
    const today = startOfDay(new Date())
    const target = startOfDay(targetDate)
    return differenceInCalendarDays(target, today)
  } catch {
    return 0
  }
}

export function getStatusBadgeVariant(status: string): { label: string; className: string } {
  switch (status) {
    case 'ajuizada':
      return { label: 'Ajuizada', className: 'bg-blue-100 text-blue-800 border-blue-200' }
    case 'em andamento':
      return { label: 'Em Andamento', className: 'bg-sky-100 text-sky-800 border-sky-200' }
    case 'audiência marcada':
      return {
        label: 'Audiência Marcada',
        className: 'bg-amber-100 text-amber-900 border-amber-300',
      }
    case 'contestação':
      return { label: 'Contestação', className: 'bg-orange-100 text-orange-800 border-orange-200' }
    case 'sentença':
      return { label: 'Sentença', className: 'bg-purple-100 text-purple-800 border-purple-200' }
    case 'recurso':
      return { label: 'Recurso', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' }
    case 'arquivada':
      return { label: 'Arquivada', className: 'bg-gray-100 text-gray-700 border-gray-300' }
    default:
      return { label: status, className: 'bg-gray-100 text-gray-800 border-gray-200' }
  }
}

export function getPrazoBadgeVariant(tipo: string): { label: string; className: string } {
  switch (tipo) {
    case 'audiência':
      return { label: 'Audiência', className: 'bg-amber-50 text-amber-800 border-amber-200' }
    case 'contestação':
      return { label: 'Contestação', className: 'bg-orange-50 text-orange-800 border-orange-200' }
    case 'sentença':
      return { label: 'Sentença', className: 'bg-purple-50 text-purple-800 border-purple-200' }
    case 'recurso':
      return { label: 'Recurso', className: 'bg-indigo-50 text-indigo-800 border-indigo-200' }
    default:
      return { label: 'Outro', className: 'bg-slate-100 text-slate-800 border-slate-200' }
  }
}
