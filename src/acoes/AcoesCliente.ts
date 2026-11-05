import { excluir, modificar, salvar } from '@/lib/db';
import { formatarCpfCnpj, formatarTelefone } from '@/lib/formato';
import { Cliente } from '@/dominio/Cliente';
import { Documento } from '@/dominio/Documento';
import { LancamentoFinanceiro } from '@/dominio/LancamentoFinanceiro';
import { Processo } from '@/dominio/Processo';
import { Acoes, type Resultado } from './Acoes';

export class AcoesCliente extends Acoes {
  static async salvar(fd: FormData): Promise<Resultado> {
    'use server';
    if (!AcoesCliente.campo(fd, 'nome')) return { erro: 'O nome é obrigatório.' };
    const c = await salvar(Cliente, {
      ...AcoesCliente.colunas(fd, Cliente, 'id', 'nome', 'rg', 'nacionalidade', 'estado_civil', 'profissao', 'email', 'endereco', 'observacoes'),
      tipo: AcoesCliente.campo(fd, 'tipo') === 'PJ' ? 'PJ' : 'PF',
      cpf_cnpj: formatarCpfCnpj(AcoesCliente.campo(fd, 'cpf_cnpj')),
      telefone: formatarTelefone(AcoesCliente.campo(fd, 'telefone')),
    });
    AcoesCliente.concluir(`/clientes/${c.id}`, 'Cliente salvo.');
  }

  static async excluir(fd: FormData) {
    'use server';
    const id = AcoesCliente.campo(fd, 'id');
    const desvincular = <L extends { cliente_id: string }>(ls: L[]) => ls.map((x) => (x.cliente_id === id ? Object.assign(x, { cliente_id: '' }) : x));
    await modificar(Processo, desvincular);
    await modificar(LancamentoFinanceiro, desvincular);
    await modificar(Documento, desvincular);
    await excluir(Cliente, id);
    AcoesCliente.concluir('/clientes', 'Cliente excluído. Os processos foram mantidos.');
  }
}
