import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { clientesService, funcoesService, tiposAudienciaService } from '@/services/cadastros'
import { Cliente, FuncaoReclamante, TipoAudiencia } from '@/types'
import {
  Building,
  HardHat,
  Gavel,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Save,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'

type Aba = 'clientes' | 'funcoes' | 'tipos'
type Item = Cliente | FuncaoReclamante | TipoAudiencia

const MENSAGEM_EM_USO =
  'Este registro está em uso por uma ou mais causas ou audiências e não pode ser excluído. Desative-o para que não apareça em novos cadastros.'

const SINGULAR: Record<Aba, string> = {
  clientes: 'Cliente',
  funcoes: 'Função',
  tipos: 'Tipo de Audiência',
}

export default function Cadastros() {
  const { isLeitura } = useAuth()
  // Nesta tela, admin e superadmin cadastram, editam e excluem; leitura só vê.
  const canEdit = !isLeitura
  const canDelete = !isLeitura
  const navigate = useNavigate()
  const { toast } = useToast()

  const [aba, setAba] = useState<Aba>('clientes')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [funcoes, setFuncoes] = useState<FuncaoReclamante[]>([])
  const [tipos, setTipos] = useState<TipoAudiencia[]>([])
  const [loading, setLoading] = useState(true)

  // Formulário (criar/editar)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Item | null>(null)
  const [nome, setNome] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [salvando, setSalvando] = useState(false)

  // Exclusão
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const serviceAtual = () =>
    aba === 'clientes'
      ? clientesService
      : aba === 'funcoes'
        ? funcoesService
        : tiposAudienciaService

  const carregar = async () => {
    try {
      setLoading(true)
      const [cls, fns, tps] = await Promise.all([
        clientesService.getAll(),
        funcoesService.getAll(),
        tiposAudienciaService.getAll(),
      ])
      setClientes(cls as Cliente[])
      setFuncoes(fns as FuncaoReclamante[])
      setTipos(tps as TipoAudiencia[])
    } catch (error) {
      console.error('Erro ao carregar cadastros:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar os cadastros.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const listaAtual: Item[] = aba === 'clientes' ? clientes : aba === 'funcoes' ? funcoes : tipos

  const abrirNovo = () => {
    setEditando(null)
    setNome('')
    setAtivo(true)
    setDialogOpen(true)
  }

  const abrirEditar = (item: Item) => {
    setEditando(item)
    setNome(item.nome)
    setAtivo(item.ativo)
    setDialogOpen(true)
  }

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return
    try {
      setSalvando(true)
      const service = serviceAtual()
      if (editando) {
        await service.update(editando.id, { nome: nome.trim(), ativo })
        toast({ title: 'Cadastro atualizado com sucesso.' })
      } else {
        await service.create(nome.trim(), ativo)
        toast({ title: 'Cadastro criado com sucesso.' })
      }
      setDialogOpen(false)
      carregar()
    } catch (error) {
      console.error('Erro ao salvar cadastro:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Verifique o nome informado (ele deve ser único no cadastro).',
      })
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async () => {
    if (!deleteTarget) return
    try {
      setExcluindo(true)
      await serviceAtual().delete(deleteTarget.id)
      toast({ title: 'Registro excluído com sucesso.' })
      setDeleteTarget(null)
      carregar()
    } catch (error) {
      console.error('Erro ao excluir cadastro:', error)
      toast({
        variant: 'destructive',
        title: 'Não foi possível excluir',
        description: MENSAGEM_EM_USO,
      })
    } finally {
      setExcluindo(false)
    }
  }

  const abaClass = (ativa: boolean) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
      ativa
        ? 'border-blue-900 text-blue-900'
        : 'border-transparent text-slate-500 hover:text-slate-800'
    }`

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cadastros</h1>
          <p className="text-sm text-slate-600">
            Gerencie os clientes, as funções de mão de obra e os tipos de audiência usados nos
            cadastros.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={carregar}
            disabled={loading}
            className="border-slate-300"
            title="Recarregar"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          {canEdit && (
            <Button
              onClick={abrirNovo}
              className="bg-blue-900 hover:bg-blue-800 text-white gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Novo {SINGULAR[aba]}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-slate-600 hover:text-slate-900 gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </div>
      </div>

      {/* Abas Clientes / Funções / Tipos de Audiência */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setAba('clientes')}
          className={abaClass(aba === 'clientes')}
        >
          <Building className="h-4 w-4" /> Clientes ({clientes.length})
        </button>
        <button
          type="button"
          onClick={() => setAba('funcoes')}
          className={abaClass(aba === 'funcoes')}
        >
          <HardHat className="h-4 w-4" /> Funções do Reclamante ({funcoes.length})
        </button>
        <button type="button" onClick={() => setAba('tipos')} className={abaClass(aba === 'tipos')}>
          <Gavel className="h-4 w-4" /> Tipos de Audiência ({tipos.length})
        </button>
      </div>

      {/* Lista */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              {aba === 'clientes'
                ? 'Clientes Cadastrados'
                : aba === 'funcoes'
                  ? 'Funções Cadastradas'
                  : 'Tipos de Audiência Cadastrados'}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {aba === 'clientes'
                ? 'Aparecem no combo "Cliente" do cadastro de causas.'
                : aba === 'funcoes'
                  ? 'Aparecem no combo "Função do Reclamante" do cadastro de causas.'
                  : 'Aparecem no combo "Tipo de Audiência" do cadastro de audiências.'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-400" />
              Carregando cadastros...
            </div>
          ) : listaAtual.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              {aba === 'clientes' ? (
                <Building className="h-10 w-10 text-slate-300 mx-auto" />
              ) : aba === 'funcoes' ? (
                <HardHat className="h-10 w-10 text-slate-300 mx-auto" />
              ) : (
                <Gavel className="h-10 w-10 text-slate-300 mx-auto" />
              )}
              <p className="text-base font-semibold text-slate-800">
                {aba === 'clientes'
                  ? 'Nenhum cliente cadastrado ainda.'
                  : aba === 'funcoes'
                    ? 'Nenhuma função cadastrada ainda.'
                    : 'Nenhum tipo de audiência cadastrado ainda.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Nome</th>
                    <th className="py-3 px-4 font-semibold">Situação</th>
                    <th className="py-3 px-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {listaAtual.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900">{item.nome}</td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            item.ativo
                              ? 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-100 border-slate-200'
                          }
                        >
                          {item.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => abrirEditar(item)}
                              className="h-8 text-blue-900 hover:text-blue-700 hover:bg-blue-50"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              <span className="text-xs">Editar</span>
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(item)}
                              className="h-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {canEdit || canDelete ? null : (
        <Alert className="max-w-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Seu perfil pode apenas visualizar os cadastros. Admin e superadmin cadastram, editam e
            excluem.
          </AlertDescription>
        </Alert>
      )}

      {/* Dialog criar/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editando ? `Editar ${SINGULAR[aba]}` : `Novo ${SINGULAR[aba]}`}
            </DialogTitle>
            <DialogDescription>
              {aba === 'clientes'
                ? 'Nome do cliente usado no cadastro de causas.'
                : aba === 'funcoes'
                  ? 'Função do reclamante (mão de obra terceirizada) usada no cadastro de causas.'
                  : 'Tipo de audiência selecionado no cadastro de audiências.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={salvar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome-cadastro">Nome *</Label>
              <Input
                id="nome-cadastro"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder={
                  aba === 'clientes'
                    ? 'Ex: Construtora Alfa'
                    : aba === 'funcoes'
                      ? 'Ex: Pedreiro'
                      : 'Ex: Instrução e Julgamento'
                }
                required
                minLength={2}
                maxLength={200}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-slate-200 p-3">
              <div>
                <p className="text-sm font-medium text-slate-900">Ativo</p>
                <p className="text-xs text-slate-500">
                  Inativos deixam de aparecer nos combos de nova causa.
                </p>
              </div>
              <Switch checked={ativo} onCheckedChange={setAtivo} />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={salvando}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-blue-900 hover:bg-blue-800 text-white gap-1.5"
                disabled={salvando}
              >
                {salvando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Salvar
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {SINGULAR[aba]}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá permanentemente <strong>{deleteTarget?.nome}</strong>. Se ele
              estiver em uso por alguma causa ou audiência, a exclusão será bloqueada — nesse caso,
              prefira desativar o registro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={excluir}
              disabled={excluindo}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {excluindo ? 'Excluindo...' : 'Sim, Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
