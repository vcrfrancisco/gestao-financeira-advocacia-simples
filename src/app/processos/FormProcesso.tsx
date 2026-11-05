import { AcoesProcesso } from '@/acoes/AcoesProcesso';
import { CampoCNJ } from '@/components/CampoCNJ';
import { Formulario } from '@/components/Formulario';
import { Opcoes } from '@/components/ui';
import { centInput } from '@/lib/formato';
import { Processo } from '@/dominio/Processo';

type Props = { processo: Processo; clientes: { id: string; rotulo: string }[]; cancelar: string };

export function FormProcesso({ processo: p, clientes, cancelar }: Props) {
  const texto = (n: keyof Processo & string, rotulo: string, extra: Record<string, string> = {}) => (
    <div className="campo"><label htmlFor={n}>{rotulo}</label><input id={n} name={n} type="text" defaultValue={String(p[n] ?? '')} {...extra} /></div>
  );
  return (
    <Formulario acao={AcoesProcesso.salvar} rotulo="Salvar processo" cancelar={cancelar}>
      <input type="hidden" name="id" value={p.id} />
      <div className="campos">
        <div className="largo"><CampoCNJ name="numero" valor={p.numero} /></div>
        <div className="campo">
          <label htmlFor="cliente_id">Cliente</label>
          <select id="cliente_id" name="cliente_id" defaultValue={p.cliente_id}><option value="">Selecione</option><Opcoes itens={clientes} /></select>
        </div>
        <div className="campo">
          <label htmlFor="polo">O cliente é</label>
          <select id="polo" name="polo" defaultValue={p.polo}><option value="">Selecione</option>{Object.entries(Processo.POLOS).map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select>
        </div>
        <div className="largo">{texto('parte_contraria', 'Parte contrária')}</div>
        {texto('tipo_acao', 'Tipo de ação', { placeholder: 'Ex.: Ação de indenização' })}
        <div className="campo">
          <label htmlFor="area">Área</label>
          <select id="area" name="area" defaultValue={p.area}><option value="">Selecione</option>{Processo.AREAS.map((a) => <option key={a}>{a}</option>)}</select>
        </div>
        {texto('tribunal', 'Tribunal')}
        {texto('comarca', 'Comarca')}
        {texto('vara', 'Vara / órgão julgador')}
        <div className="campo"><label htmlFor="valor_causa">Valor da causa (R$)</label><input id="valor_causa" name="valor_causa" type="text" inputMode="decimal" placeholder="0,00" defaultValue={centInput(p.valor_causa_centavos)} /></div>
        <div className="campo">
          <label htmlFor="fase">Fase</label>
          <select id="fase" name="fase" defaultValue={p.fase}>{Processo.FASES.map((x) => <option key={x}>{x}</option>)}</select>
        </div>
        <div className="campo">
          <label htmlFor="status">Situação</label>
          <select id="status" name="status" defaultValue={p.status}>{Object.entries(Processo.STATUS).map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select>
        </div>
        <div className="campo largo"><label htmlFor="observacoes">Observações</label><textarea id="observacoes" name="observacoes" defaultValue={p.observacoes} /></div>
      </div>
    </Formulario>
  );
}
