// Anexos do processo: documentos anexados a uma causa.
// - arquivo: file (até 10 arquivos por registro, ~10 MB cada, pdf/imagens/office)
// - descricao: texto opcional
// - uploaded_by: usuário que fez o upload (opcional)
// Regras: leitura para qualquer usuário autenticado;
// criação/edição para superadmin ou admin; exclusão apenas superadmin.

migrate(
  (app) => {
    const causasId = app.findCollectionByNameOrId('causas').id

    const collection = new Collection({
      name: 'anexos',
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
          collectionId: causasId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'arquivo',
          type: 'file',
          required: true,
          maxSelect: 10,
          maxSize: 10485760,
          mimeTypes: [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/webp',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          ],
        },
        { name: 'descricao', type: 'text', maxSize: 1000 },
        {
          name: 'uploaded_by',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_anexos_causa ON anexos (causa_id)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('anexos')
    app.delete(collection)
  },
)
