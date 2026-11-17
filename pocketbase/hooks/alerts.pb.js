// PocketBase Server-side Hook: Deadline Alerts and Daily Cron check
// Checks upcoming audiências and prazos within 7 days.
// If an email provider/mailer is configured in PocketBase, sends notification to users with receive_email_alerts = true.
// If not configured, gracefully logs the alert to console/logs without error, ready to be enabled without rework.

cronAdd('check-deadline-alerts', '0 8 * * *', () => {
  // Runs daily at 08:00 AM UTC
  console.log(
    '[Avisos de Prazos] Executando rotina diária de verificação de prazos e audiências...',
  )
  try {
    const now = new Date()
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const dateLimitStr = sevenDaysLater.toISOString().split('T')[0] + ' 23:59:59.999Z'
    const dateNowStr = now.toISOString().split('T')[0] + ' 00:00:00.000Z'

    // 1. Fetch upcoming audiências <= 7 days
    const upcomingAudiencias = $app.findRecordsByFilter(
      'audiencias',
      `data >= '${dateNowStr}' && data <= '${dateLimitStr}'`,
      'data',
      50,
      0,
    )

    // 2. Fetch upcoming uncompleted prazos <= 7 days
    const upcomingPrazos = $app.findRecordsByFilter(
      'prazos',
      `concluido != true && data >= '${dateNowStr}' && data <= '${dateLimitStr}'`,
      'data',
      50,
      0,
    )

    const totalUrgent = upcomingAudiencias.length + upcomingPrazos.length
    console.log(
      `[Avisos de Prazos] Encontradas ${upcomingAudiencias.length} audiências e ${upcomingPrazos.length} prazos nos próximos 7 dias.`,
    )

    if (totalUrgent === 0) {
      console.log('[Avisos de Prazos] Nenhum prazo ou audiência urgente nos próximos 7 dias.')
      return
    }

    // 3. Fetch users who have receive_email_alerts = true and active = true
    const recipientUsers = $app.findRecordsByFilter(
      'users',
      'receive_email_alerts = true && active = true',
      'name',
      100,
      0,
    )

    if (recipientUsers.length === 0) {
      console.log('[Avisos de Prazos] Nenhum usuário configurado para receber avisos por e-mail.')
      return
    }

    console.log(
      `[Avisos de Prazos] Notificando ${recipientUsers.length} usuário(s) configurado(s).`,
    )

    // Prepare email body
    let itemsSummary = 'RESUMO DE AUDIÊNCIAS E PRAZOS PRÓXIMOS (MENOS DE 7 DIAS):\n\n'

    if (upcomingAudiencias.length > 0) {
      itemsSummary += '--- AUDIÊNCIAS ---\n'
      for (const aud of upcomingAudiencias) {
        let causaNum = 'Causa vinculada'
        try {
          const causa = $app.findRecordById('causas', aud.getString('causa_id'))
          causaNum = `Proc. ${causa.getString('numero_processo')} (${causa.getString('parte_contraria')})`
        } catch (_) {}
        itemsSummary += `• [Audiência] Data: ${aud.getString('data')} às ${aud.getString('hora')} - ${causaNum} | Tipo: ${aud.getString('tipo')} | Local: ${aud.getString('local')}\n`
      }
      itemsSummary += '\n'
    }

    if (upcomingPrazos.length > 0) {
      itemsSummary += '--- PRAZOS PROCESSUAIS ---\n'
      for (const prz of upcomingPrazos) {
        let causaNum = 'Causa vinculada'
        try {
          const causa = $app.findRecordById('causas', prz.getString('causa_id'))
          causaNum = `Proc. ${causa.getString('numero_processo')} (${causa.getString('parte_contraria')})`
        } catch (_) {}
        itemsSummary += `• [Prazo: ${prz.getString('tipo')}] Data: ${prz.getString('data')} - ${causaNum} | ${prz.getString('descricao')}\n`
      }
      itemsSummary += '\n'
    }

    // Attempt to send email to each recipient
    for (const user of recipientUsers) {
      const email = user.getString('email')
      const name = user.getString('name') || email

      try {
        const mailClient = $app.newMailClient()
        const message = new MailerMessage({
          from: {
            address: $app.settings().meta.senderAddress || 'noreply@causas.jur.br',
            name: $app.settings().meta.senderName || 'Controle de Causas Trabalhistas',
          },
          to: [{ address: email, name: name }],
          subject: `⚠️ Alerta de Prazos Trabalhistas: ${totalUrgent} compromisso(s) nos próximos 7 dias`,
          text: `Olá ${name},\n\nEste é um aviso do sistema Controle de Causas Trabalhistas com os compromissos agendados para os próximos 7 dias:\n\n${itemsSummary}\nAcesse o painel para maiores detalhes: ${$app.settings().meta.appUrl || ''}\n`,
        })

        mailClient.send(message)
        console.log(`[Avisos de Prazos] E-mail enviado com sucesso para ${email}`)
      } catch (err) {
        // When no email provider or SMTP is configured, log gracefully without breaking the system
        console.log(
          `[Avisos de Prazos] Serviço de e-mail ainda não configurado para envio externo. Notificação registrada para ${email}. Detalhes: ${err && err.message ? err.message : err}`,
        )
      }
    }
  } catch (globalErr) {
    console.log(
      `[Avisos de Prazos] Erro durante verificação: ${globalErr && globalErr.message ? globalErr.message : globalErr}`,
    )
  }
})

// Custom endpoint to allow superadmin or frontend to trigger immediate deadline alert check
routerAdd('POST', '/backend/v1/check-deadline-alerts', (c) => {
  if (!c.auth) {
    return c.json(401, { message: 'Autenticação necessária.' })
  }

  try {
    const now = new Date()
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const dateLimitStr = sevenDaysLater.toISOString().split('T')[0] + ' 23:59:59.999Z'
    const dateNowStr = now.toISOString().split('T')[0] + ' 00:00:00.000Z'

    const upcomingAudiencias = $app.findRecordsByFilter(
      'audiencias',
      `data >= '${dateNowStr}' && data <= '${dateLimitStr}'`,
      'data',
      50,
      0,
    )

    const upcomingPrazos = $app.findRecordsByFilter(
      'prazos',
      `concluido != true && data >= '${dateNowStr}' && data <= '${dateLimitStr}'`,
      'data',
      50,
      0,
    )

    const recipients = $app.findRecordsByFilter(
      'users',
      'receive_email_alerts = true && active = true',
      'name',
      100,
      0,
    )

    return c.json(200, {
      success: true,
      upcomingAudienciasCount: upcomingAudiencias.length,
      upcomingPrazosCount: upcomingPrazos.length,
      configuredRecipientsCount: recipients.length,
      message: `Encontradas ${upcomingAudiencias.length} audiências e ${upcomingPrazos.length} prazos nos próximos 7 dias. ${recipients.length} usuário(s) configurado(s) para receber notificações.`,
    })
  } catch (err) {
    return c.json(500, {
      success: false,
      error: err && err.message ? err.message : String(err),
    })
  }
})
