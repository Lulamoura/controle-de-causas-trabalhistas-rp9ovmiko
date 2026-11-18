// Libera o gerenciamento dos cadastros auxiliares (clientes e funções do
// reclamante) também para o perfil admin: criar, editar e excluir.
// Leitura continua aberta a qualquer usuário autenticado; perfil leitura segue
// sem permissão de escrita. Idempotente: aplica as regras finais em ambas as
// coleções, sem depender do estado anterior.

migrate(
  (app) => {
    const regraEscrita =
      "@request.auth.id != '' && (@request.auth.role = 'superadmin' || @request.auth.role = 'admin')"

    for (const nome of ['clientes', 'funcoes_reclamante']) {
      const col = app.findCollectionByNameOrId(nome)
      col.createRule = regraEscrita
      col.updateRule = regraEscrita
      col.deleteRule = regraEscrita
      // listRule / viewRule permanecem: leitura para qualquer usuário autenticado
      app.save(col)
    }
  },
  (app) => {
    // Reverter: voltar escrita para superadmin apenas
    const regraSuperadmin = "@request.auth.id != '' && @request.auth.role = 'superadmin'"

    for (const nome of ['clientes', 'funcoes_reclamante']) {
      try {
        const col = app.findCollectionByNameOrId(nome)
        col.createRule = regraSuperadmin
        col.updateRule = regraSuperadmin
        col.deleteRule = regraSuperadmin
        app.save(col)
      } catch (_) {}
    }
  },
)
