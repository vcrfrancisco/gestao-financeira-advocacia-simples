import { notFound } from 'next/navigation';
import { AcoesDocumento } from '@/acoes/AcoesDocumento';
import { BotaoConfirmar } from '@/components/BotaoConfirmar';
import { EditorModelo } from '@/components/EditorModelo';
import { Cabecalho, type ParamsId } from '@/components/ui';
import { carregar } from '@/lib/db';

export const metadata = { title: 'Editar modelo' };

export default async function EditarModelo({ params }: ParamsId) {
  const { id } = await params;
  const m = (await carregar()).modelos.find((x) => x.id === id);
  if (!m) notFound();
  // Os modelos do sistema não são alterados: a edição salva uma cópia sua.
  return (
    <>
      <Cabecalho titulo={m.padrao ? 'Copiar modelo' : 'Editar modelo'} sub={m.padrao ? 'Ao salvar, sua versão aparece junto dos modelos do sistema.' : undefined} />
      <EditorModelo acao={AcoesDocumento.salvarModelo} id={m.padrao ? '' : m.id} nome={m.padrao ? `${m.nome} (minha versão)` : m.nome} conteudo={m.conteudo} cancelar="/documentos" />
      {!m.padrao && <BotaoConfirmar acao={AcoesDocumento.excluirModelo} id={m.id} rotulo="Excluir modelo" />}
    </>
  );
}
