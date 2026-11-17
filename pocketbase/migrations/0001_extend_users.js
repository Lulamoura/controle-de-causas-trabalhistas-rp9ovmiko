migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    // Add role: superadmin, admin, leitura (default leitura)
    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          required: false,
          values: ['superadmin', 'admin', 'leitura'],
          maxSelect: 1,
        }),
      )
    }

    // Add receive_email_alerts (boolean)
    if (!users.fields.getByName('receive_email_alerts')) {
      users.fields.add(
        new BoolField({
          name: 'receive_email_alerts',
          required: false,
        }),
      )
    }

    // Add active (boolean) - default true
    if (!users.fields.getByName('active')) {
      users.fields.add(
        new BoolField({
          name: 'active',
          required: false,
        }),
      )
    }

    // Access rules:
    // List/View: Any authenticated user can view users (needed for assignment and listing)
    users.listRule = "@request.auth.id != ''"
    users.viewRule = "@request.auth.id != ''"
    // Create: Only superadmins can create new users (no open signup)
    users.createRule = "@request.auth.id != '' && @request.auth.role = 'superadmin'"
    // Update: Superadmins can update anyone. Users can update their own name/avatar, but NOT role/active/receive_email_alerts unless superadmin
    users.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'superadmin' || (id = @request.auth.id && @request.body.role:changed = false && @request.body.active:changed = false))"
    // Delete: Only superadmin
    users.deleteRule = "@request.auth.id != '' && @request.auth.role = 'superadmin'"

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    const roleField = users.fields.getByName('role')
    if (roleField) users.fields.removeByName('role')
    const alertField = users.fields.getByName('receive_email_alerts')
    if (alertField) users.fields.removeByName('receive_email_alerts')
    const activeField = users.fields.getByName('active')
    if (activeField) users.fields.removeByName('active')
    app.save(users)
  },
)
