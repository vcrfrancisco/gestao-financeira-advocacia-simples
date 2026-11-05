import type { Registro } from '@/lib/tabelas';
import { Lancamento } from './Lancamento';
import { Data } from './Data';
import type { Calendario, Contagem, TipoBase } from './Calendario';

export interface Prazo extends Registro<'prazos'> {}

export class Prazo extends Lancamento<'prazos'> {
  static readonly tabela = 'prazos';
  static readonly COMUNS: [string, [string, number, Contagem][]][] = [
    ['Cível (CPC)', [['Contestação', 15, 'uteis'], ['Réplica', 15, 'uteis'], ['Manifestação (prazo genérico)', 5, 'uteis'], ['Embargos de declaração', 5, 'uteis'], ['Apelação', 15, 'uteis'], ['Contrarrazões de apelação', 15, 'uteis'], ['Agravo de instrumento', 15, 'uteis'], ['Agravo interno', 15, 'uteis'], ['Recurso especial / extraordinário', 15, 'uteis'], ['Pagamento voluntário (cumprimento de sentença)', 15, 'uteis'], ['Impugnação ao cumprimento de sentença', 15, 'uteis'], ['Embargos à execução', 15, 'uteis']]],
    ['Juizados Especiais', [['Recurso inominado', 10, 'uteis'], ['Embargos de declaração (JEC)', 5, 'uteis']]],
    ['Trabalhista (CLT)', [['Recurso ordinário', 8, 'uteis'], ['Contrarrazões ao recurso ordinário', 8, 'uteis'], ['Embargos de declaração (trabalhista)', 5, 'uteis'], ['Recurso de revista', 8, 'uteis'], ['Agravo de petição', 8, 'uteis']]],
    ['Criminal (CPP, dias corridos)', [['Resposta à acusação', 10, 'corridos'], ['Apelação criminal (interposição)', 5, 'corridos'], ['Razões de apelação criminal', 8, 'corridos'], ['Recurso em sentido estrito', 5, 'corridos'], ['Embargos de declaração (criminal)', 2, 'corridos']]],
  ];

  get rotulo() { return this.descricao; }
  get vence() { return Data.de(this.data_fim); }
  get cumprido() { return this.status === 'cumprido'; }
  get manual() { return this.ajuste_manual === 'sim'; }

  /** Calcula e preenche início e vencimento a partir da data-base, ou usa o vencimento manual. */
  recalcular(calendario: Calendario, vencimentoManual = '') {
    if (Data.valida(vencimentoManual)) {
      Object.assign(this, { data_inicio: '', data_fim: vencimentoManual, ajuste_manual: 'sim' });
      return;
    }
    const r = calendario.calcularPrazo({ dataBase: this.data_base, tipoBase: this.tipo_base as TipoBase, dias: Number(this.dias), contagem: this.contagem as Contagem });
    Object.assign(this, { data_inicio: r.dataInicio, data_fim: r.dataFim, ajuste_manual: '' });
  }

  /** "vence em 3 dias, quinta-feira, 05/11/2026" ou "Cumprido em ..., vencia em ...". */
  situacao(hoje = Data.hoje()) {
    if (this.cumprido) return `Cumprido em ${Data.de(this.cumprido_em).formatada()}, vencia em ${this.vence.formatada()}`;
    return `${this.vence.textoVencimento(hoje)}, ${this.vence.nomeDoDia}, ${this.vence.formatada()}`;
  }

  /** Classe visual: 'feito', 'urgente', 'proximo' ou ''. */
  urgencia(hoje = Data.hoje()) {
    return this.cumprido ? 'feito' : this.vence.urgencia(hoje);
  }

  /** "15 dias úteis, a partir de disponibilização em 03/11/2026". */
  explicacao() {
    if (this.manual) return 'Data definida manualmente';
    if (!this.dias) return '';
    return `${this.dias} dias ${this.contagem === 'corridos' ? 'corridos' : 'úteis'}, a partir de ${this.tipo_base === 'ciencia' ? 'ciência em' : 'disponibilização em'} ${Data.de(this.data_base).formatada()}`;
  }
}
