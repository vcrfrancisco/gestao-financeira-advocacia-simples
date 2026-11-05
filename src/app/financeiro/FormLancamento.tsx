import { AcoesFinanceiro } from '@/acoes/AcoesFinanceiro';
import { Formulario } from '@/components/Formulario';
import { Opcoes } from '@/components/ui';
import { centInput } from '@/lib/formato';
import { Data } from '@/dominio/Data';
import { LancamentoFinanceiro } from '@/dominio/LancamentoFinanceiro';

type Opcao = { id: string; rotulo: string };

export function FormLancamento({ lancamento: l, clientes, processos }: { lancamento: LancamentoFinanceiro; clientes: Opcao[]; processos: Opcao[] }) {
  return (
    <Formulario acao={AcoesFinanceiro.salvar} rotulo="Salvar lançamento" cancelar={`/financeiro?mes=${l.vence.mesAno}`}>
      <input type="hidden" name="id" value={l.id} />
      <div className="campos">
        <fieldset className="largo">
          <legend>Tipo</legend>
          <label className="opcao"><input type="radio" name="tipo" value="receita" defaultChecked={l.receita} /> Receita</label>
          <label className="opcao"><input type="radio" name="tipo" value="despesa" defaultChecked={!l.receita} /> Despesa</label>
        </fieldset>
        <div className="campo largo"><label htmlFor="descricao">Descrição</label><input id="descricao" name="descricao" type="text" defaultValue={l.descricao} required /></div>
        <div className="campo">
          <label htmlFor="categoria">Categoria</label>
          <select id="categoria" name="categoria" defaultValue={l.categoria}>
            <optgroup label="Receitas">{LancamentoFinanceiro.CATEGORIAS.receita.map((c) => <option key={c}>{c}</option>)}</optgroup>
            <optgroup label="Despesas">{LancamentoFinanceiro.CATEGORIAS.despesa.map((c) => <option key={c}>{c}</option>)}</optgroup>
          </select>
        </div>
        <div className="campo"><label htmlFor="valor">Valor (R$)</label><input id="valor" name="valor" type="text" inputMode="decimal" placeholder="0,00" defaultValue={centInput(l.valor_centavos)} required /></div>
        <div className="campo"><label htmlFor="vencimento">Vencimento</label><input id="vencimento" name="vencimento" type="date" defaultValue={l.vencimento} required /></div>
        <div className="campo">
          <span className="rotulo">Pagamento</span>
          <label className="opcao"><input type="checkbox" name="pago" value="1" defaultChecked={l.pago} /> Já foi pago em</label>
          <input name="pago_em" type="date" aria-label="Data do pagamento" defaultValue={l.pago_em || Data.hoje().iso} />
        </div>
        <div className="campo"><label htmlFor="cliente_id">Cliente</label><select id="cliente_id" name="cliente_id" defaultValue={l.cliente_id}><option value="">Nenhum</option><Opcoes itens={clientes} /></select></div>
        <div className="campo"><label htmlFor="processo_id">Processo</label><select id="processo_id" name="processo_id" defaultValue={l.processo_id}><option value="">Nenhum</option><Opcoes itens={processos} /></select></div>
      </div>
    </Formulario>
  );
}
