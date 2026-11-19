// Tipos de audiência em tabela própria (mesmo padrão de clientes / funções).
// - tipos_audiencia: nome único, ativo. Leitura para autenticados; escrever/excluir
//   para admin e superadmin (exclusão de tipo em uso é bloqueada pela relation).
// - audiencias: novo campo relation `tipo_audiencia` (opcional). O campo texto
//   `tipo` é mantido e continua sendo exibido em todas as telas.
// - Backfill idempotente: textos já digitados viram registros, com dedupe por
//   texto ignorando maiúsculas/minúsculas e espaços excedentes.

const REGRA_LEITURA = "@request.auth.id != ''"
const REGRA_ESCRITA =
  "@request.auth.id != '' && (@request.auth.role = 'superadmin' || @request.auth.role = 'admin')"

function chaveTipo(texto) {
  return String(texto || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

migrate(
  (app) => {
    // ---------- 1. Coleção tipos_audiencia ----------
    let tipos = null
    try {
      tipos = app.findCollectionByNameOrId('tipos_audiencia')
    } catch (_) {
      tipos = null
    }
    if (!tipos) {
      tipos = new Collection({
        name: 'tipos_audiencia',
        type: 'base',
        listRule: REGRA_LEITURA,
        viewRule: REGRA_LEITURA,
        createRule: REGRA_ESCRITA,
        updateRule: REGRA_ESCRITA,
        deleteRule: REGRA_ESCRITA,
        fields: [
          { name: 'nome', type: 'text', required: true, min: 1, max: 200 },
          { name: 'ativo', type: 'bool' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_tipos_audiencia_nome ON tipos_audiencia (nome)'],
      })
      app.save(tipos)
    }

    // ---------- 2. Audiências: relation tipo_audiencia ----------
    const audiencias = app.findCollectionByNameOrId('audiencias')
    if (!audiencias.fields.getByName('tipo_audiencia')) {
      audiencias.fields.add(
        new RelationField({
          name: 'tipo_audiencia',
          collectionId: tipos.id,
          maxSelect: 1,
          minSelect: 0,
        }),
      )
      app.save(audiencias)
    }

    // ---------- 3. Backfill: texto digitado -> registros (idempotente) ----------
    const mapa = {}
    const existentes = app.findRecordsByFilter('tipos_audiencia', "id != ''", '', 100000, 0)
    for (const reg of existentes) {
      mapa[chaveTipo(reg.getString('nome'))] = reg
    }

    const registros = app.findRecordsByFilter('audiencias', "tipo != ''", '', 100000, 0)
    for (const aud of registros) {
      if (aud.getString('tipo_audiencia')) continue
      const chave = chaveTipo(aud.getString('tipo'))
      if (!chave) continue
      let tipoReg = mapa[chave]
      if (!tipoReg) {
        tipoReg = new Record(app.findCollectionByNameOrId('tipos_audiencia'))
        tipoReg.set('nome', aud.getString('tipo').trim().replace(/\s+/g, ' '))
        tipoReg.set('ativo', true)
        app.save(tipoReg)
        mapa[chave] = tipoReg
      }
      aud.set('tipo_audiencia', tipoReg.id)
      app.save(aud)
    }
  },
  (app) => {
    // Reverter: remover a relation de audiencias e apagar a coleção de tipos
    try {
      const audiencias = app.findCollectionByNameOrId('audiencias')
      if (audiencias.fields.getByName('tipo_audiencia')) {
        audiencias.fields.removeByName('tipo_audiencia')
        app.save(audiencias)
      }
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('tipos_audiencia'))
    } catch (_) {}
  },
)
