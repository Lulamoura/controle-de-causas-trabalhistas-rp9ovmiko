import pb from '@/lib/pocketbase/client'
import { Cliente, FuncaoReclamante } from '@/types'

type Cadastro = Cliente | FuncaoReclamante

function makeService(collection: string) {
  return {
    async getAll(incluirInativos = true): Promise<Cadastro[]> {
      const filter = incluirInativos ? '' : 'ativo = true'
      const records = await pb.collection(collection).getFullList<Cadastro>({
        sort: 'nome',
        ...(filter ? { filter } : {}),
      })
      return records
    },

    async create(nome: string, ativo = true): Promise<Cadastro> {
      return await pb.collection(collection).create<Cadastro>({ nome: nome.trim(), ativo })
    },

    async update(id: string, data: { nome?: string; ativo?: boolean }): Promise<Cadastro> {
      return await pb.collection(collection).update<Cadastro>(id, data)
    },

    async delete(id: string): Promise<boolean> {
      return await pb.collection(collection).delete(id)
    },
  }
}

export const clientesService = makeService('clientes')
export const funcoesService = makeService('funcoes_reclamante')
