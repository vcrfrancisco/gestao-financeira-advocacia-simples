import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { Aviso } from '@/components/Aviso';
import { Menu } from '@/components/Menu';
import { carregar } from '@/lib/db';
import { Data } from '@/dominio/Data';
import './globals.css';

// Os dados vivem em arquivos CSV que mudam a qualquer momento: toda página é montada na hora.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: { default: 'Escritório', template: '%s · Escritório' }, description: 'Gestão do escritório de advocacia' };

export default async function Layout({ children }: { children: ReactNode }) {
  const d = await carregar();
  const hoje = Data.hoje();
  const contadores = {
    '/prazos': d.prazos.filter((p) => !p.cumprido && p.vence.iso <= hoje.iso).length,
    '/intimacoes': d.intimacoes.filter((i) => i.pendente).length,
  };
  return (
    <html lang="pt-BR">
      <body>
        <a className="pular" href="#conteudo">Pular para o conteúdo</a>
        <div className="estrutura">
          <header className="lateral">
            <Link className="marca" href="/">
              <strong>{d.config.adv_nome || 'Escritório'}</strong>
              <span>Gestão do escritório</span>
            </Link>
            <Menu contadores={contadores} />
          </header>
          <main className="conteudo" id="conteudo">{children}</main>
        </div>
        <Suspense><Aviso /></Suspense>
      </body>
    </html>
  );
}
