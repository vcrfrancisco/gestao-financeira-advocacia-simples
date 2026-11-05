import { Cabecalho, opcoesClientes, opcoesProcessos, param, type ParamsBusca } from '@/components/ui';
import { carregar } from '@/lib/db';
import { linhaVazia } from '@/lib/tabelas';
import { Data } from '@/dominio/Data';
import { LancamentoFinanceiro } from '@/dominio/LancamentoFinanceiro';
import { FormLancamento } from '../FormLancamento';

export const metadata = { title: 'Novo lançamento' };

export default async function NovoLancamento({ searchParams }: ParamsBusca) {
  const sp = await searchParams;
  const tipo = param(sp, 'tipo') === 'despesa' ? 'despesa' : 'receita';
  const d = await carregar();
  const lancamento = new LancamentoFinanceiro(linhaVazia('financeiro', {
    tipo, vencimento: Data.hoje().iso, categoria: LancamentoFinanceiro.CATEGORIAS[tipo][0],
    cliente_id: param(sp, 'cliente'), processo_id: param(sp, 'processo'),
  }));
  return (
    <>
      <Cabecalho titulo={tipo === 'despesa' ? 'Nova despesa' : 'Nova receita'} />
      <FormLancamento lancamento={lancamento} clientes={opcoesClientes(d)} processos={opcoesProcessos(d, lancamento.processo_id)} />
    </>
  );
}
