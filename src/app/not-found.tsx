import Link from 'next/link';
import { Cabecalho } from '@/components/ui';

export default function NaoEncontrado() {
  return (
    <>
      <Cabecalho titulo="Página não encontrada" />
      <section className="papel">
        <p>O registro não existe ou foi excluído.</p>
        <Link className="btn sec" href="/">Ir para o painel</Link>
      </section>
    </>
  );
}
