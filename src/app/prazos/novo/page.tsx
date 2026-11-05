import { AcoesPrazo } from '@/acoes/AcoesPrazo';
import { FormPrazo } from '@/components/FormPrazo';
import { Cabecalho, opcoesProcessos, param, type ParamsBusca } from '@/components/ui';
import { carregar } from '@/lib/db';
import { linhaVazia } from '@/lib/tabelas';
import { Data } from '@/dominio/Data';

export const metadata = { title: 'Novo prazo' };

export default async function NovoPrazo({ searchParams }: ParamsBusca) {
  const sp = await searchParams;
  const d = await carregar();
  const intim = d.intimacoes.find((i) => i.id === param(sp, 'intimacao'));
  const processoId = param(sp, 'processo') || intim?.processo_id || '';
  const inicial = linhaVazia('prazos', {
    processo_id: processoId, intimacao_id: intim?.id ?? '', contagem: 'uteis',
    tipo_base: intim?.tipoBase ?? 'disponibilizacao', data_base: intim?.data_disponibilizacao ?? Data.hoje().iso,
  });
  return (
    <>
      <Cabecalho titulo="Novo prazo" />
      {intim && (
        <section className="papel">
          <h2>Intimação</h2>
          <dl className="dados">
            <dt>Data</dt><dd>{intim.quando()}</dd>
            {intim.tipo && <><dt>Assunto</dt><dd>{intim.tipo}</dd></>}
            {intim.numero_processo && <><dt>Processo</dt><dd>{intim.numero_processo}</dd></>}
          </dl>
          {intim.texto && <details open><summary>Texto</summary><div className="texto-intimacao">{intim.texto}</div></details>}
        </section>
      )}
      <FormPrazo acao={AcoesPrazo.salvar} inicial={inicial} processos={opcoesProcessos(d, processoId)} calendario={await d.calendario()} cancelar={processoId ? `/processos/${processoId}` : '/prazos'} />
    </>
  );
}
