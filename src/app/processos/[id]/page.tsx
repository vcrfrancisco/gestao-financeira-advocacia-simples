import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AcoesProcesso } from '@/acoes/AcoesProcesso';
import { BotaoConfirmar } from '@/components/BotaoConfirmar';
import { Formulario } from '@/components/Formulario';
import { Cabecalho, ItemPrazo, TabelaFinanceiro, Vazio, type ParamsId } from '@/components/ui';
import { carregar } from '@/lib/db';
import { fMoeda } from '@/lib/formato';
import { Data } from '@/dominio/Data';

export const metadata = { title: 'Processo' };

export default async function VerProcesso({ params }: ParamsId) {
  const { id } = await params;
  const d = await carregar();
  const p = d.processo(id);
  if (!p) notFound();
  const cli = d.cliente(p.cliente_id);
  const hoje = Data.hoje();
  const prazos = d.prazos.filter((z) => z.processo_id === id).sort((a, b) => Number(a.cumprido) - Number(b.cumprido) || a.data_fim.localeCompare(b.data_fim));
  const andamentos = d.andamentos.filter((a) => a.processo_id === id).sort((a, b) => b.data.localeCompare(a.data));
  const eventos = d.eventos.filter((e) => e.processo_id === id).sort((a, b) => b.inicio.localeCompare(a.inicio));
  const financeiro = d.financeiro.filter((l) => l.processo_id === id).sort((a, b) => b.vencimento.localeCompare(a.vencimento));
  const dado = (rotulo: string, valor: string) => <><dt>{rotulo}</dt><dd>{valor || '—'}</dd></>;

  return (
    <>
      <Cabecalho
        titulo={p.rotulo}
        sub={<>{cli ? <Link href={`/clientes/${cli.id}`}>{cli.nome}</Link> : 'Sem cliente vinculado'}{p.parte_contraria && ` x ${p.parte_contraria}`} {!p.ativo && <span className="etiqueta">{p.rotuloStatus}</span>}</>}
        acoes={<>
          <Link className="btn" href={`/prazos/novo?processo=${id}`}>Novo prazo</Link>
          <Link className="btn sec" href={`/intimacoes/nova?processo=${id}`}>Registrar intimação</Link>
          <Link className="btn sec" href={`/agenda/novo?processo=${id}`}>Agendar</Link>
          <Link className="btn sec" href={`/processos/${id}/editar`}>Editar</Link>
        </>}
      />
      <div className="colunas">
        <section className="papel">
          <h2>Dados do processo</h2>
          <dl className="dados">
            {p.numero && dado('Ação', p.tipo_acao)}
            {dado('Área', p.area)}{dado('Tribunal', p.tribunal)}{dado('Vara', p.vara)}{dado('Comarca', p.comarca)}{dado('Fase', p.fase)}
            {dado('Polo do cliente', p.rotuloPolo)}
            {dado('Valor da causa', p.valor_causa_centavos && fMoeda(Number(p.valor_causa_centavos)))}
            {p.observacoes && dado('Observações', p.observacoes)}
          </dl>
        </section>
        <section className="papel">
          <h2>Prazos</h2>
          {prazos.length ? <ul className="lista">{prazos.map((z) => <ItemPrazo key={z.id} prazo={z} hoje={hoje} />)}</ul> : <Vazio>Nenhum prazo cadastrado.</Vazio>}
        </section>
      </div>

      {eventos.length > 0 && (
        <section className="papel">
          <h2>Compromissos</h2>
          <ul className="lista">
            {eventos.map((e) => <li key={e.id}><div className="item-corpo"><Link className="titulo" href={`/agenda/${e.id}`}>{e.rotulo}</Link><div className="meta">{e.dia.formatada()} às {e.hora}{e.local && `, ${e.local}`}</div></div></li>)}
          </ul>
        </section>
      )}

      <section className="papel">
        <h2>Andamentos</h2>
        <Formulario acao={AcoesProcesso.registrarAndamento} rotulo="Registrar andamento" className="">
          <input type="hidden" name="processo_id" value={id} />
          <div className="linha-form">
            <div className="campo" style={{ flex: '0 1 11rem' }}><label htmlFor="data-and">Data</label><input id="data-and" name="data" type="date" defaultValue={hoje.iso} required /></div>
            <div className="campo" style={{ flex: '3 1 16rem' }}><label htmlFor="desc-and">O que aconteceu</label><input id="desc-and" name="descricao" type="text" placeholder="Ex.: Audiência sem acordo" required /></div>
          </div>
        </Formulario>
        {andamentos.length ? (
          <ul className="lista" style={{ marginTop: '1.25rem' }}>
            {andamentos.map((a) => {
              const aviso = a.avisoAoCliente(p, cli);
              return (
                <li key={a.id}>
                  <div className="item-corpo"><strong>{a.dia.formatada()}</strong><div>{a.descricao}</div></div>
                  <div className="item-acoes">
                    {aviso && <a className="btn mini sec" href={aviso} target="_blank" rel="noopener noreferrer">Avisar cliente no WhatsApp</a>}
                    <BotaoConfirmar acao={AcoesProcesso.excluirAndamento} id={a.id} mini />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : <p className="vazio" style={{ marginTop: '1rem' }}>Nenhum andamento registrado.</p>}
      </section>

      <section className="papel">
        <div className="papel-cabecalho">
          <h2>Financeiro do processo</h2>
          <div className="acoes">
            <Link className="btn mini sec" href={`/financeiro/novo?tipo=despesa&processo=${id}&cliente=${p.cliente_id}`}>Lançar custa</Link>
            <Link className="btn mini" href={`/financeiro/honorarios?processo=${id}&cliente=${p.cliente_id}`}>Contrato de honorários</Link>
          </div>
        </div>
        {financeiro.length ? <TabelaFinanceiro itens={financeiro} hoje={hoje} /> : <Vazio>Nenhum honorário ou custa lançado.</Vazio>}
      </section>

      <section className="papel">
        <h2>Gerar documento</h2>
        <p className="discreto">Peças e contratos preenchidos com os dados deste processo e do cliente.</p>
        <div className="acoes">{d.modelos.map((m) => <Link key={m.id} className="btn sec" href={`/documentos/gerar/${m.id}?processo=${id}`}>{m.rotulo}</Link>)}</div>
      </section>

      <BotaoConfirmar acao={AcoesProcesso.excluir} id={id} rotulo="Excluir processo" />
    </>
  );
}
