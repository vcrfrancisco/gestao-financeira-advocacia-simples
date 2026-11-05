import type { Registro } from '@/lib/tabelas';
import { digitos } from '@/lib/formato';
import { Lancamento } from './Lancamento';

const UFS: Record<string, string> = { '01': 'AC', '02': 'AL', '03': 'AP', '04': 'AM', '05': 'BA', '06': 'CE', '07': 'DF', '08': 'ES', '09': 'GO', '10': 'MA', '11': 'MT', '12': 'MS', '13': 'MG', '14': 'PA', '15': 'PB', '16': 'PR', '17': 'PE', '18': 'PI', '19': 'RJ', '20': 'RN', '21': 'RS', '22': 'RO', '23': 'RR', '24': 'SC', '25': 'SE', '26': 'SP', '27': 'TO' };

export interface Processo extends Registro<'processos'> {}

export class Processo extends Lancamento<'processos'> {
  static readonly tabela = 'processos';
  static readonly AREAS = ['Cível', 'Consumidor', 'Família e Sucessões', 'Trabalhista', 'Previdenciário', 'Criminal', 'Tributário', 'Administrativo', 'Empresarial', 'Outra'];
  static readonly FASES = ['Pré-processual', 'Conhecimento', 'Recursal', 'Cumprimento de sentença / Execução', 'Encerrado'];
  static readonly STATUS: Record<string, string> = { ativo: 'Ativo', suspenso: 'Suspenso', arquivado: 'Arquivado' };
  static readonly POLOS: Record<string, string> = { ativo: 'Autor / requerente', passivo: 'Réu / requerido', terceiro: 'Terceiro / outro' };

  /** 20 dígitos no formato NNNNNNN-DD.AAAA.J.TR.OOOO, ou null. */
  static formatarCNJ(n: string) {
    const d = digitos(n);
    return d.length === 20 ? `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13, 14)}.${d.slice(14, 16)}.${d.slice(16)}` : null;
  }

  /** Confere o dígito verificador (módulo 97, Resolução CNJ 65/2008). */
  static validarCNJ(n: string) {
    const d = digitos(n);
    if (d.length !== 20) return false;
    const dv = 98n - (BigInt(d.slice(0, 7) + d.slice(9) + '00') % 97n);
    return String(dv).padStart(2, '0') === d.slice(7, 9);
  }

  /** Tribunal pelo segmento de justiça (J) e tribunal (TR) do número. */
  static tribunalDoCNJ(n: string) {
    const d = digitos(n);
    if (d.length !== 20) return '';
    const j = d[13], tr = d.slice(14, 16), uf = UFS[tr];
    if (j === '1') return 'STF';
    if (j === '3') return 'STJ';
    if (j === '4') return `TRF${Number(tr)}`;
    if (j === '5') return tr === '00' ? 'TST' : `TRT${Number(tr)}`;
    if (j === '6') return tr === '00' ? 'TSE' : (uf ? `TRE-${uf}` : '');
    if (j === '8') return uf ? (tr === '07' ? 'TJDFT' : `TJ${uf}`) : '';
    return '';
  }

  get rotulo() { return this.numero || this.tipo_acao || 'Processo'; }
  get ativo() { return this.status === 'ativo'; }
  get arquivado() { return this.status === 'arquivado'; }
  get rotuloStatus() { return Processo.STATUS[this.status] ?? ''; }
  get rotuloPolo() { return Processo.POLOS[this.polo] ?? ''; }

  mesmoNumero(outro: string) {
    return Boolean(this.numero) && digitos(this.numero) === digitos(outro);
  }
}
