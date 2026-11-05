'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITENS = [
  ['/', 'Painel'], ['/prazos', 'Prazos'], ['/intimacoes', 'Intimações'], ['/agenda', 'Agenda'], ['/processos', 'Processos'],
  ['/clientes', 'Clientes'], ['/financeiro', 'Financeiro'], ['/documentos', 'Documentos'], ['/ajustes', 'Ajustes'],
] as const;

export function Menu({ contadores }: { contadores: Record<string, number> }) {
  const atual = usePathname();
  return (
    <nav className="menu" aria-label="Seções">
      {ITENS.map(([href, nome]) => {
        const ativo = href === '/' ? atual === '/' : atual.startsWith(href);
        const qtd = contadores[href];
        return (
          <Link key={href} href={href} aria-current={ativo ? 'page' : undefined}>
            {nome}
            {qtd ? <span className="contador" aria-label={`${qtd} pendente(s)`}>{qtd}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
