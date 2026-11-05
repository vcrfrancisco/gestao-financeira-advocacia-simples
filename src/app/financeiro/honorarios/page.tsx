import { AcoesFinanceiro } from '@/acoes/AcoesFinanceiro';
import { FormHonorarios } from '@/components/FormHonorarios';
import { Cabecalho, opcoesClientes, opcoesProcessos, param, type ParamsBusca } from '@/components/ui';
import { carregar } from '@/lib/db';
import { Data } from '@/dominio/Data';

export const metadata = { title: 'Contrato de honorários' };

export default async function Honorarios({ searchParams }: ParamsBusca) {
  const sp = await searchParams;
  const d = await carregar();
  const clienteId = param(sp, 'cliente');
  const processoId = param(sp, 'processo');
  return (
    <>
      <Cabecalho titulo="Novo contrato de honorários" sub="Lança a entrada e as parcelas de uma vez, com vencimento mensal." />
      <FormHonorarios
        acao={AcoesFinanceiro.lancarHonorarios} clientes={opcoesClientes(d)} processos={opcoesProcessos(d, processoId)}
        clienteId={clienteId} processoId={processoId} hoje={Data.hoje().iso}
        cancelar={processoId ? `/processos/${processoId}` : clienteId ? `/clientes/${clienteId}` : '/financeiro'}
      />
    </>
  );
}
