import pb from '@/lib/pocketbase/client'
import { Anexo } from '@/types'

export type NovoAnexo = {
  causa_id: string
  arquivo: File[] | string[]
  descricao?: string
  uploaded_by?: string
}

export const anexosService = {
  async getByCausa(causaId: string): Promise<Anexo[]> {
    const records = await pb.collection('anexos').getFullList<Anexo>({
      filter: pb.filter('causa_id = {:causaId}', { causaId }),
      sort: '-created',
    })
    return records
  },

  async create(data: NovoAnexo): Promise<Anexo> {
    const formData = new FormData()
    formData.append('causa_id', data.causa_id)
    if (data.descricao?.trim()) formData.append('descricao', data.descricao.trim())
    if (data.uploaded_by) formData.append('uploaded_by', data.uploaded_by)
    for (const file of data.arquivo) {
      formData.append('arquivo', file)
    }
    return await pb.collection('anexos').create<Anexo>(formData)
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('anexos').delete(id)
  },
}
