import type { Registro } from '@/lib/tabelas';
import { Lancamento } from './Lancamento';
import { Data } from './Data';
import type { Cliente } from './Cliente';
import type { Processo } from './Processo';

export interface Andamento extends Registro<'andamentos'> {}

export class Andamento extends Lancamento<'andamentos'> {
  static readonly tabela = 'andamentos';

  get rotulo() { return this.descricao; }
  get dia() { return Data.de(this.data); }

  /** Link do WhatsApp avisando o cliente deste andamento. */
  avisoAoCliente(processo: Processo, cliente?: Cliente) {
    return cliente?.whatsapp(`Olá, ${cliente.primeiroNome}! Atualização do seu processo${processo.numero ? ` ${processo.numero}` : ''}: ${this.descricao} (${this.dia.formatada()}).`) ?? null;
  }
}
