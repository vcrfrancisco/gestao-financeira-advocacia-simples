import { Cabecalho } from '@/components/ui';
import { linhaVazia } from '@/lib/tabelas';
import { Cliente } from '@/dominio/Cliente';
import { FormCliente } from '../FormCliente';

export const metadata = { title: 'Novo cliente' };

export default function NovoCliente() {
  return (
    <>
      <Cabecalho titulo="Novo cliente" />
      <FormCliente cliente={new Cliente(linhaVazia('clientes', { tipo: 'PF', nacionalidade: 'brasileiro(a)' }))} cancelar="/clientes" />
    </>
  );
}
