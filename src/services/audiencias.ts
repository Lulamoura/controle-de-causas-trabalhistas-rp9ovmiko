import pb from '@/lib/pocketbase/client'
import { Audiencia } from '@/types'

export const audienciasService = {
  async getAll(): Promise<Audiencia[]> {
    return await pb.collection('audiencias').getFullList<Audiencia>({
      sort: 'data',
      expand: 'causa_id',
    })
  },

  async getByCausa(causaId: string): Promise<Audiencia[]> {
    return await pb.collection('audiencias').getFullList<Audiencia>({
      filter: `causa_id = "${causaId}"`,
      sort: 'data',
      expand: 'causa_id',
    })
  },

  async create(data: Omit<Audiencia, 'id' | 'created' | 'updated'>): Promise<Audiencia> {
    return await pb.collection('audiencias').create<Audiencia>(data)
  },

  async update(
    id: string,
    data: Partial<Omit<Audiencia, 'id' | 'created' | 'updated'>>,
  ): Promise<Audiencia> {
    return await pb.collection('audiencias').update<Audiencia>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('audiencias').delete(id)
  },
}
