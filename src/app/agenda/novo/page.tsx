import { Cabecalho, opcoesProcessos, param, type ParamsBusca } from '@/components/ui';
import { carregar } from '@/lib/db';
import { linhaVazia } from '@/lib/tabelas';
import { Data } from '@/dominio/Data';
import { Evento } from '@/dominio/Evento';
import { FormEvento } from '../FormEvento';

export const metadata = { title: 'Novo compromisso' };

export default async function NovoEvento({ searchParams }: ParamsBusca) {
  const processoId = param(await searchParams, 'processo');
  const d = await carregar();
  const evento = new Evento(linhaVazia('eventos', { tipo: 'audiencia', inicio: `${Data.hoje().iso}T09:00`, processo_id: processoId }));
  return (
    <>
      <Cabecalho titulo="Novo compromisso" />
      <FormEvento evento={evento} processos={opcoesProcessos(d, processoId)} />
    </>
  );
}
