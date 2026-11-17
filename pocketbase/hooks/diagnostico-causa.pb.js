// Diagnóstico TEMPORÁRIO (cron a cada 2 min): prova o estado do runtime da
// Skip Cloud — lê o bundle do runtime (pb.js) e procura a ocorrência órfã de
// `audiencias` que quebra todo save de causa; testa um save real de causa e
// grava o resultado como "descricao" de um prazo criado/apagado no teste
// (legível via db_query, sem depender de logs). Apagar quando o problema sumir.
cronAdd('diagnostico-runtime', '*/2 * * * *', () => {
  const resultado = { versao: 'v10-2026-11-17' }

  // 1. O que o RUNTIME realmente executa: pb.js (bundle minificado do hook)
  try {
    const bundle = $os.readFile('/data/controle-de-causas-trabalhistas-c21e6/pb.js')
    const texto = String.fromCharCode.apply(null, bundle)
    resultado.runtimePbJsTamanho = texto.length
    // onde `audiencias` aparece como IDENTIFICADOR (não como string 'audiencias')
    const ocorrencias = []
    let idx = texto.indexOf('audiencias')
    while (idx !== -1 && ocorrencias.length < 10) {
      const antes = texto.slice(Math.max(0, idx - 30), idx)
      const depois = texto.slice(idx + 10, idx + 40)
      ocorrencias.push('...' + antes + '[AUDI] ' + depois + '...')
      idx = texto.indexOf('audiencias', idx + 1)
    }
    resultado.ocorrenciasAudiencias = ocorrencias
  } catch (eRead) {
    resultado.runtimePbJs = 'ERRO: ' + String(eRead)
  }

  // 2. Teste de save de causa (o cenário exato que quebra)
  try {
    const col = $app.findCollectionByNameOrId('causas')
    const rec = new Record(col)
    rec.set('numero_processo', 'DIAG-' + $security.randomString(4).toUpperCase())
    rec.set('vara_juizo', 'Diagnóstico')
    rec.set('parte_contraria', 'Diagnóstico')
    rec.set('status', 'ajuizada')
    rec.set('responsavel', 'Diagnóstico')
    try {
      $app.save(rec)
      resultado.salvarCausa = 'OK: ' + rec.id
    } catch (eSalvar) {
      resultado.salvarCausa = 'ERRO: ' + String(eSalvar)
    }
  } catch (eCol) {
    resultado.salvarCausa = 'ERRO COL: ' + String(eCol)
  }

  // 3. Persistir o resultado como um registro "descartável" legível do lado de fora
  try {
    const colPrazos = $app.findCollectionByNameOrId('prazos')
    const p = new Record(colPrazos)
    p.set('causa_id', '0000000000000000') // placeholder — será apagado abaixo
    p.set('tipo', 'outro')
    p.set('data', new Date().toISOString().slice(0, 10) + ' 00:00:00.000Z')
    p.set('descricao', 'DIAG-RUNTIME ' + JSON.stringify(resultado).slice(0, 900))
    p.set('concluido', true)
    $app.save(p)
    $app.delete(p)
  } catch (_) {}
})
