import { notFound } from 'next/navigation';
import { AcoesFinanceiro } from '@/acoes/AcoesFinanceiro';
import { BotaoConfirmar } from '@/components/BotaoConfirmar';
import { Cabecalho, opcoesClientes, opcoesProcessos, type ParamsId } from '@/components/ui';
import { carregar } from '@/lib/db';
import { FormLancamento } from '../FormLancamento';

export const metadata = { title: 'Editar lançamento' };

export default async function EditarLancamento({ params }: ParamsId) {
  const { id } = await params;
  const d = await carregar();
  const lancamento = d.financeiro.find((l) => l.id === id);
  if (!lancamento) notFound();
  return (
    <>
      <Cabecalho titulo="Editar lançamento" sub={`${lancamento.rotulo}, ${lancamento.valorFormatado}`} />
      <FormLancamento lancamento={lancamento} clientes={opcoesClientes(d)} processos={opcoesProcessos(d, lancamento.processo_id)} />
      <BotaoConfirmar acao={AcoesFinanceiro.excluir} id={id} rotulo="Excluir lançamento" />
    </>
  );
}
