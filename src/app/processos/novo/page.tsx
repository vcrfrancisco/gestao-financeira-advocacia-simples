import { Cabecalho, opcoesClientes, param, type ParamsBusca } from '@/components/ui';
import { carregar } from '@/lib/db';
import { linhaVazia } from '@/lib/tabelas';
import { Processo } from '@/dominio/Processo';
import { FormProcesso } from '../FormProcesso';

export const metadata = { title: 'Novo processo' };

export default async function NovoProcesso({ searchParams }: ParamsBusca) {
  const clienteId = param(await searchParams, 'cliente');
  const d = await carregar();
  const processo = new Processo(linhaVazia('processos', { status: 'ativo', fase: 'Conhecimento', cliente_id: clienteId }));
  return (
    <>
      <Cabecalho titulo="Novo processo" />
      <FormProcesso processo={processo} clientes={opcoesClientes(d)} cancelar={clienteId ? `/clientes/${clienteId}` : '/processos'} />
    </>
  );
}
