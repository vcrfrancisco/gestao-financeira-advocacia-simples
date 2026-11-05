import { notFound } from 'next/navigation';
import { Cabecalho, opcoesClientes, type ParamsId } from '@/components/ui';
import { carregar } from '@/lib/db';
import { FormProcesso } from '../../FormProcesso';

export const metadata = { title: 'Editar processo' };

export default async function EditarProcesso({ params }: ParamsId) {
  const { id } = await params;
  const d = await carregar();
  const processo = d.processo(id);
  if (!processo) notFound();
  return (
    <>
      <Cabecalho titulo="Editar processo" sub={processo.rotulo} />
      <FormProcesso processo={processo} clientes={opcoesClientes(d)} cancelar={`/processos/${id}`} />
    </>
  );
}
