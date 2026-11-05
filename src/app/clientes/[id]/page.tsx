import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AcoesCliente } from '@/acoes/AcoesCliente';
import { BotaoConfirmar } from '@/components/BotaoConfirmar';
import { Cabecalho, TabelaFinanceiro, Vazio, type ParamsId } from '@/components/ui';
import { carregar } from '@/lib/db';
import { Data } from '@/dominio/Data';

export const metadata = { title: 'Cliente' };

export default async function VerCliente({ params }: ParamsId) {
  const { id } = await params;
  const d = await carregar();
  const c = d.cliente(id);
  if (!c) notFound();
  const processos = d.processos.filter((p) => p.cliente_id === id);
  const honorarios = d.financeiro.filter((l) => l.cliente_id === id && l.receita).sort((a, b) => b.vencimento.localeCompare(a.vencimento));
  const whats = c.whatsapp();
  return (
    <>
      <Cabecalho
        titulo={c.nome}
        sub={`${c.pessoaJuridica ? 'Pessoa jurídica' : 'Pessoa física'}${c.cpf_cnpj ? `, ${c.cpf_cnpj}` : ''}`}
        acoes={<>
          {whats && <a className="btn sec" href={whats} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
          <Link className="btn sec" href={`/clientes/${id}/editar`}>Editar</Link>
          <Link className="btn" href={`/processos/novo?cliente=${id}`}>Novo processo</Link>
        </>}
      />
      <div className="colunas">
        <section className="papel">
          <h2>Dados</h2>
          <dl className="dados">
            <dt>Telefone</dt><dd>{c.telefone || '—'}</dd>
            <dt>E-mail</dt><dd>{c.email || '—'}</dd>
            <dt>Endereço</dt><dd>{c.endereco || '—'}</dd>
            {c.observacoes && <><dt>Observações</dt><dd>{c.observacoes}</dd></>}
          </dl>
        </section>
        <section className="papel">
          <h2>Processos</h2>
          {processos.length ? (
            <ul className="lista">
              {processos.map((p) => (
                <li key={p.id}><div className="item-corpo"><Link className="titulo" href={`/processos/${p.id}`}>{p.rotulo}</Link> {!p.ativo && <span className="etiqueta">{p.rotuloStatus}</span>}<div className="meta">{[p.tipo_acao, p.vara, p.comarca].filter(Boolean).join(', ')}</div></div></li>
              ))}
            </ul>
          ) : <Vazio>Nenhum processo para este cliente.</Vazio>}
        </section>
      </div>
      <section className="papel">
        <div className="papel-cabecalho"><h2>Honorários</h2><Link className="btn mini" href={`/financeiro/honorarios?cliente=${id}`}>Novo contrato de honorários</Link></div>
        {honorarios.length ? <TabelaFinanceiro itens={honorarios} hoje={Data.hoje()} /> : <Vazio>Nenhum honorário lançado.</Vazio>}
      </section>
      <section className="papel">
        <h2>Gerar documento</h2>
        <div className="acoes">{d.modelos.map((m) => <Link key={m.id} className="btn sec" href={`/documentos/gerar/${m.id}?cliente=${id}`}>{m.rotulo}</Link>)}</div>
      </section>
      <BotaoConfirmar acao={AcoesCliente.excluir} id={id} rotulo="Excluir cliente" />
    </>
  );
}
