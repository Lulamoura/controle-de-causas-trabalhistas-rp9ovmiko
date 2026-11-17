import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { usersService } from '@/services/users'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  LogOut,
  User as UserIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'

export default function MinhaConta() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'superadmin':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-800 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full">
            <ShieldAlert className="w-3 h-3" /> Superadmin
          </span>
        )
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-800 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full">
            <ShieldCheck className="w-3 h-3" /> Admin
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
            <Eye className="w-3 h-3" /> Leitura
          </span>
        )
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (newPassword.length < 8) {
      setErrorMsg('A nova senha deve conter no mínimo 8 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('A confirmação da nova senha não confere.')
      return
    }
    if (newPassword === currentPassword) {
      setErrorMsg('A nova senha deve ser diferente da senha atual.')
      return
    }

    try {
      setSaving(true)
      await usersService.changeOwnPassword(currentPassword, newPassword)

      toast({
        title: 'Senha alterada com sucesso!',
        description: 'Sua nova senha já está ativa. Use-a no próximo login.',
      })

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      console.error('Erro ao alterar a própria senha:', err)
      // Senha atual incorreta (validação do PocketBase no campo oldPassword)
      const msg = getErrorMessage(err) || 'Não foi possível alterar sua senha.'
      setErrorMsg(
        /oldPassword|senha atual|invalid/i.test(msg)
          ? 'A senha atual informada está incorreta.'
          : `Não foi possível alterar sua senha. ${msg}`,
      )
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Cabeçalho */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <UserIcon className="h-6 w-6 text-blue-900" />
          Minha Conta
        </h1>
        <p className="text-sm text-slate-600">
          Consulte seus dados de acesso e altere a sua senha de login.
        </p>
      </div>

      {/* Dados do usuário */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-base font-bold text-slate-900">Meus Dados</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Informações da sua conta de acesso ao sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 w-20">Nome:</span>
            <span className="font-medium text-slate-900">{user.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 w-20 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> E-mail:
            </span>
            <span className="font-mono text-xs text-slate-700">{user.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 w-20">Perfil:</span>
            {getRoleBadge()}
          </div>
        </CardContent>
      </Card>

      {/* Alteração de senha */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-blue-900" />
            Alterar Minha Senha
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Para sua segurança, informe a senha atual e defina a nova senha (mínimo 8 caracteres).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <form onSubmit={handleChangePassword} className="space-y-4">
            {errorMsg && (
              <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{errorMsg}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha Atual *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha *</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  className="pl-9"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha *</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repita a nova senha"
                  className="pl-9"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCurrentPassword('')
                  setNewPassword('')
                  setConfirmPassword('')
                  setErrorMsg('')
                }}
                disabled={saving}
              >
                Limpar
              </Button>
              <Button
                type="submit"
                className="bg-blue-900 hover:bg-blue-800 text-white gap-1.5"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                  </>
                ) : (
                  'Salvar Nova Senha'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="text-slate-500 hover:text-red-700 gap-1.5"
        >
          <LogOut className="h-4 w-4" /> Sair do sistema
        </Button>
      </div>
    </div>
  )
}
