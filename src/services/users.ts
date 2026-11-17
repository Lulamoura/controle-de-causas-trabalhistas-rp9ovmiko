import pb from '@/lib/pocketbase/client'
import { User, UserRole } from '@/types'

export interface CreateUserData {
  name: string
  email: string
  password?: string
  role: UserRole
  receive_email_alerts?: boolean
}

export interface UpdateUserData {
  name?: string
  role?: UserRole
  receive_email_alerts?: boolean
  active?: boolean
  password?: string
  /** Senha atual do usuário — obrigatória quando o próprio usuário troca a senha (não quando o superadmin redefine). */
  oldPassword?: string
}

export const usersService = {
  async getAll(): Promise<User[]> {
    const list = await pb.collection('users').getFullList({
      sort: '-created',
    })
    return list.map((m) => ({
      id: m.id,
      email: m.email,
      name: m.name || m.email?.split('@')[0] || 'Usuário',
      role: (m.role as UserRole) || 'leitura',
      receive_email_alerts: Boolean(m.receive_email_alerts),
      active: m.active !== false,
      created: m.created,
      updated: m.updated,
    }))
  },

  async create(data: CreateUserData): Promise<User> {
    const defaultPassword =
      data.password && data.password.trim() ? data.password.trim() : 'Skip@Pass123'
    const record = await pb.collection('users').create({
      email: data.email.trim(),
      password: defaultPassword,
      passwordConfirm: defaultPassword,
      name: data.name.trim(),
      role: data.role,
      receive_email_alerts: Boolean(data.receive_email_alerts),
      active: true,
      emailVisibility: true,
    })
    return {
      id: record.id,
      email: record.email,
      name: record.name,
      role: record.role,
      receive_email_alerts: record.receive_email_alerts,
      active: record.active,
      created: record.created,
      updated: record.updated,
    }
  },

  async update(id: string, data: UpdateUserData): Promise<User> {
    const payload: Record<string, any> = {}
    if (data.name !== undefined) payload.name = data.name.trim()
    if (data.role !== undefined) payload.role = data.role
    if (data.receive_email_alerts !== undefined)
      payload.receive_email_alerts = data.receive_email_alerts
    if (data.active !== undefined) payload.active = data.active
    if (data.password && data.password.trim()) {
      payload.password = data.password.trim()
      payload.passwordConfirm = data.password.trim()
      // PocketBase exige a senha atual (oldPassword) quando um usuário comum
      // altera a própria senha pela API de update do registro.
      if (data.oldPassword) {
        payload.oldPassword = data.oldPassword
      }
    }

    const record = await pb.collection('users').update(id, payload)
    return {
      id: record.id,
      email: record.email,
      name: record.name,
      role: record.role,
      receive_email_alerts: record.receive_email_alerts,
      active: record.active,
      created: record.created,
      updated: record.updated,
    }
  },

  async changeOwnPassword(currentPassword: string, newPassword: string): Promise<User> {
    if (!pb.authStore.model?.id) throw new Error('Usuário não autenticado.')
    return await this.update(pb.authStore.model.id, {
      password: newPassword.trim(),
      oldPassword: currentPassword,
    })
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('users').delete(id)
  },

  async triggerDeadlineCheck(): Promise<any> {
    try {
      return await pb.send('/backend/v1/check-deadline-alerts', {
        method: 'POST',
      })
    } catch (err) {
      console.warn('Erro ao disparar verificação no servidor:', err)
      return { success: false, error: err }
    }
  },
}
