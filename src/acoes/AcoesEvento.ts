import { excluir, salvar } from '@/lib/db';
import { Data } from '@/dominio/Data';
import { Evento } from '@/dominio/Evento';
import { Acoes, type Resultado } from './Acoes';

const HORA = /^\d{2}:\d{2}$/;

/** Compromissos da agenda. */
export class AcoesEvento extends Acoes {
  static async salvar(fd: FormData): Promise<Resultado> {
    'use server';
    const data = AcoesEvento.campo(fd, 'data');
    const hora = AcoesEvento.campo(fd, 'hora');
    const fim = AcoesEvento.campo(fd, 'hora_fim');
    if (!AcoesEvento.campo(fd, 'titulo')) return { erro: 'Informe um título.' };
    if (!Data.valida(data) || !HORA.test(hora)) return { erro: 'Informe a data e o horário.' };
    await salvar(Evento, {
      ...AcoesEvento.colunas(fd, Evento, 'id', 'titulo', 'tipo', 'local', 'processo_id', 'observacoes'),
      inicio: `${data}T${hora}`,
      fim: HORA.test(fim) && fim > hora ? `${data}T${fim}` : '',
    });
    AcoesEvento.concluir('/agenda', 'Compromisso salvo.');
  }

  static async excluir(fd: FormData) {
    'use server';
    await excluir(Evento, AcoesEvento.campo(fd, 'id'));
    AcoesEvento.concluir('/agenda', 'Compromisso excluído.');
  }
}
