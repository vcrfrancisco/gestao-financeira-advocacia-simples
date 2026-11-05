import { notFound } from 'next/navigation';
import { AcoesPrazo } from '@/acoes/AcoesPrazo';
import { BotaoConfirmar } from '@/components/BotaoConfirmar';
import { FormPrazo } from '@/components/FormPrazo';
import { Cabecalho, opcoesProcessos, type ParamsId } from '@/components/ui';
import { carregar } from '@/lib/db';

export const metadata = { title: 'Editar prazo' };

export default async function EditarPrazo({ params }: ParamsId) {
  const { id } = await params;
  const d = await carregar();
  const prazo = d.prazos.find((p) => p.id === id);
  if (!prazo) notFound();
  return (
    <>
      <Cabecalho titulo="Editar prazo" sub={prazo.situacao()} />
      <FormPrazo acao={AcoesPrazo.salvar} inicial={prazo.paraLinha()} processos={opcoesProcessos(d, prazo.processo_id)} calendario={await d.calendario()} cancelar="/prazos" />
      <BotaoConfirmar acao={AcoesPrazo.excluir} id={id} rotulo="Excluir prazo" />
    </>
  );
}
