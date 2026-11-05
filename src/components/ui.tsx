import Link from 'next/link';
import type { ReactNode } from 'react';
import { AcoesFinanceiro } from '@/acoes/AcoesFinanceiro';
import { AcoesPrazo } from '@/acoes/AcoesPrazo';
import type { Dados } from '@/lib/db';
import { Data } from '@/dominio/Data';
import type { LancamentoFinanceiro } from '@/dominio/LancamentoFinanceiro';
import type { Prazo } from '@/dominio/Prazo';
import type { Processo } from '@/dominio/Processo';

export function Cabecalho({ titulo, sub, acoes }: { titulo: ReactNode; sub?: ReactNode; acoes?: ReactNode }) {
  return (
    <div className="cabecalho">
      <div>
        <h1>{titulo}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {acoes && <div className="acoes">{acoes}</div>}
    </div>
  );
}

export const Vazio = ({ children }: { children: ReactNode }) => <p className="vazio">{children}</p>;

/** Botão que dispara uma Server Action para um registro (marcar cumprido, receber...). */
export function BotaoAcao({ acao, id, children, classe = 'btn mini' }: { acao: (fd: FormData) => Promise<void>; id: string; children: ReactNode; classe?: string }) {
  return (
    <form action={acao} className="inline">
      <input type="hidden" name="id" value={id} />
      <button className={classe}>{children}</button>
    </form>
  );
}

/** Abas que filtram a lista pelo parâmetro ?f= do endereço. */
export function Abas({ base, atual, itens }: { base: string; atual: string; itens: [string, string][] }) {
  return (
    <nav className="abas" aria-label="Filtro">
      {itens.map(([v, nome]) => (
        <Link key={v} href={`${base}?f=${v}`} aria-current={atual === v ? 'page' : undefined}>{nome}</Link>
      ))}
    </nav>
  );
}

export function Busca({ valor, dica, extras }: { valor: string; dica: string; extras?: ReactNode }) {
  return (
    <form className="busca" role="search">
      {extras}
      <label className="oculto" htmlFor="q">Buscar</label>
      <input id="q" name="q" type="search" defaultValue={valor} placeholder={dica} />
      <button className="btn sec">Buscar</button>
    </form>
  );
}

/** Opções de processo para <select>, com o nome do cliente na frente; arquivados ficam de fora. */
export function opcoesProcessos(dados: Dados, atual = '') {
  return dados.processos
    .filter((p) => !p.arquivado || p.id === atual)
    .map((p) => ({ id: p.id, rotulo: `${dados.cliente(p.cliente_id) ? `${dados.cliente(p.cliente_id)!.nome}: ` : ''}${p.rotulo}` }))
    .sort((a, b) => a.rotulo.localeCompare(b.rotulo));
}

export const opcoesClientes = (dados: Dados) =>
  dados.clientes.map((c) => ({ id: c.id, rotulo: c.nome })).sort((a, b) => a.rotulo.localeCompare(b.rotulo));

export const Opcoes = ({ itens }: { itens: { id: string; rotulo: string }[] }) =>
  <>{itens.map((o) => <option key={o.id} value={o.id}>{o.rotulo}</option>)}</>;

export function ItemPrazo({ prazo, processo, nomeCliente, hoje }: { prazo: Prazo; processo?: Processo; nomeCliente?: string; hoje: Data }) {
  const u = prazo.urgencia(hoje);
  return (
    <li>
      <div className={`folhinha ${u}`} aria-hidden="true">
        <span className="mes">{prazo.vence.mesAbreviado()}</span>
        <span className="dia">{prazo.vence.dia}</span>
      </div>
      <div className="item-corpo">
        <Link className="titulo" href={`/prazos/${prazo.id}`}>{prazo.rotulo}</Link>
        <div className={`situacao ${u}`}>{prazo.situacao(hoje)}</div>
        <div className="meta">
          {processo && <><Link href={`/processos/${processo.id}`}>{processo.rotulo}</Link>{nomeCliente && `, ${nomeCliente}`}<br /></>}
          {prazo.explicacao()}
        </div>
      </div>
      <div className="item-acoes">
        {prazo.cumprido
          ? <BotaoAcao acao={AcoesPrazo.reabrir} id={prazo.id} classe="btn mini sec">Reabrir</BotaoAcao>
          : <BotaoAcao acao={AcoesPrazo.cumprir} id={prazo.id}>Marcar como cumprido</BotaoAcao>}
      </div>
    </li>
  );
}

export function Situacao({ lancamento, hoje }: { lancamento: LancamentoFinanceiro; hoje: Data }) {
  const s = lancamento.situacao(hoje);
  return <span className={`etiqueta ${s.classe}`}>{s.texto}</span>;
}

export function TabelaFinanceiro({ itens, hoje }: { itens: LancamentoFinanceiro[]; hoje: Data }) {
  return (
    <div className="tabela-rolagem">
      <table>
        <thead><tr><th>Descrição</th><th>Vencimento</th><th className="valor">Valor</th><th>Situação</th></tr></thead>
        <tbody>
          {itens.map((l) => (
            <tr key={l.id} className={l.pago ? 'pago' : ''}>
              <td><Link href={`/financeiro/${l.id}`}>{l.rotulo}</Link><br /><span className="pequeno discreto">{l.receita ? 'Receita' : 'Despesa'}</span></td>
              <td>{l.vence.formatada()}</td>
              <td className="valor">{l.valorFormatado}</td>
              <td>
                <Situacao lancamento={l} hoje={hoje} />
                {!l.pago && l.receita && <> <Link className="pequeno" href={`/financeiro/${l.id}/cobranca`}>Cobrar</Link></>}
                {!l.pago && <> <BotaoAcao acao={AcoesFinanceiro.pagar} id={l.id} classe="btn-texto pequeno">{l.receita ? 'Recebi' : 'Paguei'}</BotaoAcao></>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Lê um parâmetro de busca (?x=) como texto. */
export const param = (sp: Record<string, string | string[] | undefined>, k: string) => {
  const v = sp[k];
  return (Array.isArray(v) ? v[0] : v) ?? '';
};
export type ParamsBusca = { searchParams: Promise<Record<string, string | string[] | undefined>> };
export type ParamsId = { params: Promise<{ id: string }> };
