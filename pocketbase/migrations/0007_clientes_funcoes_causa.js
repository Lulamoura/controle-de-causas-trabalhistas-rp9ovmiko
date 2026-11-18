// Cadastros auxiliares da causa: clientes e funções do reclamante.
// - clientes: tabela de cadastro (nome único, ativo) — começa vazia (dados reais do usuário)
// - funcoes_reclamante: tabela de cadastro (nome único, ativo) — semeada com funções comuns
//   de mão de obra terceirizada para o combo não nascer vazio
// - causas: novos campos de relação opcionais `cliente` e `funcao_reclamante`
// - anexos: campo file elevado para 100 MB por arquivo
// Regras dos cadastros: leitura para qualquer usuário autenticado;
// criar/editar apenas superadmin; exclusão apenas superadmin (relation com
// onDelete restrito impede excluir registro em uso — erro tratado no frontend).

migrate(
  (app) => {
    // ---------- 1. Coleção clientes ----------
    const clientes = new Collection({
      name: 'clientes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != '' && @request.auth.role = 'superadmin'",
      updateRule: "@request.auth.id != '' && @request.auth.role = 'superadmin'",
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'superadmin'",
      fields: [
        { name: 'nome', type: 'text', required: true, min: 2, max: 200 },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_clientes_nome ON clientes (nome)'],
    })
    app.save(clientes)

    // ---------- 2. Coleção funcoes_reclamante ----------
    const funcoes = new Collection({
      name: 'funcoes_reclamante',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != '' && @request.auth.role = 'superadmin'",
      updateRule: "@request.auth.id != '' && @request.auth.role = 'superadmin'",
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'superadmin'",
      fields: [
        { name: 'nome', type: 'text', required: true, min: 2, max: 200 },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_funcoes_reclamante_nome ON funcoes_reclamante (nome)'],
    })
    app.save(funcoes)

    // ---------- 3. Causas: relations cliente / funcao_reclamante ----------
    const causas = app.findCollectionByNameOrId('causas')
    causas.fields.add(
      new RelationField({
        name: 'cliente',
        collectionId: app.findCollectionByNameOrId('clientes').id,
        maxSelect: 1,
        minSelect: 0,
      }),
    )
    causas.fields.add(
      new RelationField({
        name: 'funcao_reclamante',
        collectionId: app.findCollectionByNameOrId('funcoes_reclamante').id,
        maxSelect: 1,
        minSelect: 0,
      }),
    )
    app.save(causas)

    // ---------- 4. Anexos: file até 100 MB por arquivo ----------
    const anexos = app.findCollectionByNameOrId('anexos')
    const campoArquivo = anexos.fields.getByName('arquivo')
    if (campoArquivo) {
      campoArquivo.maxSize = 104857600 // 100 MB
      app.save(anexos)
    }

    // ---------- 5. Seed de funções comuns (idempotente) ----------
    const funcoesSeed = [
      'Servente',
      'Pedreiro',
      'Eletricista',
      'Encanador',
      'Carpinteiro',
      'Motorista',
      'Auxiliar de Limpeza',
    ]
    for (const nome of funcoesSeed) {
      try {
        app.findFirstRecordByFilter('funcoes_reclamante', "nome = '{:nome}'", { nome })
      } catch (_) {
        const record = new Record(app.findCollectionByNameOrId('funcoes_reclamante'))
        record.set('nome', nome)
        record.set('ativo', true)
        app.save(record)
      }
    }
  },
  (app) => {
    // Reverter: remover campos de causas, depois apagar as coleções novas
    try {
      const causas = app.findCollectionByNameOrId('causas')
      const campoCliente = causas.fields.getByName('cliente')
      if (campoCliente) causas.fields.removeByName('cliente')
      const campoFuncao = causas.fields.getByName('funcao_reclamante')
      if (campoFuncao) causas.fields.removeByName('funcao_reclamante')
      app.save(causas)
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('funcoes_reclamante'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('clientes'))
    } catch (_) {}
  },
)
