import Link from 'next/link';
import { Cabecalho, Vazio } from '@/components/ui';
import { carregar } from '@/lib/db';
import { cap } from '@/lib/formato';
import { Data } from '@/dominio/Data';
import type { Evento } from '@/dominio/Evento';
import type { Prazo } from '@/dominio/Prazo';

export const metadata = { title: 'Agenda' };

export default async function Agenda() {
  const d = await carregar();
  const hoje = Data.hoje();
  const dias = new Map<string, { eventos: Evento[]; prazos: Prazo[] }>();
  const dia = (iso: string) => dias.get(iso) ?? dias.set(iso, { eventos: [], prazos: [] }).get(iso)!;
  d.eventos.filter((e) => e.dia.iso >= hoje.iso).forEach((e) => dia(e.dia.iso).eventos.push(e));
  d.prazos.filter((p) => !p.cumprido && p.data_fim >= hoje.iso).forEach((p) => dia(p.data_fim).prazos.push(p));
  const ordem = [...dias].sort(([a], [b]) => a.localeCompare(b));

  return (
    <>
      <Cabecalho titulo="Agenda" sub="Compromissos e vencimentos de prazos, dia a dia." acoes={<Link className="btn" href="/agenda/novo">Novo compromisso</Link>} />
      {ordem.length ? ordem.map(([iso, { eventos, prazos }]) => {
        const data = Data.de(iso);
        const dif = hoje.diasAte(data);
        return (
          <section key={iso} className="papel">
            <h2>{dif === 0 ? 'Hoje' : dif === 1 ? 'Amanhã' : cap(data.nomeDoDia)} <span className="discreto" style={{ fontWeight: 400 }}>{data.porExtenso()}</span></h2>
            <ul className="lista">
              {prazos.map((p) => (
                <li key={p.id}>
                  <div className="hora"><span className={`etiqueta ${p.urgencia(hoje)}`}>Prazo</span></div>
                  <div className="item-corpo"><Link className="titulo" href={`/prazos/${p.id}`}>{p.rotulo}</Link>{d.processo(p.processo_id) && <div className="meta">{d.processo(p.processo_id)!.rotulo}</div>}</div>
                </li>
              ))}
              {eventos.sort((a, b) => a.inicio.localeCompare(b.inicio)).map((e) => (
                <li key={e.id}>
                  <div className="hora">{e.hora}</div>
                  <div className="item-corpo"><Link className="titulo" href={`/agenda/${e.id}`}>{e.rotulo}</Link><div className="meta">{e.detalhes()}</div></div>
                </li>
              ))}
            </ul>
          </section>
        );
      }) : <section className="papel"><Vazio>Nada agendado. Cadastre audiências, reuniões e perícias.</Vazio></section>}
    </>
  );
}
