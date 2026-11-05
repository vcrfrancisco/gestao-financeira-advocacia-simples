import Link from 'next/link';
import { AcoesFinanceiro } from '@/acoes/AcoesFinanceiro';
import { BotaoAcao, Cabecalho, Situacao, Vazio, param, type ParamsBusca } from '@/components/ui';
import { carregar } from '@/lib/db';
import { cap, fMoeda } from '@/lib/formato';
import { Data } from '@/dominio/Data';
import { somar } from '@/dominio/LancamentoFinanceiro';

export const metadata = { title: 'Financeiro' };

export default async function Financeiro({ searchParams }: ParamsBusca) {
  const hoje = Data.hoje();
  const pedido = param(await searchParams, 'mes');
  const mes = Data.valida(`${pedido}-01`) ? Data.de(`${pedido}-01`) : Data.de(`${hoje.mesAno}-01`);
  const d = await carregar();
  const doMes = d.financeiro.filter((l) => l.vence.mesAno === mes.mesAno).sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  const atrasados = d.financeiro.filter((l) => l.honorarioEmAtraso(hoje) && l.vence.mesAno < mes.mesAno).sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  const recebido = somar(doMes.filter((l) => l.receita && l.pago));
  const saldo = recebido - somar(doMes.filter((l) => !l.receita && l.pago));

  return (
    <>
      <Cabecalho
        titulo={`${cap(Data.nomeDoMes(mes.mes))} de ${mes.ano}`}
        sub={<><Link href={`/financeiro?mes=${mes.maisMeses(-1).mesAno}`}>← Mês anterior</Link> · <Link href={`/financeiro?mes=${mes.maisMeses(1).mesAno}`}>Próximo mês →</Link></>}
        acoes={<>
          <Link className="btn sec" href="/financeiro/novo?tipo=despesa">Lançar despesa</Link>
          <Link className="btn sec" href="/financeiro/novo?tipo=receita">Lançar receita</Link>
          <Link className="btn" href="/financeiro/honorarios">Contrato de honorários</Link>
        </>}
      />
      <dl className="numeros">
        <div><dt>Honorários previstos</dt><dd>{fMoeda(somar(doMes.filter((l) => l.receita)))}</dd></div>
        <div><dt>Recebido</dt><dd>{fMoeda(recebido)}</dd></div>
        <div><dt>Despesas</dt><dd>{fMoeda(somar(doMes.filter((l) => !l.receita)))}</dd></div>
        <div><dt>Saldo realizado</dt><dd className={saldo < 0 ? 'negativo' : ''}>{fMoeda(saldo)}</dd></div>
      </dl>
      {atrasados.length > 0 && (
        <section className="papel">
          <h2>Em atraso de meses anteriores</h2>
          <ul className="lista">
            {atrasados.map((l) => (
              <li key={l.id}>
                <div className="item-corpo"><Link className="titulo" href={`/financeiro/${l.id}`}>{l.rotulo}</Link><div className="meta">{d.cliente(l.cliente_id)?.nome} <span className="etiqueta urgente">{l.vence.formatada()}</span> {l.valorFormatado}</div></div>
                <div className="item-acoes"><Link className="btn mini sec" href={`/financeiro/${l.id}/cobranca`}>Cobrar</Link><BotaoAcao acao={AcoesFinanceiro.pagar} id={l.id}>Recebi</BotaoAcao></div>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="papel">
        <h2>Lançamentos do mês</h2>
        {doMes.length ? (
          <ul className="lista">
            {doMes.map((l) => (
              <li key={l.id}>
                <div className="item-corpo">
                  <Link className="titulo" href={`/financeiro/${l.id}`}>{l.rotulo}</Link>
                  <div className="meta">{l.vence.formatada()}, {!l.receita && '−'}{l.valorFormatado}{d.cliente(l.cliente_id) && `, ${d.cliente(l.cliente_id)!.nome}`}<br /><Situacao lancamento={l} hoje={hoje} /></div>
                </div>
                <div className="item-acoes">
                  {l.pago
                    ? <BotaoAcao acao={AcoesFinanceiro.desfazerPagamento} id={l.id} classe="btn mini sec">Desfazer baixa</BotaoAcao>
                    : <>{l.receita && <Link className="btn mini sec" href={`/financeiro/${l.id}/cobranca`}>Cobrar</Link>}<BotaoAcao acao={AcoesFinanceiro.pagar} id={l.id}>{l.receita ? 'Recebi' : 'Paguei'}</BotaoAcao></>}
                </div>
              </li>
            ))}
          </ul>
        ) : <Vazio>Nenhum lançamento com vencimento neste mês.</Vazio>}
      </section>
    </>
  );
}
