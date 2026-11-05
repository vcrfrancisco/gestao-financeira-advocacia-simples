import { notFound } from 'next/navigation';
import { AcoesEvento } from '@/acoes/AcoesEvento';
import { BotaoConfirmar } from '@/components/BotaoConfirmar';
import { Cabecalho, opcoesProcessos, type ParamsId } from '@/components/ui';
import { carregar } from '@/lib/db';
import { FormEvento } from '../FormEvento';

export const metadata = { title: 'Editar compromisso' };

export default async function EditarEvento({ params }: ParamsId) {
  const { id } = await params;
  const d = await carregar();
  const evento = d.eventos.find((e) => e.id === id);
  if (!evento) notFound();
  return (
    <>
      <Cabecalho titulo="Editar compromisso" sub={`${evento.dia.formatada()} às ${evento.hora}`} />
      <FormEvento evento={evento} processos={opcoesProcessos(d, evento.processo_id)} />
      <BotaoConfirmar acao={AcoesEvento.excluir} id={id} rotulo="Excluir compromisso" />
    </>
  );
}
