// Diagnóstico TEMPORÁRIO (auto-executável): roda a cada 2 minutos e grava o resultado
// apenas no log de hooks. A causa raiz do "Failed to create record." aparece quando
// chamamos $app.save() DIRETO (sem o router, que encapsula o erro real).
// Apagar este arquivo assim que o diagnóstico for concluído.

cronAdd('diagnostico-causa', '*/2 * * * *', () => {
  const resultado = {}

  try {
    const col = $app.findCollectionByNameOrId('causas')
    resultado.regraCreate = col.createRule

    // (1) $app.save DIRETO — erro real sem encapsulamento do router
    try {
      const rec = new Record(col)
      rec.set('numero_processo', 'DIAG-DIRETO-0001')
      rec.set('vara_juizo', 'Diagnóstico')
      rec.set('parte_contraria', 'Diagnóstico')
      rec.set('status', 'ajuizada')
      rec.set('responsavel', 'Diagnóstico')
      $app.save(rec)
      resultado.salvarDireto = 'OK: ' + rec.id
      try {
        $app.delete(rec)
      } catch (_) {}
    } catch (eSalvar) {
      resultado.salvarDireto = 'ERRO: ' + String(eSalvar)
    }

    // (2) INSERT SQL bruto — testa a camada do banco diretamente
    let idSql = ''
    try {
      idSql = 'diagsql' + $security.randomString(5).toLowerCase()
      $app
        .db()
        .newQuery(
          'INSERT INTO causas (id, numero_processo, vara_juizo, parte_contraria, status, responsavel) VALUES ({:id}, {:n}, {:v}, {:p}, {:s}, {:r})',
        )
        .bind({
          id: idSql,
          n: 'DIAG-SQL-0001',
          v: 'Diagnóstico',
          p: 'Diagnóstico',
          s: 'ajuizada',
          r: 'Diagnóstico',
        })
        .execute()
      resultado.insertSql = 'OK'
    } catch (eSql) {
      resultado.insertSql = 'ERRO: ' + String(eSql)
    }
    try {
      $app.db().newQuery('DELETE FROM causas WHERE id = {:id}').bind({ id: idSql }).execute()
    } catch (_) {}

    // (3) POST via HTTP com token de superusuário (regras não se aplicam)
    try {
      const adminsSuper = $app.findRecordsByFilter('_superusers', '', '', 1, 0)
      const tokenAdmin = adminsSuper[0].newAuthToken()
      const resp = $http.send({
        url: $os.getenv('PB_INSTANCE_URL') + '/api/collections/causas/records',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: tokenAdmin },
        body: JSON.stringify({
          numero_processo: 'DIAG-SUPER-0001',
          vara_juizo: 'Diagnóstico',
          parte_contraria: 'Diagnóstico',
          status: 'ajuizada',
          responsavel: 'Diagnóstico',
        }),
      })
      resultado.postSuperuser = resp.statusCode + ' ' + String(resp.raw).slice(0, 300)
      if (resp.statusCode === 200) {
        try {
          $app.delete($app.findRecordById('causas', resp.json.id))
        } catch (_) {}
      }
    } catch (eHttp) {
      resultado.postSuperuser = 'ERRO: ' + String(eHttp)
    }
  } catch (globalErr) {
    resultado.global = String(globalErr)
  }

  console.log('[diagnostico-causa] ' + JSON.stringify(resultado))
})
