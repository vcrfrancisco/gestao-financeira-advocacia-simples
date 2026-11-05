import Link from 'next/link';
import { Busca, Cabecalho, Vazio, param, type ParamsBusca } from '@/components/ui';
import { carregar } from '@/lib/db';
import { fMoeda } from '@/lib/formato';
import { Data } from '@/dominio/Data';
import { somar } from '@/dominio/LancamentoFinanceiro';

export const metadata = { title: 'Clientes' };

export default async function Clientes({ searchParams }: ParamsBusca) {
  const q = param(await searchParams, 'q').toLowerCase();
  const d = await carregar();
  const hoje = Data.hoje();
  const lista = d.clientes
    .filter((c) => !q || [c.nome, c.cpf_cnpj, c.telefone, c.email].some((x) => x.toLowerCase().includes(q)))
    .sort((a, b) => a.nome.localeCompare(b.nome));
  return (
    <>
      <Cabecalho titulo="Clientes" sub={`${lista.length} cadastrado(s)`} acoes={<Link className="btn" href="/clientes/novo">Novo cliente</Link>} />
      <Busca valor={q} dica="Nome, CPF/CNPJ, telefone ou e-mail" />
      <section className="papel">
        {lista.length ? (
          <ul className="lista">
            {lista.map((c) => {
              const ativos = d.processos.filter((p) => p.cliente_id === c.id && p.ativo).length;
              const atraso = somar(d.financeiro.filter((l) => l.cliente_id === c.id && l.honorarioEmAtraso(hoje)));
              return (
                <li key={c.id}>
                  <div className="item-corpo">
                    <Link className="titulo" href={`/clientes/${c.id}`}>{c.nome}</Link> {atraso > 0 && <span className="etiqueta urgente">{fMoeda(atraso)} em atraso</span>}
                    <div className="meta">{[c.cpf_cnpj, c.telefone].filter(Boolean).join(', ') || 'Sem documento ou contato'}<br />{ativos} processo(s) ativo(s)</div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : <Vazio>{q ? 'Nenhum cliente encontrado.' : 'Você ainda não cadastrou clientes.'}</Vazio>}
      </section>
    </>
  );
}
