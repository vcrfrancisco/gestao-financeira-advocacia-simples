'use client';

import { useState } from 'react';
import type { Resultado } from '@/acoes/Acoes';
import { LancamentoFinanceiro } from '@/dominio/LancamentoFinanceiro';
import { parseMoeda } from '@/lib/formato';
import { Formulario } from './Formulario';

type Opcao = { id: string; rotulo: string };
type Props = {
  acao: (fd: FormData) => Promise<Resultado>;
  clientes: Opcao[];
  processos: Opcao[];
  clienteId: string;
  processoId: string;
  hoje: string;
  cancelar: string;
};

/** Contrato de honorários com a simulação das parcelas ao lado. */
export function FormHonorarios({ acao, clientes, processos, clienteId, processoId, hoje, cancelar }: Props) {
  const [total, setTotal] = useState('');
  const [entrada, setEntrada] = useState('');
  const [parcelas, setParcelas] = useState('1');
  const simulacao = LancamentoFinanceiro.simular({ total: parseMoeda(total) ?? 0, entrada: parseMoeda(entrada) ?? 0, parcelas: Number(parcelas) || 0 });
  return (
    <Formulario acao={acao} rotulo="Lançar contrato" cancelar={cancelar}>
      <div className="campos">
        <div className="campo">
          <label htmlFor="cliente_id">Cliente</label>
          <select id="cliente_id" name="cliente_id" required defaultValue={clienteId}>
            <option value="">Selecione</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.rotulo}</option>)}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="processo_id">Processo (opcional)</label>
          <select id="processo_id" name="processo_id" defaultValue={processoId}>
            <option value="">Nenhum</option>
            {processos.map((p) => <option key={p.id} value={p.id}>{p.rotulo}</option>)}
          </select>
        </div>
        <div className="campo largo">
          <label htmlFor="descricao">Descrição</label>
          <input id="descricao" name="descricao" type="text" placeholder="Honorários advocatícios" />
        </div>
        <div className="campo">
          <label htmlFor="valor_total">Valor total (R$)</label>
          <input id="valor_total" name="valor_total" type="text" inputMode="decimal" placeholder="0,00" required value={total} onChange={(e) => setTotal(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="entrada">Entrada (R$, opcional)</label>
          <input id="entrada" name="entrada" type="text" inputMode="decimal" placeholder="0,00" value={entrada} onChange={(e) => setEntrada(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="parcelas">Parcelas (após a entrada)</label>
          <input id="parcelas" name="parcelas" type="number" inputMode="numeric" min={1} max={120} required value={parcelas} onChange={(e) => setParcelas(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="primeiro_vencimento">Vencimento da 1ª parcela</label>
          <input id="primeiro_vencimento" name="primeiro_vencimento" type="date" defaultValue={hoje} required />
        </div>
        <div className="campo largo">
          <label className="opcao"><input type="checkbox" name="entrada_paga" value="1" defaultChecked /> A entrada já foi paga hoje</label>
        </div>
      </div>
      <div className="previa" aria-live="polite">{simulacao}</div>
    </Formulario>
  );
}
