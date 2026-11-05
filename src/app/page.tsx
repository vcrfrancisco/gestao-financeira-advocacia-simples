import Link from 'next/link';
import { AcoesIntimacao } from '@/acoes/AcoesIntimacao';
import { ItemPrazo, Vazio } from '@/components/ui';
import { carregar } from '@/lib/db';
import { cap, fMoeda } from '@/lib/formato';
import { Data } from '@/dominio/Data';
import { somar } from '@/dominio/LancamentoFinanceiro';

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

export default async function Painel() {
  const d = await carregar();
  const hoje = Data.hoje();
  const limite = hoje.maisDias(7).iso;

  const prazos = d.prazos.filter((p) => !p.cumprido && p.data_fim <= limite).sort((a, b) => a.data_fim.localeCompare(b.data_fim));
  const vencidos = prazos.filter((p) => p.data_fim < hoje.iso).length;
  const venceHoje = prazos.filter((p) => p.data_fim === hoje.iso).length;
  const proximos = prazos.length - vencidos;
  const [manchete, alerta] = vencidos ? [`${plural(vencidos, 'prazo vencido continua', 'prazos vencidos continuam')} sem baixa`, true]
    : venceHoje ? [`${plural(venceHoje, 'prazo vence', 'prazos vencem')} hoje`, true]
      : proximos ? [`${plural(proximos, 'prazo vence', 'prazos vencem')} nos próximos 7 dias`, false]
        : ['Nenhum prazo vence nos próximos 7 dias', false];

  const eventos = d.eventos.filter((e) => e.dia.iso >= hoje.iso && e.dia.iso <= limite).sort((a, b) => a.inicio.localeCompare(b.inicio));
  const intimacoes = d.intimacoes.filter((i) => i.pendente).sort((a, b) => b.data_disponibilizacao.localeCompare(a.data_disponibilizacao));
  const doMes = (iso: string) => iso.slice(0, 7) === hoje.mesAno;
  const receitas = d.financeiro.filter((l) => l.receita);
  const novo = !d.clientes.length && !d.processos.length;

  return (
    <>
      <div className="cabecalho">
        <div>
          <p className="subtitulo">{cap(hoje.nomeDoDia)}, {hoje.porExtenso()}</p>
          <h1 className={`manchete${alerta ? ' alerta' : ''}`}>{manchete}</h1>
        </div>
        <div className="acoes">
          <Link className="btn" href="/prazos/novo">Novo prazo</Link>
          <Link className="btn sec" href="/intimacoes/nova">Registrar intimação</Link>
          <Link className="btn sec" href="/agenda/novo">Novo compromisso</Link>
        </div>
      </div>

      {novo && (
        <section className="papel">
          <h2>Primeiros passos</h2>
          <ol>
            <li><Link href="/ajustes">Preencha seus dados e o estado/município dos feriados</Link>, para os documentos e o cálculo dos prazos.</li>
            <li><Link href="/clientes/novo">Cadastre seus clientes</Link> e <Link href="/processos/novo">seus processos ativos</Link>. Ao colar o número CNJ, o tribunal é preenchido sozinho.</li>
            <li>Ao receber uma intimação, <Link href="/intimacoes/nova">registre-a</Link> e lance o prazo a partir dela.</li>
          </ol>
        </section>
      )}

      <dl className="numeros">
        <div><dt>A receber neste mês</dt><dd>{fMoeda(somar(receitas.filter((l) => !l.pago && doMes(l.vencimento) && l.vencimento >= hoje.iso)))}</dd></div>
        <div><dt>Recebido neste mês</dt><dd>{fMoeda(somar(receitas.filter((l) => l.pago && doMes(l.pago_em))))}</dd></div>
        <div><dt>Despesas do mês</dt><dd>{fMoeda(somar(d.financeiro.filter((l) => !l.receita && doMes(l.vencimento))))}</dd></div>
        <div><dt>Honorários em atraso</dt><dd className={receitas.some((l) => l.emAtraso(hoje)) ? 'negativo' : ''}>{fMoeda(somar(receitas.filter((l) => l.emAtraso(hoje))))}</dd></div>
      </dl>

      <div className="colunas">
        <section className="papel">
          <div className="papel-cabecalho"><h2>Prazos da semana</h2><Link className="pequeno" href="/prazos">Ver todos</Link></div>
          {prazos.length
            ? <ul className="lista">{prazos.map((p) => { const proc = d.processo(p.processo_id); return <ItemPrazo key={p.id} prazo={p} processo={proc} nomeCliente={proc && d.cliente(proc.cliente_id)?.nome} hoje={hoje} />; })}</ul>
            : <Vazio>Sem prazos pendentes para esta semana.</Vazio>}
        </section>
        <div>
          <section className="papel">
            <div className="papel-cabecalho"><h2>Próximos compromissos</h2><Link className="pequeno" href="/agenda">Agenda</Link></div>
            {eventos.length ? (
              <ul className="lista">
                {eventos.map((e) => (
                  <li key={e.id}>
                    <div className="hora">{e.hora}</div>
                    <div className="item-corpo">
                      <Link className="titulo" href={`/agenda/${e.id}`}>{e.rotulo}</Link>
                      <div className="meta">{e.dia.iso === hoje.iso ? 'Hoje' : `${e.dia.nomeDoDia.replace('-feira', '')}, ${e.dia.formatada()}`}{e.local && `, ${e.local}`}</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <Vazio>Nenhum compromisso nos próximos 7 dias.</Vazio>}
          </section>
          <section className="papel">
            <div className="papel-cabecalho"><h2>Intimações para analisar</h2><Link className="pequeno" href="/intimacoes">Ver todas ({intimacoes.length})</Link></div>
            {intimacoes.length ? (
              <ul className="lista">
                {intimacoes.slice(0, 5).map((i) => (
                  <li key={i.id}>
                    <div className="item-corpo"><strong>{i.rotulo}</strong><div className="meta">Recebida em {i.dia.formatada()}{i.numero_processo && <><br />{i.numero_processo}</>}</div></div>
                    <div className="item-acoes">
                      <Link className="btn mini" href={`/prazos/novo?intimacao=${i.id}`}>Lançar prazo</Link>
                      <form action={AcoesIntimacao.arquivar} className="inline"><input type="hidden" name="id" value={i.id} /><button className="btn mini sec">Sem prazo</button></form>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <Vazio>Nenhuma intimação aguardando análise.</Vazio>}
          </section>
        </div>
      </div>
    </>
  );
}
