import { notFound } from 'next/navigation';
import { Cabecalho, type ParamsId } from '@/components/ui';
import { buscar } from '@/lib/db';
import { Cliente } from '@/dominio/Cliente';
import { FormCliente } from '../../FormCliente';

export const metadata = { title: 'Editar cliente' };

export default async function EditarCliente({ params }: ParamsId) {
  const { id } = await params;
  const cliente = await buscar(Cliente, id);
  if (!cliente) notFound();
  return (
    <>
      <Cabecalho titulo="Editar cliente" sub={cliente.nome} />
      <FormCliente cliente={cliente} cancelar={`/clientes/${id}`} />
    </>
  );
}
