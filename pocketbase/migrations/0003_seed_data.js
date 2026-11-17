migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    // 1. Seed initial superadmin user
    const adminEmail = 'luiz.moura@pmaisservicos.com.br'
    let superadminRecord
    try {
      superadminRecord = app.findAuthRecordByEmail('users', adminEmail)
      // ensure role is superadmin
      superadminRecord.set('role', 'superadmin')
      superadminRecord.set('active', true)
      superadminRecord.set('receive_email_alerts', true)
      app.save(superadminRecord)
    } catch (_) {
      superadminRecord = new Record(users)
      superadminRecord.setEmail(adminEmail)
      superadminRecord.setPassword('Skip@Pass123')
      superadminRecord.setVerified(true)
      superadminRecord.set('name', 'Dr. Luiz Moura (Superadmin)')
      superadminRecord.set('role', 'superadmin')
      superadminRecord.set('active', true)
      superadminRecord.set('receive_email_alerts', true)
      app.save(superadminRecord)
    }

    // 2. Also create a demo admin user and demo leitura user for quick testing & demonstration
    const adminTestEmail = 'admin@causas.jur.br'
    try {
      app.findAuthRecordByEmail('users', adminTestEmail)
    } catch (_) {
      const adminRec = new Record(users)
      adminRec.setEmail(adminTestEmail)
      adminRec.setPassword('Skip@Pass123')
      adminRec.setVerified(true)
      adminRec.set('name', 'Dra. Carolina Mendes (Advogada Admin)')
      adminRec.set('role', 'admin')
      adminRec.set('active', true)
      adminRec.set('receive_email_alerts', true)
      app.save(adminRec)
    }

    const leituraTestEmail = 'leitura@causas.jur.br'
    try {
      app.findAuthRecordByEmail('users', leituraTestEmail)
    } catch (_) {
      const leituraRec = new Record(users)
      leituraRec.setEmail(leituraTestEmail)
      leituraRec.setPassword('Skip@Pass123')
      leituraRec.setVerified(true)
      leituraRec.set('name', 'Roberto Alves (Consulta Leitura)')
      leituraRec.set('role', 'leitura')
      leituraRec.set('active', true)
      leituraRec.set('receive_email_alerts', false)
      app.save(leituraRec)
    }

    // 3. Seed sample Causas, Audiências and Prazos with upcoming dates (including < 7 days for alerts)
    const causasCol = app.findCollectionByNameOrId('causas')
    const audienciasCol = app.findCollectionByNameOrId('audiencias')
    const prazosCol = app.findCollectionByNameOrId('prazos')

    const existingCausas = app.findRecordsByFilter('causas', '', '', 1, 0)
    if (existingCausas.length > 0) {
      return // Already seeded
    }

    // Causa 1: Audiência marcada (urgente em 3 dias)
    const c1 = new Record(causasCol)
    c1.set('numero_processo', '0010452-88.2024.5.02.0042')
    c1.set('vara_juizo', '42ª Vara do Trabalho de São Paulo/SP')
    c1.set('parte_contraria', 'Carlos Eduardo da Silva')
    c1.set('status', 'audiência marcada')
    c1.set('valor_causa', 85000)
    c1.set('responsavel', 'Dra. Carolina Mendes')
    c1.set(
      'observacoes',
      'Reclamatória trabalhista pleiteando equiparação salarial e horas extras.',
    )
    app.save(c1)

    // Audiência para C1 em 3 dias
    const now = new Date()
    const dAud1 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const a1 = new Record(audienciasCol)
    a1.set('causa_id', c1.id)
    a1.set('data', dAud1.toISOString().split('T')[0] + ' 14:00:00.000Z')
    a1.set('hora', '14:00')
    a1.set('local', 'Sala de Audiências 2 - Fórum Ruy Barbosa (ou Telepresencial)')
    a1.set('tipo', 'Instrução e Julgamento')
    a1.set('prazo_preparacao_dias', 5)
    a1.set('observacoes', 'Testemunhas da empresa já contatadas para alinhamento prévio.')
    app.save(a1)

    // Prazo para C1 em 2 dias (urgente < 7 dias)
    const dPrazo1 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
    const p1 = new Record(prazosCol)
    p1.set('causa_id', c1.id)
    p1.set('tipo', 'audiência')
    p1.set('data', dPrazo1.toISOString().split('T')[0] + ' 23:59:00.000Z')
    p1.set('descricao', 'Juntar rol de testemunhas e documentos complementares no PJe')
    p1.set('concluido', false)
    app.save(p1)

    // Causa 2: Contestação (em andamento, prazo em 5 dias)
    const c2 = new Record(causasCol)
    c2.set('numero_processo', '0020119-14.2024.5.15.0089')
    c2.set('vara_juizo', '2ª Vara do Trabalho de Campinas/SP')
    c2.set('parte_contraria', 'Mariana Beatriz dos Santos')
    c2.set('status', 'contestação')
    c2.set('valor_causa', 42300)
    c2.set('responsavel', 'Dr. Luiz Moura')
    c2.set('observacoes', 'Pedido de rescisão indireta com pedido de horas de sobreaviso.')
    app.save(c2)

    const dPrazo2 = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
    const p2 = new Record(prazosCol)
    p2.set('causa_id', c2.id)
    p2.set('tipo', 'contestação')
    p2.set('data', dPrazo2.toISOString().split('T')[0] + ' 23:59:00.000Z')
    p2.set('descricao', 'Protocolar contestação com espelhos de ponto e comprovantes de quitação')
    p2.set('concluido', false)
    app.save(p2)

    // Causa 3: Recurso Ordinário (prazo em 12 dias - normal)
    const c3 = new Record(causasCol)
    c3.set('numero_processo', '0000781-33.2023.5.03.0104')
    c3.set('vara_juizo', '4ª Vara do Trabalho de Belo Horizonte/MG')
    c3.set('parte_contraria', 'Marcos Vinicius de Oliveira')
    c3.set('status', 'recurso')
    c3.set('valor_causa', 120000)
    c3.set('responsavel', 'Dr. Luiz Moura')
    c3.set(
      'observacoes',
      'Sentença parcialmente procedente. Recorrer de adicionais de periculosidade.',
    )
    app.save(c3)

    const dPrazo3 = new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000)
    const p3 = new Record(prazosCol)
    p3.set('causa_id', c3.id)
    p3.set('tipo', 'recurso')
    p3.set('data', dPrazo3.toISOString().split('T')[0] + ' 23:59:00.000Z')
    p3.set(
      'descricao',
      'Interpor Recurso Ordinário perante o TRT da 3ª Região com comprovante de custas e depósito recursal',
    )
    p3.set('concluido', false)
    app.save(p3)

    // Audiência para C3 em 25 dias
    const dAud2 = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000)
    const a2 = new Record(audienciasCol)
    a2.set('causa_id', c3.id)
    a2.set('data', dAud2.toISOString().split('T')[0] + ' 10:30:00.000Z')
    a2.set('hora', '10:30')
    a2.set('local', 'TRT 3ª Região - Turma Julgadora')
    a2.set('tipo', 'Sessão de Julgamento do Recurso')
    a2.set('prazo_preparacao_dias', 3)
    a2.set('observacoes', 'Preparar sustentação oral com antecedência.')
    app.save(a2)

    // Causa 4: Ajuizada recentemente
    const c4 = new Record(causasCol)
    c4.set('numero_processo', '0031892-05.2024.5.01.0018')
    c4.set('vara_juizo', '18ª Vara do Trabalho do Rio de Janeiro/RJ')
    c4.set('parte_contraria', 'Juliana Fagundes')
    c4.set('status', 'ajuizada')
    c4.set('valor_causa', 35000)
    c4.set('responsavel', 'Dra. Carolina Mendes')
    c4.set(
      'observacoes',
      'Notificação inicial recebida. Aguardando designação de primeira audiência.',
    )
    app.save(c4)
  },
  (app) => {
    // down logic if needed
  },
)
