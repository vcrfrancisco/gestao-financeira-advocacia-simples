'use client';

import { useMemo, useState } from 'react';
import type { Resultado } from '@/acoes/Acoes';
import { Calendario, type Contagem, type OpcoesCalendario, type TipoBase } from '@/dominio/Calendario';
import { Data } from '@/dominio/Data';
import { Prazo } from '@/dominio/Prazo';
import type { Registro } from '@/lib/tabelas';
import { Formulario } from './Formulario';

type Props = {
  acao: (fd: FormData) => Promise<Resultado>;
  inicial: Registro<'prazos'>;
  processos: { id: string; rotulo: string }[];
  calendario: OpcoesCalendario;
  cancelar: string;
};

/** Formulário de prazo com a prévia do vencimento calculada enquanto se digita. */
export function FormPrazo({ acao, inicial, processos, calendario, cancelar }: Props) {
  const cal = useMemo(() => new Calendario(calendario), [calendario]);
  const [descricao, setDescricao] = useState(inicial.descricao);
  const [dataBase, setDataBase] = useState(inicial.data_base);
  const [tipoBase, setTipoBase] = useState<TipoBase>(inicial.tipo_base === 'ciencia' ? 'ciencia' : 'disponibilizacao');
  const [dias, setDias] = useState(inicial.dias);
  const [contagem, setContagem] = useState<Contagem>(inicial.contagem === 'corridos' ? 'corridos' : 'uteis');
  const [manual, setManual] = useState(inicial.ajuste_manual === 'sim' ? inicial.data_fim : '');

  let previa;
  if (Data.valida(manual)) {
    const d = Data.de(manual);
    previa = <>Vencimento definido manualmente: <strong className="data">{d.formatada()}</strong>, {d.nomeDoDia}.</>;
  } else if (!dataBase || !dias) {
    previa = 'Preencha a data e a quantidade de dias para ver o vencimento.';
  } else {
    try {
      const r = cal.calcularPrazo({ dataBase, tipoBase, dias: Number(dias), contagem });
      const fim = Data.de(r.dataFim);
      // Junta dias seguidos com o mesmo motivo (ex.: recesso de 20/12 a 20/01).
      const grupos: { data: string; ate?: string; motivo: string }[] = [];
      for (const d of r.descontados) {
        const u = grupos.at(-1);
        if (u && u.motivo === d.motivo) u.ate = d.data; else grupos.push({ ...d });
      }
      previa = (
        <>
          Vence em <strong className="data">{fim.formatada()}</strong>, {fim.nomeDoDia}.
          <br />
          <span className="pequeno discreto">
            {r.dataPublicacao && `Publicação considerada em ${Data.de(r.dataPublicacao).formatada()}. `}
            Contagem começa em {Data.de(r.dataInicio).formatada()}.
          </span>
          {grupos.length > 0 && (
            <>
              <div className="pequeno" style={{ marginTop: '.4rem' }}>Dias sem contagem no período:</div>
              <ul className="pequeno">
                {grupos.map((g) => <li key={g.data}>{Data.de(g.data).formatada()}{g.ate && ` a ${Data.de(g.ate).formatada()}`}: {g.motivo}</li>)}
              </ul>
            </>
          )}
        </>
      );
    } catch (e) {
      previa = (e as Error).message;
    }
  }

  return (
    <Formulario acao={acao} rotulo="Salvar prazo" cancelar={cancelar}>
      <input type="hidden" name="id" value={inicial.id} />
      <input type="hidden" name="intimacao_id" value={inicial.intimacao_id} />
      <div className="campos">
        <div className="campo largo">
          <label htmlFor="prazo-comum">Prazo comum (opcional)</label>
          <select id="prazo-comum" defaultValue="" onChange={(e) => {
            const [d, n, c] = e.currentTarget.value.split('|');
            if (!n) return;
            setDescricao(d); setDias(n); setContagem(c as Contagem);
          }}>
            <option value="">Escolha para preencher descrição, dias e contagem</option>
            {Prazo.COMUNS.map(([grupo, itens]) => (
              <optgroup key={grupo} label={grupo}>
                {itens.map(([n, d, c]) => <option key={n} value={`${n}|${d}|${c}`}>{n}, {d} dias {c === 'uteis' ? 'úteis' : 'corridos'}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="campo largo">
          <label htmlFor="descricao">Descrição</label>
          <input id="descricao" name="descricao" type="text" required placeholder="Ex.: Contestação" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </div>
        <div className="campo largo">
          <label htmlFor="processo_id">Processo</label>
          <select id="processo_id" name="processo_id" defaultValue={inicial.processo_id}>
            <option value="">Sem processo vinculado</option>
            {processos.map((p) => <option key={p.id} value={p.id}>{p.rotulo}</option>)}
          </select>
        </div>
        <fieldset className="largo">
          <legend>Como você foi intimado</legend>
          <label className="opcao"><input type="radio" name="tipo_base" value="disponibilizacao" checked={tipoBase === 'disponibilizacao'} onChange={() => setTipoBase('disponibilizacao')} /> <span>Publicação no Diário (DJe ou DJEN). Informe a data de <strong>disponibilização</strong>; a publicação conta no dia útil seguinte.</span></label>
          <label className="opcao"><input type="radio" name="tipo_base" value="ciencia" checked={tipoBase === 'ciencia'} onChange={() => setTipoBase('ciencia')} /> <span>Intimação eletrônica no sistema, pessoal ou por oficial. Informe a data da <strong>ciência</strong>.</span></label>
        </fieldset>
        <div className="campo">
          <label htmlFor="data_base">Data</label>
          <input id="data_base" name="data_base" type="date" value={dataBase} onChange={(e) => setDataBase(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="dias">Quantidade de dias</label>
          <input id="dias" name="dias" type="number" inputMode="numeric" min={1} max={3650} value={dias} onChange={(e) => setDias(e.target.value)} />
        </div>
        <fieldset className="largo">
          <legend>Contagem</legend>
          <label className="opcao"><input type="radio" name="contagem" value="uteis" checked={contagem === 'uteis'} onChange={() => setContagem('uteis')} /> Dias úteis (CPC, CLT, Juizados)</label>
          <label className="opcao"><input type="radio" name="contagem" value="corridos" checked={contagem === 'corridos'} onChange={() => setContagem('corridos')} /> Dias corridos (processo penal)</label>
        </fieldset>
      </div>
      <div className="previa" aria-live="polite">{previa}</div>
      <details style={{ marginTop: '1rem' }} open={Boolean(manual)}>
        <summary>Definir o vencimento manualmente</summary>
        <div className="campo" style={{ marginTop: '.75rem', maxWidth: '16rem' }}>
          <label htmlFor="data_fim_manual">Vencimento</label>
          <input id="data_fim_manual" name="data_fim_manual" type="date" value={manual} onChange={(e) => setManual(e.target.value)} />
          <p className="ajuda">Se preenchido, substitui o cálculo.</p>
        </div>
      </details>
      <div className="campo" style={{ marginTop: '1rem' }}>
        <label htmlFor="observacoes">Observações</label>
        <textarea id="observacoes" name="observacoes" defaultValue={inicial.observacoes} />
      </div>
    </Formulario>
  );
}
