import { AcoesDocumento } from '@/acoes/AcoesDocumento';
import { EditorModelo } from '@/components/EditorModelo';
import { Cabecalho } from '@/components/ui';

export const metadata = { title: 'Novo modelo' };

export default function NovoModelo() {
  return (
    <>
      <Cabecalho titulo="Novo modelo" />
      <EditorModelo acao={AcoesDocumento.salvarModelo} id="" nome="" conteudo="" cancelar="/documentos" />
    </>
  );
}
