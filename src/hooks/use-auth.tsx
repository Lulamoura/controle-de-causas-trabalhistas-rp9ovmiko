import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import { User, UserRole } from '@/types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isSuperadmin: boolean
  isAdmin: boolean
  isLeitura: boolean
  canEdit: boolean
  canDelete: boolean
  signIn: (email: string, pass: string) => Promise<{ error: any }>
  signOut: () => void
  requestPasswordReset: (email: string) => Promise<{ error: any }>
  confirmPasswordReset: (token: string, password: string) => Promise<{ error: any }>
  requestEmailChange: (newEmail: string) => Promise<{ error: any }>
  confirmEmailChange: (token: string, password: string) => Promise<{ error: any }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function mapAuthModelToUser(model: any): User | null {
  if (!model) return null
  return {
    id: model.id,
    email: model.email,
    name: model.name || model.email?.split('@')[0] || 'Usuário',
    avatar: model.avatar,
    role: (model.role as UserRole) || 'leitura',
    receive_email_alerts: Boolean(model.receive_email_alerts),
    active: model.active !== false,
    created: model.created,
    updated: model.updated,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    return mapAuthModelToUser(pb.authStore.model)
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const refreshProfile = async () => {
    try {
      if (pb.authStore.isValid && pb.authStore.model?.id) {
        const refreshed = await pb.collection('users').getOne(pb.authStore.model.id)
        setUser(mapAuthModelToUser(refreshed))
      } else {
        setUser(null)
      }
    } catch {
      setUser(mapAuthModelToUser(pb.authStore.model))
    }
  }

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setUser(mapAuthModelToUser(model))
    })

    // Initial check
    if (pb.authStore.isValid && pb.authStore.model?.id) {
      refreshProfile().finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }

    return () => {
      unsubscribe()
    }
  }, [])

  const signIn = async (email: string, pass: string) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email.trim(), pass)
      const u = mapAuthModelToUser(authData.record)
      if (u && u.active === false) {
        pb.authStore.clear()
        return { error: new Error('Sua conta está desativada. Contate o administrador.') }
      }
      setUser(u)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = () => {
    pb.authStore.clear()
    setUser(null)
  }

  const requestPasswordReset = async (email: string) => {
    try {
      await pb.collection('users').requestPasswordReset(email.trim())
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const confirmPasswordReset = async (token: string, password: string) => {
    try {
      await pb.collection('users').confirmPasswordReset(token, password, password)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const requestEmailChange = async (newEmail: string) => {
    try {
      await pb.collection('users').requestEmailChange(newEmail.trim())
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const confirmEmailChange = async (token: string, password: string) => {
    try {
      await pb.collection('users').confirmEmailChange(token, password)
      pb.authStore.clear()
      setUser(null)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const isSuperadmin = user?.role === 'superadmin'
  const isAdmin = user?.role === 'admin'
  const isLeitura = user?.role === 'leitura'
  // Superadmin controls everything, admin can read/write/edit, leitura can only view
  const canEdit = isSuperadmin || isAdmin
  const canDelete = isSuperadmin

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user && pb.authStore.isValid,
        isSuperadmin,
        isAdmin,
        isLeitura,
        canEdit,
        canDelete,
        signIn,
        signOut,
        requestPasswordReset,
        confirmPasswordReset,
        requestEmailChange,
        confirmEmailChange,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
