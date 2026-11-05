import Link from 'next/link';
import { Abas, Cabecalho, ItemPrazo, Vazio, param, type ParamsBusca } from '@/components/ui';
import { carregar } from '@/lib/db';
import { Data } from '@/dominio/Data';

export const metadata = { title: 'Prazos' };

export default async function Prazos({ searchParams }: ParamsBusca) {
  const f = param(await searchParams, 'f') || 'pendente';
  const d = await carregar();
  const hoje = Data.hoje();
  const lista = d.prazos
    .filter((p) => f === 'todos' || (f === 'cumprido' ? p.cumprido : !p.cumprido))
    .sort((a, b) => (f === 'pendente' ? a.data_fim.localeCompare(b.data_fim) : b.data_fim.localeCompare(a.data_fim)));
  return (
    <>
      <Cabecalho titulo="Prazos" sub="Do mais urgente para o mais distante." acoes={<Link className="btn" href="/prazos/novo">Novo prazo</Link>} />
      <Abas base="/prazos" atual={f} itens={[['pendente', 'Pendentes'], ['cumprido', 'Cumpridos'], ['todos', 'Todos']]} />
      <section className="papel">
        {lista.length
          ? <ul className="lista">{lista.map((p) => { const proc = d.processo(p.processo_id); return <ItemPrazo key={p.id} prazo={p} processo={proc} nomeCliente={proc && d.cliente(proc.cliente_id)?.nome} hoje={hoje} />; })}</ul>
          : <Vazio>{f === 'pendente' ? 'Nenhum prazo pendente.' : 'Nenhum prazo aqui.'}</Vazio>}
      </section>
      <p className="pequeno discreto">O cálculo é uma ajuda. Confira sempre o prazo no sistema do tribunal, especialmente prazo em dobro, suspensões de expediente e feriados locais.</p>
    </>
  );
}
