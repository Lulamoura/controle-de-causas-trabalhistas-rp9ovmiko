import { CheckCircle2 } from 'lucide-react'
import { Audiencia, FaseProcesso } from '@/types'
import { FASES_PROCESSO, getFaseBadgeClass, getFaseInfo } from '@/lib/fases'
import { formatDateBR } from '@/lib/date-utils'

interface FasesTimelineProps {
  audiencias: Audiencia[]
}

/**
 * Timeline/histórico das fases registradas nas audiências, ordenadas da mais
 * antiga para a mais recente, com a observação de cada fase para consulta posterior.
 */
export function FasesTimeline({ audiencias }: FasesTimelineProps) {
  const comFase = audiencias
    .filter((a) => !!a.fase)
    .slice()
    .sort((a, b) => (a.data > b.data ? 1 : a.data < b.data ? -1 : 0))

  if (comFase.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-slate-500">
        Nenhuma fase registrada ainda. A fase é registrada ao cadastrar uma audiência.
      </div>
    )
  }

  return (
    <ol className="relative ml-3 border-l border-slate-200 space-y-5 py-1">
      {comFase.map((aud, i) => {
        const faseInfo = getFaseInfo(aud.fase)
        const isMaisRecente = i === comFase.length - 1

        return (
          <li key={aud.id} className="ml-6 relative">
            {/* Marcador na linha do tempo */}
            <span
              className={`absolute -left-[31px] top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                isMaisRecente ? 'bg-blue-900 border-blue-300' : 'bg-white border-slate-300'
              }`}
            >
              <CheckCircle2
                className={`h-3 w-3 ${isMaisRecente ? 'text-white' : 'text-slate-400'}`}
              />
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getFaseBadgeClass(aud.fase)}`}
              >
                {faseInfo.label}
              </span>
              {isMaisRecente && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-900 text-white">
                  Fase atual do processo
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-1">
              📅 Audiência em {formatDateBR(aud.data)} às {aud.hora}
              {aud.local ? ` · ${aud.local}` : ''}
            </p>

            {aud.observacao_fase ? (
              <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 border border-slate-200 rounded-md p-3 mt-2">
                {aud.observacao_fase}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic mt-1">Sem observação para esta fase.</p>
            )}

            <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">{faseInfo.descricao}</p>
          </li>
        )
      })}
    </ol>
  )
}

/** Badge destacado da fase atual do processo. */
export function FaseAtualBadge({ fase }: { fase?: FaseProcesso | string | null }) {
  const faseInfo = getFaseInfo(fase)
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5">
      <span className="text-[11px] uppercase font-bold tracking-wider text-blue-700">
        Fase do processo:
      </span>
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getFaseBadgeClass(fase)}`}
        title={faseInfo.descricao}
      >
        {faseInfo.label}
      </span>
    </div>
  )
}
