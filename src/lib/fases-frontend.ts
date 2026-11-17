import pb from '@/lib/pocketbase/client'
import { Causa } from '@/types'
import { FASE_INICIAL } from '@/lib/fases'

/**
 * Recálculo da fase do processo FEITO NO FRONTEND.
 *
 * Antes isto era feito por um hook PocketBase (pb_hooks), mas o runtime JSVM da
 * Skip Cloud passou a executar um bundle antigo que lançava
 * "ReferenceError: audiencias is not defined" e derrubava o POST /causas com 400.
 * A lógica foi movida para cá: ao criar/editar/excluir uma audiência, o app
 * recalcula a fase da causa (fase da audiência mais recente por data) e grava
 * o campo `fase_atual` diretamente pela API PocketBase — regras de permissão
 * já existentes (admin e superadmin podem escrever causas).
 */

/** Fase da audiência mais recente por data (empate: mais recente criada). */
export function calcularFasePorAudiencias(
  audiencias: { data: string; fase?: string | null; created?: string }[],
): string {
  const comFase = audiencias.filter((a) => !!a.fase)
  if (comFase.length === 0) return FASE_INICIAL

  const maisRecente = comFase.slice().sort((a, b) => {
    if (a.data !== b.data) return a.data > b.data ? 1 : -1
    const ca = a.created || ''
    const cb = b.created || ''
    if (ca !== cb) return ca > cb ? 1 : -1
    return 0
  })[comFase.length - 1]

  return maisRecente.fase || FASE_INICIAL
}

/**
 * Recalcula e grava a fase_atual da causa a partir das audiências atuais.
 * Best-effort: não propaga erro — a operação da audiência (criar/editar/excluir)
 * já teve sucesso e não deve ser reportada como falha por causa da fase.
 */
export async function recalcularFaseCausa(causaId: string): Promise<Causa | null> {
  try {
    const audiencias = await pb.collection('audiencias').getFullList<{
      data: string
      fase?: string | null
      created?: string
    }>({
      filter: pb.filter('causa_id = {:causaId}', { causaId }),
      sort: 'data,created',
    })

    const novaFase = calcularFasePorAudiencias(audiencias)

    // Verifica se a fase realmente mudou antes de gravar (evita writes desnecessários).
    const causa = await pb.collection('causas').getOne<Causa>(causaId)
    if (causa.fase_atual === novaFase) return causa

    return await pb.collection('causas').update<Causa>(causaId, { fase_atual: novaFase })
  } catch (error) {
    // Sem throw: a operação principal (audiência) já foi concluída.
    console.error('Erro ao recalcular a fase da causa:', error)
    return null
  }
}
