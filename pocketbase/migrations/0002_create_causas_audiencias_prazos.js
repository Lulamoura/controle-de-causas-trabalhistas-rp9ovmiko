migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    // 1. Causas collection
    const causas = new Collection({
      name: 'causas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule:
        "@request.auth.id != '' && (@request.auth.role = 'superadmin' || @request.auth.role = 'admin')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.role = 'superadmin' || @request.auth.role = 'admin')",
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'superadmin'",
      fields: [
        { name: 'numero_processo', type: 'text', required: true },
        { name: 'vara_juizo', type: 'text', required: true },
        { name: 'parte_contraria', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: [
            'ajuizada',
            'em andamento',
            'audiência marcada',
            'contestação',
            'sentença',
            'recurso',
            'arquivada',
          ],
          maxSelect: 1,
        },
        { name: 'valor_causa', type: 'number', required: false },
        { name: 'responsavel', type: 'text', required: true },
        { name: 'observacoes', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_causas_numero ON causas (numero_processo)',
        'CREATE INDEX idx_causas_status ON causas (status)',
      ],
    })
    app.save(causas)

    // 2. Audiências collection
    const audiencias = new Collection({
      name: 'audiencias',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule:
        "@request.auth.id != '' && (@request.auth.role = 'superadmin' || @request.auth.role = 'admin')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.role = 'superadmin' || @request.auth.role = 'admin')",
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'superadmin'",
      fields: [
        {
          name: 'causa_id',
          type: 'relation',
          required: true,
          collectionId: causas.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'data', type: 'date', required: true },
        { name: 'hora', type: 'text', required: true },
        { name: 'local', type: 'text', required: true },
        { name: 'tipo', type: 'text', required: true }, // ex: Inicial, Instrução, Conciliação, UNA, Julgamento
        { name: 'prazo_preparacao_dias', type: 'number', required: false },
        { name: 'observacoes', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_audiencias_causa ON audiencias (causa_id)',
        'CREATE INDEX idx_audiencias_data ON audiencias (data)',
      ],
    })
    app.save(audiencias)

    // 3. Prazos collection
    const prazos = new Collection({
      name: 'prazos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule:
        "@request.auth.id != '' && (@request.auth.role = 'superadmin' || @request.auth.role = 'admin')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.role = 'superadmin' || @request.auth.role = 'admin')",
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'superadmin'",
      fields: [
        {
          name: 'causa_id',
          type: 'relation',
          required: true,
          collectionId: causas.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['audiência', 'contestação', 'sentença', 'recurso', 'outro'],
          maxSelect: 1,
        },
        { name: 'data', type: 'date', required: true },
        { name: 'descricao', type: 'text', required: true },
        { name: 'concluido', type: 'bool', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_prazos_causa ON prazos (causa_id)',
        'CREATE INDEX idx_prazos_data ON prazos (data)',
      ],
    })
    app.save(prazos)
  },
  (app) => {
    try {
      const prazos = app.findCollectionByNameOrId('prazos')
      app.delete(prazos)
    } catch (_) {}
    try {
      const audiencias = app.findCollectionByNameOrId('audiencias')
      app.delete(audiencias)
    } catch (_) {}
    try {
      const causas = app.findCollectionByNameOrId('causas')
      app.delete(causas)
    } catch (_) {}
  },
)
