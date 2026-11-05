import type { Registro } from '@/lib/tabelas';
import { Lancamento } from './Lancamento';
import { Data } from './Data';

export interface Feriado extends Registro<'feriados'> {}

/** Feriado local ou suspensão de expediente cadastrado à mão (soma-se à base do feriados.dev). */
export class Feriado extends Lancamento<'feriados'> {
  static readonly tabela = 'feriados';

  get rotulo() { return this.descricao; }
  get dia() { return Data.de(this.data); }
}
