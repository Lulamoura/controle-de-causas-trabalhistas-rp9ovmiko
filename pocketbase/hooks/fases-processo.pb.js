// Fase do processo: recálculo automático (v2 — redeploy para sincronizar o runtime).
// Toda vez que uma audiência é criada, atualizada ou excluída, a causa vinculada
// recebe a fase da audiência de data MAIS RECENTE (empate resolvido por created),
// ou volta para "Petição Inicial" quando não resta nenhuma audiência.
// Regra de ouro: qualquer falha no recálculo é apenas registrada em log —
// nunca bloqueia a operação do usuário (e.next() sempre no finally).

const FASE_INICIAL = 'Petição Inicial'

const recalcularFase = (app, causaId) => {
  if (!causaId) return

  let causa
  try {
    causa = app.findRecordById('causas', causaId)
  } catch (_) {
    return
  }

  let novaFase = FASE_INICIAL
  try {
    // Audiências ordenadas da mais recente para a mais antiga
    const ultimas = app.findRecordsByFilter(
      'audiencias',
      `causa_id = '${causaId}' && fase != ''`,
      '-data,-created',
      1,
      0,
    )
    if (ultimas.length > 0 && ultimas[0].getString('fase')) {
      novaFase = ultimas[0].getString('fase')
    }
  } catch (err) {
    console.log(`[Fases do Processo] Erro ao buscar audiências da causa: ${err}`)
    return
  }

  if (causa.getString('fase_atual') === novaFase) return

  causa.set('fase_atual', novaFase)
  app.save(causa)
}

const wrap = (fn) => (e) => {
  try {
    fn(e)
  } catch (err) {
    // Nunca deve bloquear a operação do usuário por falha no recálculo,
    // mas deve ficar visível nos logs.
    console.log(`[Fases do Processo] Erro ao recalcular fase da causa: ${err}`)
  } finally {
    e.next()
  }
}

onRecordCreate('audiencias').bind(
  wrap((e) => {
    recalcularFase(e.app, e.record.getString('causa_id'))
  }),
)

onRecordUpdate('audiencias').bind(
  wrap((e) => {
    // Se a causa mudou, recalcula a fase da causa antiga também
    const causaAnterior = e.record.original().getString('causa_id')
    recalcularFase(e.app, e.record.getString('causa_id'))
    if (causaAnterior && causaAnterior !== e.record.getString('causa_id')) {
      recalcularFase(e.app, causaAnterior)
    }
  }),
)

onRecordDelete('audiencias').bind(
  wrap((e) => {
    recalcularFase(e.app, e.record.original().getString('causa_id'))
  }),
)

// Segurança extra: criação direta de causa nasce sempre na fase inicial
onRecordCreate('causas').bind(
  wrap((e) => {
    if (!e.record.getString('fase_atual')) {
      e.record.set('fase_atual', FASE_INICIAL)
    }
  }),
)
