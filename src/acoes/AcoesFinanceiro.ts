import { buscar, excluir, salvar, salvarVarios } from '@/lib/db';
import { fMoeda, parseMoeda } from '@/lib/formato';
import { Data } from '@/dominio/Data';
import { LancamentoFinanceiro } from '@/dominio/LancamentoFinanceiro';
import { Acoes, type Resultado } from './Acoes';

export class AcoesFinanceiro extends Acoes {
  static async salvar(fd: FormData): Promise<Resultado> {
    'use server';
    const valor = parseMoeda(AcoesFinanceiro.campo(fd, 'valor'));
    const vencimento = AcoesFinanceiro.campo(fd, 'vencimento');
    const pagoEm = AcoesFinanceiro.campo(fd, 'pago_em');
    if (!AcoesFinanceiro.campo(fd, 'descricao')) return { erro: 'Descreva o lançamento.' };
    if (!valor || valor <= 0) return { erro: 'Informe um valor maior que zero.' };
    if (!Data.valida(vencimento)) return { erro: 'Informe o vencimento.' };
    await salvar(LancamentoFinanceiro, {
      ...AcoesFinanceiro.colunas(fd, LancamentoFinanceiro, 'id', 'descricao', 'categoria', 'cliente_id', 'processo_id'),
      tipo: AcoesFinanceiro.campo(fd, 'tipo') === 'despesa' ? 'despesa' : 'receita',
      valor_centavos: String(valor),
      vencimento,
      pago_em: fd.get('pago') ? (Data.valida(pagoEm) ? pagoEm : Data.hoje().iso) : '',
    });
    AcoesFinanceiro.concluir(`/financeiro?mes=${vencimento.slice(0, 7)}`, 'Lançamento salvo.');
  }

  /** Contrato de honorários: lança a entrada e as parcelas mensais de uma vez. */
  static async lancarHonorarios(fd: FormData): Promise<Resultado> {
    'use server';
    const total = parseMoeda(AcoesFinanceiro.campo(fd, 'valor_total'));
    const entrada = parseMoeda(AcoesFinanceiro.campo(fd, 'entrada')) ?? 0;
    const parcelas = Number.parseInt(AcoesFinanceiro.campo(fd, 'parcelas'), 10);
    const clienteId = AcoesFinanceiro.campo(fd, 'cliente_id');
    const primeiroVencimento = AcoesFinanceiro.campo(fd, 'primeiro_vencimento');
    if (!clienteId) return { erro: 'Escolha o cliente.' };
    if (!total || total <= 0) return { erro: 'Informe o valor total.' };
    if (!parcelas || parcelas < 1 || parcelas > 120) return { erro: 'O número de parcelas deve ficar entre 1 e 120.' };
    if (entrada < 0) return { erro: 'A entrada não pode ser negativa.' };
    if (entrada >= total) return { erro: 'A entrada precisa ser menor que o total.' };
    if (!Data.valida(primeiroVencimento)) return { erro: 'Informe o vencimento da 1ª parcela.' };

    await salvarVarios(LancamentoFinanceiro, LancamentoFinanceiro.contratoDeHonorarios({
      total, entrada, parcelas, primeiroVencimento, entradaPaga: Boolean(fd.get('entrada_paga')),
      descricao: AcoesFinanceiro.campo(fd, 'descricao') || 'Honorários advocatícios',
      cliente_id: clienteId, processo_id: AcoesFinanceiro.campo(fd, 'processo_id'),
    }));
    AcoesFinanceiro.concluir(`/clientes/${clienteId}`, `Contrato lançado: ${fMoeda(total)}${parcelas > 1 ? ` em ${parcelas} parcelas` : ''}.`);
  }

  static async pagar(fd: FormData) {
    'use server';
    await salvar(LancamentoFinanceiro, { id: AcoesFinanceiro.campo(fd, 'id'), pago_em: Data.hoje().iso });
    AcoesFinanceiro.atualizarTelas();
  }

  /** Baixa feita na tela de cobrança: volta para o financeiro. */
  static async receberCobranca(fd: FormData) {
    'use server';
    const l = await salvar(LancamentoFinanceiro, { id: AcoesFinanceiro.campo(fd, 'id'), pago_em: Data.hoje().iso });
    AcoesFinanceiro.concluir(`/financeiro?mes=${l.vence.mesAno}`, `Recebimento de ${l.valorFormatado} registrado.`);
  }

  static async desfazerPagamento(fd: FormData) {
    'use server';
    await salvar(LancamentoFinanceiro, { id: AcoesFinanceiro.campo(fd, 'id'), pago_em: '' });
    AcoesFinanceiro.atualizarTelas();
  }

  static async excluir(fd: FormData) {
    'use server';
    const l = await buscar(LancamentoFinanceiro, AcoesFinanceiro.campo(fd, 'id'));
    if (l) await excluir(LancamentoFinanceiro, l.id);
    AcoesFinanceiro.concluir(`/financeiro${l ? `?mes=${l.vence.mesAno}` : ''}`, 'Lançamento excluído.');
  }
}
