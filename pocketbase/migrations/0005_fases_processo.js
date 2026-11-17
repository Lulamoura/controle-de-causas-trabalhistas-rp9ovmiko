// Fases do processo trabalhista:
// 1. Petição Inicial — fase inicial de toda causa nova
// 2. Defesa do Reclamado
// 3. Audiência de Conciliação
// 4. Instrução e Produção de Provas
// 5. Sentença
// Adiciona "fase" e "observacao_fase" em audiencias e "fase_atual" em causas,
// com backfill das causas existentes para "Petição Inicial".

migrate(
  (app) => {
    const fases = [
      'Petição Inicial',
      'Defesa do Reclamado',
      'Audiência de Conciliação',
      'Instrução e Produção de Provas',
      'Sentença',
    ]

    const audiencias = app.findCollectionByNameOrId('audiencias')
    if (!audiencias.fields.getByName('fase')) {
      audiencias.fields.add(new SelectField({ name: 'fase', values: fases, maxSelect: 1 }))
    }
    if (!audiencias.fields.getByName('observacao_fase')) {
      audiencias.fields.add(new TextField({ name: 'observacao_fase', maxSize: 2000 }))
    }
    app.save(audiencias)

    const causas = app.findCollectionByNameOrId('causas')
    if (!causas.fields.getByName('fase_atual')) {
      causas.fields.add(new SelectField({ name: 'fase_atual', values: fases, maxSelect: 1 }))
    }
    app.save(causas)

    // Backfill idempotente: toda causa existente nasce/entra na fase inicial
    app
      .db()
      .newQuery(
        "UPDATE causas SET fase_atual = 'Petição Inicial' WHERE fase_atual IS NULL OR fase_atual = ''",
      )
      .execute()
  },
  (app) => {
    const audiencias = app.findCollectionByNameOrId('audiencias')
    audiencias.fields.removeByName('fase')
    audiencias.fields.removeByName('observacao_fase')
    app.save(audiencias)

    const causas = app.findCollectionByNameOrId('causas')
    causas.fields.removeByName('fase_atual')
    app.save(causas)
  },
)
