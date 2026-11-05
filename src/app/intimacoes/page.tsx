import Link from 'next/link';
import { AcoesIntimacao } from '@/acoes/AcoesIntimacao';
import { BotaoConfirmar } from '@/components/BotaoConfirmar';
import { Abas, BotaoAcao, Cabecalho, Vazio, param, type ParamsBusca } from '@/components/ui';
import { carregar } from '@/lib/db';

export const metadata = { title: 'Intimações' };

export default async function Intimacoes({ searchParams }: ParamsBusca) {
  const f = param(await searchParams, 'f') || 'nova';
  const d = await carregar();
  const lista = d.intimacoes
    .filter((i) => f === 'todas' || (f === 'tratada' ? !i.pendente : i.pendente))
    .sort((a, b) => b.data_disponibilizacao.localeCompare(a.data_disponibilizacao));
  return (
    <>
      <Cabecalho titulo="Intimações" sub="Registre cada intimação recebida e lance o prazo a partir dela." acoes={<Link className="btn" href="/intimacoes/nova">Registrar intimação</Link>} />
      <Abas base="/intimacoes" atual={f} itens={[['nova', 'Para analisar'], ['tratada', 'Analisadas'], ['todas', 'Todas']]} />
      <section className="papel">
        {lista.length ? (
          <ul className="lista">
            {lista.map((i) => {
              const proc = d.processo(i.processo_id);
              const prazos = d.prazos.filter((p) => p.intimacao_id === i.id).length;
              return (
                <li key={i.id}>
                  <div className="item-corpo">
                    <strong>{i.rotulo}</strong> {prazos > 0 && <span className="etiqueta ok">{prazos} prazo(s) lançado(s)</span>}
                    <div className="meta">
                      {i.quando()}{i.tribunal && `, ${i.tribunal}`}<br />
                      {proc ? <Link href={`/processos/${proc.id}`}>{proc.rotulo}</Link> : i.numero_processo}
                    </div>
                    {i.texto && <details><summary>Ler texto</summary><div className="texto-intimacao">{i.texto}</div></details>}
                  </div>
                  <div className="item-acoes">
                    <Link className="btn mini" href={`/prazos/novo?intimacao=${i.id}`}>Lançar prazo</Link>
                    {i.pendente
                      ? <BotaoAcao acao={AcoesIntimacao.arquivar} id={i.id} classe="btn mini sec">Sem prazo, arquivar</BotaoAcao>
                      : <BotaoAcao acao={AcoesIntimacao.reabrir} id={i.id} classe="btn mini sec">Voltar para análise</BotaoAcao>}
                    <BotaoConfirmar acao={AcoesIntimacao.excluir} id={i.id} mini />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : <Vazio>{f === 'nova' ? 'Nenhuma intimação aguardando análise.' : 'Nenhuma intimação aqui.'}</Vazio>}
      </section>
      <p className="pequeno discreto">O registro das intimações é manual: copie do Diário (DJe/DJEN) ou do sistema do tribunal.</p>
    </>
  );
}
