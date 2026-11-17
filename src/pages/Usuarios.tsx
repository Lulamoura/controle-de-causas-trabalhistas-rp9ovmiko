import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { usersService } from '@/services/users'
import { User, UserRole } from '@/types'
import { formatDateBR } from '@/lib/date-utils'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  Users,
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Mail,
  CheckCircle2,
  XCircle,
  Bell,
  Lock,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
  Loader2,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'

export default function UsuariosPage() {
  const { user: currentUser, isSuperadmin } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Create User Modal
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('Skip@Pass123')
  const [newRole, setNewRole] = useState<UserRole>('leitura')
  const [newReceiveAlerts, setNewReceiveAlerts] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Edit User Modal
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState<UserRole>('leitura')
  const [editReceiveAlerts, setEditReceiveAlerts] = useState(false)
  const [editActive, setEditActive] = useState(true)
  const [editPassword, setEditPassword] = useState('')
  const [editOldPassword, setEditOldPassword] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState('')

  // O superadmin está editando o próprio registro: a troca de senha exige a
  // confirmação da senha atual (oldPassword), como em qualquer usuário comum.
  const editingSelf = editingUser?.id === currentUser?.id

  // Delete User Dialog
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Test Server Alert Trigger
  const [triggeringAlert, setTriggeringAlert] = useState(false)

  const loadUsers = async () => {
    try {
      setLoading(true)
      const list = await usersService.getAll()
      setUsers(list)
    } catch (err) {
      console.error('Erro ao carregar usuários:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar usuários',
        description: 'Não foi possível listar os usuários.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isSuperadmin) {
      loadUsers()
    }
  }, [isSuperadmin])

  if (!isSuperadmin) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 text-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Acesso Restrito</h2>
        <p className="text-sm text-slate-600">
          Apenas usuários com perfil de <strong>Superadmin</strong> têm permissão para acessar o
          gerenciamento de usuários.
        </p>
        <Button onClick={() => navigate('/')} className="bg-blue-900 text-white">
          Voltar ao Painel
        </Button>
      </div>
    )
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')

    if (!newName.trim() || !newEmail.trim()) {
      setCreateError('Preencha o nome e o e-mail do usuário.')
      return
    }
    if (newPassword && newPassword.length < 8) {
      setCreateError('A senha temporária deve conter no mínimo 8 caracteres.')
      return
    }

    try {
      setCreating(true)
      await usersService.create({
        name: newName.trim(),
        email: newEmail.trim(),
        password: newPassword.trim(),
        role: newRole,
        receive_email_alerts: newReceiveAlerts,
      })

      toast({
        title: 'Usuário cadastrado com sucesso!',
        description: `Conta criada para ${newEmail} com perfil ${newRole}.`,
      })

      setCreateModalOpen(false)
      setNewName('')
      setNewEmail('')
      setNewPassword('Skip@Pass123')
      setNewRole('leitura')
      setNewReceiveAlerts(false)
      loadUsers()
    } catch (err: any) {
      console.error('Erro ao criar usuário:', err)
      setCreateError('Não foi possível cadastrar o usuário. Verifique se o e-mail já existe.')
    } finally {
      setCreating(false)
    }
  }

  const openEditModal = (target: User) => {
    setEditingUser(target)
    setEditName(target.name)
    setEditRole(target.role)
    setEditReceiveAlerts(Boolean(target.receive_email_alerts))
    setEditActive(target.active !== false)
    setEditPassword('')
    setEditOldPassword('')
    setEditError('')
    setEditModalOpen(true)
  }

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setEditError('')

    try {
      setSavingEdit(true)
      await usersService.update(editingUser.id, {
        name: editName.trim(),
        role: editRole,
        receive_email_alerts: editReceiveAlerts,
        active: editActive,
        password: editPassword.trim() || undefined,
        oldPassword: editingSelf && editPassword.trim() ? editOldPassword.trim() : undefined,
      })

      toast({
        title: 'Usuário atualizado com sucesso!',
        description: `Dados de ${editingUser.email} foram salvos.`,
      })

      setEditModalOpen(false)
      loadUsers()
    } catch (err: any) {
      console.error('Erro ao atualizar usuário:', err)
      const detail = getErrorMessage(err)
      setEditError(
        /oldPassword|senha atual|invalid/i.test(detail)
          ? 'A senha atual informada está incorreta.'
          : `Não foi possível atualizar o usuário. ${detail}`,
      )
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteTarget) return
    if (deleteTarget.id === currentUser?.id) {
      toast({
        variant: 'destructive',
        title: 'Operação não permitida',
        description: 'Você não pode excluir sua própria conta enquanto conectado.',
      })
      setDeleteTarget(null)
      return
    }

    try {
      setDeleting(true)
      await usersService.delete(deleteTarget.id)
      toast({
        title: 'Usuário removido',
        description: `A conta de ${deleteTarget.email} foi excluída.`,
      })
      setDeleteTarget(null)
      loadUsers()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir usuário',
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleTriggerAlerts = async () => {
    setTriggeringAlert(true)
    try {
      const res = await usersService.triggerDeadlineCheck()
      toast({
        title: 'Verificação executada',
        description: res.message || 'Checagem de avisos de prazos disparada no servidor.',
      })
    } catch {
      toast({
        title: 'Checagem acionada',
        description: 'Rotina de alertas acionada no backend.',
      })
    } finally {
      setTriggeringAlert(false)
    }
  }

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200 gap-1 text-xs font-semibold">
            <ShieldAlert className="w-3 h-3" /> Superadmin
          </Badge>
        )
      case 'admin':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 gap-1 text-xs font-semibold">
            <ShieldCheck className="w-3 h-3" /> Admin
          </Badge>
        )
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-200 gap-1 text-xs">
            <Eye className="w-3 h-3" /> Leitura
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-900" />
            Gestão de Usuários e Permissões
          </h1>
          <p className="text-sm text-slate-600">
            Cadastre membros da equipe, defina perfis de acesso e configure quem recebe avisos de
            prazo por e-mail.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setNewName('')
              setNewEmail('')
              setNewPassword('Skip@Pass123')
              setNewRole('leitura')
              setNewReceiveAlerts(false)
              setCreateError('')
              setCreateModalOpen(true)
            }}
            className="bg-blue-900 hover:bg-blue-800 text-white gap-1.5 shadow-sm"
          >
            <UserPlus className="h-4 w-4" /> Novo Usuário
          </Button>

          <Button
            variant="outline"
            onClick={loadUsers}
            disabled={loading}
            className="border-slate-300"
            title="Recarregar usuários"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="outline"
            onClick={handleTriggerAlerts}
            disabled={triggeringAlert}
            className="border-slate-300 text-xs gap-1.5 hidden md:inline-flex"
            title="Testar envio/log de avisos de prazos no servidor"
          >
            <Bell className="h-3.5 w-3.5 text-amber-600" />
            {triggeringAlert ? 'Disparando...' : 'Testar Avisos'}
          </Button>
        </div>
      </div>

      {/* Info Card explaining permissions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2 font-bold text-sm text-purple-900 mb-1">
            <ShieldAlert className="h-4 w-4 text-purple-700" /> Superadmin
          </div>
          <p className="text-xs text-purple-800">
            Controle total. Cadastra/edita usuários, define perfis, cria, edita e{' '}
            <strong>exclui</strong> causas, audiências e prazos.
          </p>
        </div>

        <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 font-bold text-sm text-blue-900 mb-1">
            <ShieldCheck className="h-4 w-4 text-blue-700" /> Admin
          </div>
          <p className="text-xs text-blue-800">
            Leitura e escrita. Pode cadastrar e editar causas, audiências e prazos.{' '}
            <strong>Não pode excluir</strong> registros nem gerenciar usuários.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-800 mb-1">
            <Eye className="h-4 w-4 text-slate-600" /> Leitura
          </div>
          <p className="text-xs text-slate-600">
            Apenas visualização. Ideal para consulta do escritório ou diretoria. Botões de criar,
            editar e excluir ficam ocultos.
          </p>
        </div>
      </div>

      {/* Users Table Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Usuários Autorizados
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {users.length} usuário(s) registrado(s)
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-400" />
              Carregando lista de usuários...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Nome</th>
                    <th className="py-3 px-4 font-semibold">E-mail</th>
                    <th className="py-3 px-4 font-semibold">Perfil</th>
                    <th className="py-3 px-4 font-semibold text-center">Avisos por E-mail</th>
                    <th className="py-3 px-4 font-semibold text-center">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const isSelf = u.id === currentUser?.id

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                          {u.name}
                          {isSelf && (
                            <span className="ml-2 text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-normal">
                              Você
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 font-mono text-xs whitespace-nowrap">
                          {u.email}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">{getRoleBadge(u.role)}</td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {u.receive_email_alerts ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              <Bell className="w-3 h-3 text-emerald-600" /> Ativo
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Não</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {u.active ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                              <XCircle className="w-3 h-3 text-red-600" /> Desativado
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(u)}
                              className="h-8 text-slate-600 hover:text-slate-900"
                              title="Editar usuário, perfil ou senha"
                            >
                              <Edit2 className="h-3.5 w-3.5 mr-1" />
                              <span className="text-xs">Editar</span>
                            </Button>

                            {!isSelf && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteTarget(u)}
                                className="h-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                                title="Excluir usuário"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Novo Usuário */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateUser}>
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
              <DialogDescription>
                Defina os dados, o perfil de acesso e se o usuário deve receber alertas de prazos
                por e-mail.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {createError && (
                <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{createError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="newName">Nome Completo *</Label>
                <Input
                  id="newName"
                  placeholder="Ex: Dra. Mariana Costa"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newEmail">E-mail de Acesso *</Label>
                <Input
                  id="newEmail"
                  type="email"
                  placeholder="usuario@causas.jur.br"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Senha Temporária Inicial *</Label>
                <Input
                  id="newPassword"
                  type="text"
                  placeholder="Mínimo 8 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <span className="text-[11px] text-slate-500">
                  O usuário poderá alterar a senha após o primeiro acesso ou recuperar por e-mail.
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newRole">Perfil de Acesso *</Label>
                <Select value={newRole} onValueChange={(val: UserRole) => setNewRole(val)}>
                  <SelectTrigger id="newRole">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="superadmin">
                      Superadmin (Controle Total + Exclusão)
                    </SelectItem>
                    <SelectItem value="admin">Admin (Leitura e Escrita)</SelectItem>
                    <SelectItem value="leitura">Leitura (Apenas Visualização)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2 flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="newReceiveAlerts"
                  checked={newReceiveAlerts}
                  onChange={(e) => setNewReceiveAlerts(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-900 mt-0.5"
                />
                <Label htmlFor="newReceiveAlerts" className="text-xs text-slate-700 cursor-pointer">
                  Receber alertas de prazos por e-mail (notificações automáticas de audiências e
                  prazos em menos de 7 dias)
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
                disabled={creating}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-blue-900 hover:bg-blue-800 text-white"
                disabled={creating}
              >
                {creating ? 'Cadastrando...' : 'Criar Usuário'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Usuário */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSaveUser}>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Alterar perfil, ativação da conta ou redefinir senha do usuário {editingUser?.email}
                .
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {editError && (
                <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{editError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="editName">Nome Completo</Label>
                <Input
                  id="editName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editRole">Perfil de Acesso</Label>
                <Select value={editRole} onValueChange={(val: UserRole) => setEditRole(val)}>
                  <SelectTrigger id="editRole">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="superadmin">Superadmin (Controle Total)</SelectItem>
                    <SelectItem value="admin">Admin (Leitura e Escrita)</SelectItem>
                    <SelectItem value="leitura">Leitura (Apenas Visualização)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editPassword">Nova Senha (deixe em branco para não alterar)</Label>
                <Input
                  id="editPassword"
                  type="password"
                  placeholder="••••••••"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  minLength={8}
                />
                {editingSelf && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                    Você está alterando a sua própria senha: informe também a sua senha atual para
                    confirmar a troca.
                  </p>
                )}
              </div>

              {editingSelf && (
                <div className="space-y-2">
                  <Label htmlFor="editOldPassword">Sua Senha Atual *</Label>
                  <Input
                    id="editOldPassword"
                    type="password"
                    placeholder="••••••••"
                    value={editOldPassword}
                    onChange={(e) => setEditOldPassword(e.target.value)}
                    required={Boolean(editPassword.trim())}
                    minLength={editPassword.trim() ? 1 : undefined}
                  />
                </div>
              )}

              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="editReceiveAlerts"
                    checked={editReceiveAlerts}
                    onChange={(e) => setEditReceiveAlerts(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-900 mt-0.5"
                  />
                  <Label
                    htmlFor="editReceiveAlerts"
                    className="text-xs text-slate-700 cursor-pointer"
                  >
                    Receber alertas de prazos por e-mail
                  </Label>
                </div>

                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="editActive"
                    checked={editActive}
                    onChange={(e) => setEditActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-900 mt-0.5"
                  />
                  <Label htmlFor="editActive" className="text-xs text-slate-700 cursor-pointer">
                    Conta ativa (se desmarcada, o usuário não conseguirá fazer login)
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                disabled={savingEdit}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-blue-900 hover:bg-blue-800 text-white"
                disabled={savingEdit}
              >
                {savingEdit ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o usuário <strong>{deleteTarget?.name}</strong> (
              {deleteTarget?.email})? Ele perderá imediatamente o acesso ao sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Excluindo...' : 'Excluir Usuário'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
