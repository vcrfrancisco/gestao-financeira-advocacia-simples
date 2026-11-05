import type { Registro } from '@/lib/tabelas';
import { Lancamento } from './Lancamento';
import { Data } from './Data';

export interface Evento extends Registro<'eventos'> {}

/** Compromisso da agenda: audiência, reunião, perícia... */
export class Evento extends Lancamento<'eventos'> {
  static readonly tabela = 'eventos';
  static readonly TIPOS: Record<string, string> = { audiencia: 'Audiência', reuniao: 'Reunião com cliente', pericia: 'Perícia', diligencia: 'Diligência', outro: 'Outro' };

  get rotulo() { return this.titulo; }
  get dia() { return Data.de(this.inicio); }
  get hora() { return this.inicio.slice(11, 16); }
  get horaFim() { return this.fim.slice(11, 16); }
  get rotuloTipo() { return Evento.TIPOS[this.tipo] ?? 'Compromisso'; }

  /** "Audiência, até 11:00, Fórum Lafayette" */
  detalhes() {
    return [this.rotuloTipo, this.horaFim && `até ${this.horaFim}`, this.local].filter(Boolean).join(', ');
  }
}
