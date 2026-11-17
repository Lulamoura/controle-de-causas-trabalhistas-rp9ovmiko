import pb from '@/lib/pocketbase/client'
import { Prazo } from '@/types'

export const prazosService = {
  async getAll(): Promise<Prazo[]> {
    return await pb.collection('prazos').getFullList<Prazo>({
      sort: 'data',
      expand: 'causa_id',
    })
  },

  async getByCausa(causaId: string): Promise<Prazo[]> {
    return await pb.collection('prazos').getFullList<Prazo>({
      filter: `causa_id = "${causaId}"`,
      sort: 'data',
      expand: 'causa_id',
    })
  },

  async create(data: Omit<Prazo, 'id' | 'created' | 'updated'>): Promise<Prazo> {
    return await pb.collection('prazos').create<Prazo>(data)
  },

  async update(
    id: string,
    data: Partial<Omit<Prazo, 'id' | 'created' | 'updated'>>,
  ): Promise<Prazo> {
    return await pb.collection('prazos').update<Prazo>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('prazos').delete(id)
  },
}
