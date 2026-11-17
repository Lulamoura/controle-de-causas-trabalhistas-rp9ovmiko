import { useEffect, useRef, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { anexosService } from '@/services/anexos'
import { Anexo, Causa } from '@/types'
import { formatDateBR } from '@/lib/date-utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { useToast } from '@/hooks/use-toast'
import {
  FileText,
  FileImage,
  FileSpreadsheet,
  Eye,
  Download,
  Trash2,
  Upload,
  Loader2,
  Paperclip,
  ExternalLink,
} from 'lucide-react'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

const MIME_PERMITIDOS = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

function iconeDoArquivo(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return <FileText className="h-8 w-8 text-red-600" />
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || ''))
    return <FileImage className="h-8 w-8 text-blue-700" />
  if (['docx', 'xlsx'].includes(ext || ''))
    return <FileSpreadsheet className="h-8 w-8 text-emerald-700" />
  return <Paperclip className="h-8 w-8 text-slate-500" />
}

function ehImagem(filename: string) {
  return ['jpg', 'jpeg', 'png', 'webp'].includes(filename.split('.').pop()?.toLowerCase() || '')
}

function ehPdf(filename: string) {
  return filename.split('.').pop()?.toLowerCase() === 'pdf'
}

interface DocumentosProcessoProps {
  causa: Causa
  canEdit: boolean
  canDelete: boolean
}

export function DocumentosProcesso({ causa, canEdit, canDelete }: DocumentosProcessoProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [anexos, setAnexos] = useState<Anexo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [arquivosSelecionados, setArquivosSelecionados] = useState<File[]>([])
  const [descricao, setDescricao] = useState('')

  const [visualizando, setVisualizando] = useState<{ anexo: Anexo; filename: string } | null>(null)
  const [excluindoTarget, setExcluindoTarget] = useState<Anexo | null>(null)
  const [deleting, setDeleting] = useState(false)

  const carregarAnexos = async () => {
    try {
      setLoading(true)
      const lista = await anexosService.getByCausa(causa.id)
      setAnexos(lista)
    } catch (error) {
      console.error('Erro ao carregar anexos:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar documentos',
        description: 'Não foi possível listar os documentos desta causa.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarAnexos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [causa.id])

  const abrirSelecao = () => {
    setArquivosSelecionados([])
    setDescricao('')
    fileInputRef.current?.click()
  }

  const aoEscolherArquivos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (files.length === 0) return

    const invalidos = files.filter(
      (f) =>
        !MIME_PERMITIDOS.includes(f.type) && !/\.(pdf|jpe?g|png|webp|docx|xlsx)$/i.test(f.name),
    )
    const grandes = files.filter((f) => f.size > MAX_FILE_SIZE)
    if (invalidos.length > 0 || grandes.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Arquivo não aceito',
        description:
          'São aceitos PDF, imagens (JPG/PNG/WebP), DOCX e XLSX, com até 10 MB por arquivo.' +
          (invalidos.length ? ` Rejeitado(s): ${invalidos.map((f) => f.name).join(', ')}` : '') +
          (grandes.length ? ` Grande(s): ${grandes.map((f) => f.name).join(', ')}` : ''),
      })
      return
    }
    setArquivosSelecionados(files)
  }

  const handleUpload = async () => {
    if (arquivosSelecionados.length === 0) return
    try {
      setUploading(true)
      await anexosService.create({
        causa_id: causa.id,
        arquivo: arquivosSelecionados,
        descricao: descricao.trim() || undefined,
        uploaded_by: pb.authStore.model?.id,
      })
      toast({
        title: 'Documento(s) anexado(s)!',
        description: `${arquivosSelecionados.length} arquivo(s) enviados para a causa ${causa.numero_processo}.`,
      })
      setArquivosSelecionados([])
      setDescricao('')
      carregarAnexos()
    } catch (error) {
      console.error('Erro ao anexar documento:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao anexar documento',
        description: 'Não foi possível enviar o(s) arquivo(s). Verifique o tipo e o tamanho.',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!excluindoTarget) return
    try {
      setDeleting(true)
      await anexosService.delete(excluindoTarget.id)
      toast({ title: 'Documento excluído com sucesso.' })
      setExcluindoTarget(null)
      carregarAnexos()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir documento',
        description: 'Apenas o superadministrador pode excluir documentos.',
      })
    } finally {
      setDeleting(false)
    }
  }

  const urlDoArquivo = (anexo: Anexo, filename: string, download = false) =>
    pb.files.getUrl(anexo, filename, download ? { download: true } : undefined)

  const abrirVisualizacao = (anexo: Anexo, filename: string) => {
    if (ehImagem(filename) || ehPdf(filename)) {
      setVisualizando({ anexo, filename })
    } else {
      window.open(urlDoArquivo(anexo, filename, true), '_blank')
    }
  }

  const baixar = (anexo: Anexo, filename: string) => {
    window.open(urlDoArquivo(anexo, filename, true), '_blank')
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
        <div>
          <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-purple-700" />
            Documentos do Processo ({anexos.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Petições, sentenças, provas e demais arquivos anexados a esta causa
          </CardDescription>
        </div>

        {canEdit && (
          <Button
            size="sm"
            onClick={abrirSelecao}
            className="bg-purple-700 hover:bg-purple-800 text-white gap-1 text-xs"
          >
            <Upload className="h-3.5 w-3.5" /> Anexar Documento
          </Button>
        )}
      </CardHeader>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx,application/pdf,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={aoEscolherArquivos}
      />

      <CardContent className="p-0">
        {arquivosSelecionados.length > 0 && (
          <div className="p-4 border-b border-slate-100 bg-purple-50/40 space-y-3">
            <div className="flex flex-wrap gap-2">
              {arquivosSelecionados.map((f) => (
                <span
                  key={f.name}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-white border border-purple-200 text-slate-800"
                >
                  {iconeDoArquivo(f.name)}
                  <span className="font-medium truncate max-w-[220px]">{f.name}</span>
                  <span className="text-slate-400">({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                </span>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-end">
              <div className="space-y-1.5">
                <Label htmlFor="anexoDescricao">Descrição (opcional)</Label>
                <Input
                  id="anexoDescricao"
                  placeholder="Ex: Petição inicial protocolada, sentença, contrato..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="bg-purple-700 hover:bg-purple-800 text-white gap-1.5"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Enviar
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setArquivosSelecionados([])}
                disabled={uploading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-400" />
            Carregando documentos...
          </div>
        ) : anexos.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Nenhum documento anexado a esta causa.
            {canEdit && (
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={abrirSelecao} className="text-xs">
                  Anexar Primeiro Documento
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {anexos.map((anexo) => {
              const filenames = anexo.arquivo || []
              return filenames.map((filename, idx) => (
                <div
                  key={`${anexo.id}-${filename}`}
                  className="p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors"
                >
                  {iconeDoArquivo(filename)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{filename}</p>
                    {(anexo.descricao || idx === 0) && (
                      <p className="text-xs text-slate-500">
                        {idx === 0 && anexo.descricao ? anexo.descricao : ''}
                        {idx === 0 && (
                          <span className="ml-2 text-slate-400">
                            Enviado em {formatDateBR(anexo.created)}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => abrirVisualizacao(anexo, filename)}
                      className="h-8 px-2 text-xs gap-1 text-slate-700 hover:text-slate-900"
                      title={
                        ehImagem(filename) || ehPdf(filename)
                          ? 'Visualizar no aplicativo'
                          : 'Abrir para download'
                      }
                    >
                      {ehImagem(filename) || ehPdf(filename) ? (
                        <>
                          <Eye className="h-3.5 w-3.5" /> Visualizar
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-3.5 w-3.5" /> Abrir
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => baixar(anexo, filename)}
                      className="h-8 px-2 text-xs gap-1 text-slate-700 hover:text-slate-900"
                      title="Baixar arquivo"
                    >
                      <Download className="h-3.5 w-3.5" /> Baixar
                    </Button>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExcluindoTarget(anexo)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                        title="Excluir documento (Superadmin)"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            })}
          </div>
        )}
      </CardContent>

      {/* Visualização: imagem ou PDF dentro do app */}
      <Dialog open={!!visualizando} onOpenChange={(open) => !open && setVisualizando(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-6">{visualizando?.filename}</DialogTitle>
            <DialogDescription>
              {visualizando && ehImagem(visualizando.filename)
                ? 'Pré-visualização da imagem anexada ao processo.'
                : 'Pré-visualização do documento PDF anexado ao processo.'}
            </DialogDescription>
          </DialogHeader>

          {visualizando && (
            <div className="max-h-[65vh] overflow-auto rounded-md border border-slate-200 bg-slate-50">
              {ehImagem(visualizando.filename) ? (
                <img
                  src={urlDoArquivo(visualizando.anexo, visualizando.filename)}
                  alt={visualizando.filename}
                  className="w-full h-auto"
                />
              ) : (
                <iframe
                  src={urlDoArquivo(visualizando.anexo, visualizando.filename)}
                  title={visualizando.filename}
                  className="w-full h-[65vh]"
                />
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => visualizando && baixar(visualizando.anexo, visualizando.filename)}
            >
              <Download className="h-4 w-4 mr-1.5" /> Baixar
            </Button>
            <Button onClick={() => setVisualizando(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog
        open={!!excluindoTarget}
        onOpenChange={(open) => !open && setExcluindoTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá todos os arquivos do registro selecionado. Esta operação não pode
              ser desfeita. Apenas o superadministrador pode excluir documentos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
