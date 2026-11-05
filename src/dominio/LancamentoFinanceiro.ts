import type { Config, Registro } from '@/lib/tabelas';
import { fMoeda } from '@/lib/formato';
import { gerarPix } from '@/lib/pix';
import { Lancamento } from './Lancamento';
import { Data } from './Data';
import type { Cliente } from './Cliente';

export interface LancamentoFinanceiro extends Registro<'financeiro'> {}

export type Parcelamento = { total: number; entrada: number; parcelas: number };

/** Receita (honorários, consultas...) ou despesa (custas, aluguel...). Valores em centavos. */
export class LancamentoFinanceiro extends Lancamento<'financeiro'> {
  static readonly tabela = 'financeiro';
  static readonly CATEGORIAS = {
    receita: ['Honorários contratuais', 'Honorários de êxito', 'Honorários de sucumbência', 'Consulta', 'Reembolso de despesas', 'Outra receita'],
    despesa: ['Custas processuais', 'Anuidade da OAB', 'Aluguel e condomínio', 'Software e internet', 'Deslocamento', 'Impostos', 'Outra despesa'],
  };

  /** Divide o total em entrada + parcelas; os centavos que sobram vão na 1ª parcela. */
  static dividir({ total, entrada, parcelas }: Parcelamento) {
    const resto = total - entrada;
    const base = Math.floor(resto / parcelas);
    return Array.from({ length: parcelas }, (_, i) => (i === 0 ? base + (resto - base * parcelas) : base));
  }

  /** Frase para conferir o contrato antes de lançar. */
  static simular(p: Parcelamento) {
    if (!p.total || p.parcelas < 1) return 'Informe o valor e as parcelas para ver a simulação.';
    if (p.entrada >= p.total) return 'A entrada precisa ser menor que o valor total.';
    const valores = LancamentoFinanceiro.dividir(p);
    const partes = p.entrada ? [`entrada de ${fMoeda(p.entrada)}`] : [];
    partes.push(p.parcelas === 1
      ? `parcela única de ${fMoeda(valores[0])}`
      : `${p.parcelas} parcelas de ${fMoeda(valores[1])}${valores[0] !== valores[1] ? ` (a primeira de ${fMoeda(valores[0])})` : ''}`);
    return `Total de ${fMoeda(p.total)}: ${partes.join(' e ')}.`;
  }

  /** Linhas do contrato de honorários: entrada (hoje) e parcelas mensais. */
  static contratoDeHonorarios(p: Parcelamento & { descricao: string; primeiroVencimento: string; entradaPaga: boolean; cliente_id: string; processo_id: string }) {
    const hoje = Data.hoje().iso;
    const base = { tipo: 'receita', categoria: 'Honorários contratuais', cliente_id: p.cliente_id, processo_id: p.processo_id };
    const linhas: Partial<Registro<'financeiro'>>[] = [];
    if (p.entrada) linhas.push({ ...base, descricao: `${p.descricao} – entrada`, valor_centavos: String(p.entrada), vencimento: hoje, pago_em: p.entradaPaga ? hoje : '' });
    LancamentoFinanceiro.dividir(p).forEach((valor, i) => linhas.push({
      ...base,
      descricao: p.parcelas > 1 ? `${p.descricao} – parcela ${i + 1}/${p.parcelas}` : p.descricao,
      valor_centavos: String(valor),
      vencimento: Data.de(p.primeiroVencimento).maisMeses(i).iso,
    }));
    return linhas;
  }

  get rotulo() { return this.descricao; }
  get valor() { return Number(this.valor_centavos) || 0; }
  get valorFormatado() { return fMoeda(this.valor); }
  get receita() { return this.tipo !== 'despesa'; }
  get pago() { return Boolean(this.pago_em); }
  get vence() { return Data.de(this.vencimento); }

  emAtraso(hoje = Data.hoje()) {
    return !this.pago && this.vencimento < hoje.iso;
  }

  /** Receita ainda não recebida, vencida até hoje. */
  honorarioEmAtraso(hoje = Data.hoje()) {
    return this.receita && this.emAtraso(hoje);
  }

  situacao(hoje = Data.hoje()) {
    if (this.pago) return { texto: `${this.receita ? 'Recebido' : 'Paga'} em ${Data.de(this.pago_em).formatada()}`, classe: 'ok' };
    if (this.emAtraso(hoje)) return { texto: 'Em atraso', classe: 'urgente' };
    return { texto: 'Em aberto', classe: '' };
  }

  /** Código Pix copia e cola deste valor (lança erro se a chave não estiver cadastrada). */
  pix(config: Config) {
    return gerarPix({
      chave: config.pix_chave, nome: config.pix_nome || config.adv_nome, cidade: config.pix_cidade || config.adv_cidade,
      centavos: this.valor, txid: `HON${this.id}`, descricao: this.descricao,
    });
  }

  mensagemDeCobranca(config: Config, cliente?: Cliente, pix?: string) {
    return [
      `Olá${cliente ? `, ${cliente.primeiroNome}` : ''}! Tudo bem?`,
      `Passando para lembrar do pagamento de ${this.descricao}, no valor de ${this.valorFormatado}, com vencimento em ${this.vence.formatada()}.`,
      pix ? `Segue o Pix copia e cola:\n${pix}` : '',
      `Qualquer dúvida, estou à disposição.\n${config.adv_nome}`,
    ].filter(Boolean).join('\n\n');
  }
}

/** Soma em centavos. */
export const somar = (ls: LancamentoFinanceiro[]) => ls.reduce((t, l) => t + l.valor, 0);
