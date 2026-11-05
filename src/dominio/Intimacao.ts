import type { Registro } from '@/lib/tabelas';
import { Lancamento } from './Lancamento';
import { Data } from './Data';
import type { TipoBase } from './Calendario';

export interface Intimacao extends Registro<'intimacoes'> {}

export class Intimacao extends Lancamento<'intimacoes'> {
  static readonly tabela = 'intimacoes';
  static readonly ASSUNTOS = ['Citação', 'Despacho', 'Decisão', 'Sentença', 'Acórdão', 'Intimação para audiência'];

  get rotulo() { return this.tipo || 'Comunicação'; }
  get dia() { return Data.de(this.data_disponibilizacao); }
  get pendente() { return this.status !== 'tratada'; }

  /** De onde o prazo lançado a partir desta intimação começa a contar. */
  get tipoBase(): TipoBase { return this.origem === 'ciencia' ? 'ciencia' : 'disponibilizacao'; }

  /** "Disponibilizada em 03/11/2026, terça-feira" */
  quando() {
    return `${this.origem === 'ciencia' ? 'Ciência' : 'Disponibilizada'} em ${this.dia.formatada()}, ${this.dia.nomeDoDia}`;
  }
}
