migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    // Regra de update que permite:
    //  - superadmin atualizar qualquer usuário
    //  - qualquer usuário autenticado atualizar o PRÓPRIO registro
    //    (somente para trocar a própria senha, com confirmação da senha
    //    atual via oldPassword — a troca de e-mail segue pelo fluxo
    //    oficial requestEmailChange/confirmEmailChange do PocketBase)
    users.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'superadmin' || " +
      "(id = @request.auth.id && @request.body.oldPassword != '' && " +
      '@request.body.role:changed = false && @request.body.active:changed = false))'

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'superadmin' || " +
      '(id = @request.auth.id && @request.body.role:changed = false && ' +
      '@request.body.active:changed = false))'
    app.save(users)
  },
)
