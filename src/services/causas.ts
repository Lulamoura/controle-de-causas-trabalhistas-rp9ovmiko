import pb from '@/lib/pocketbase/client'
import { Causa } from '@/types'

export const causasService = {
  async getAll(): Promise<Causa[]> {
    const records = await pb.collection('causas').getFullList<Causa>({
      sort: '-created',
      expand: 'cliente',
    })
    return records
  },

  async getById(id: string): Promise<Causa> {
    return await pb.collection('causas').getOne<Causa>(id, {
      expand: 'cliente,funcao_reclamante',
    })
  },

  async create(data: Omit<Causa, 'id' | 'created' | 'updated'>): Promise<Causa> {
    return await pb.collection('causas').create<Causa>(data)
  },

  async update(
    id: string,
    data: Partial<Omit<Causa, 'id' | 'created' | 'updated'>>,
  ): Promise<Causa> {
    return await pb.collection('causas').update<Causa>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('causas').delete(id)
  },
}
