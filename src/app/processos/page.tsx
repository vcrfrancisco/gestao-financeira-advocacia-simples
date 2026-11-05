import Link from 'next/link';
import { Abas, Busca, Cabecalho, Vazio, param, type ParamsBusca } from '@/components/ui';
import { carregar } from '@/lib/db';
import { Data } from '@/dominio/Data';

export const metadata = { title: 'Processos' };

export default async function Processos({ searchParams }: ParamsBusca) {
  const sp = await searchParams;
  const f = param(sp, 'f') || 'ativo';
  const q = param(sp, 'q').toLowerCase();
  const d = await carregar();
  const hoje = Data.hoje();
  const lista = d.processos
    .filter((p) => f === 'todos' || p.status === f)
    .filter((p) => !q || [p.numero, p.parte_contraria, p.tipo_acao, d.cliente(p.cliente_id)?.nome].some((x) => x?.toLowerCase().includes(q)))
    .map((p) => ({ p, prazo: d.prazos.filter((z) => !z.cumprido && z.processo_id === p.id).sort((a, b) => a.data_fim.localeCompare(b.data_fim))[0] }))
    .sort((a, b) => (a.prazo?.data_fim ?? '9999').localeCompare(b.prazo?.data_fim ?? '9999'));
  return (
    <>
      <Cabecalho titulo="Processos" sub={`${lista.length} processo(s)`} acoes={<Link className="btn" href="/processos/novo">Novo processo</Link>} />
      <Abas base="/processos" atual={f} itens={[['ativo', 'Ativos'], ['suspenso', 'Suspensos'], ['arquivado', 'Arquivados'], ['todos', 'Todos']]} />
      <Busca valor={q} dica="Número, cliente, parte contrária ou ação" extras={<input type="hidden" name="f" value={f} />} />
      <section className="papel">
        {lista.length ? (
          <ul className="lista">
            {lista.map(({ p, prazo }) => (
              <li key={p.id}>
                <div className="item-corpo">
                  <Link className="titulo" href={`/processos/${p.id}`}>{p.rotulo}</Link> {!p.ativo && <span className="etiqueta">{p.rotuloStatus}</span>}
                  <div className="meta">
                    {[d.cliente(p.cliente_id)?.nome, p.parte_contraria && `x ${p.parte_contraria}`].filter(Boolean).join(' ') || 'Sem cliente vinculado'}<br />
                    {[p.numero && p.tipo_acao, p.vara, p.comarca, p.tribunal].filter(Boolean).join(', ')}
                  </div>
                </div>
                {prazo && <div className="item-acoes"><span className={`etiqueta ${prazo.vence.urgencia(hoje)}`}>Prazo: {prazo.vence.textoVencimento(hoje)}</span></div>}
              </li>
            ))}
          </ul>
        ) : <Vazio>{q ? 'Nenhum processo encontrado.' : 'Nenhum processo nesta situação.'}</Vazio>}
      </section>
    </>
  );
}
