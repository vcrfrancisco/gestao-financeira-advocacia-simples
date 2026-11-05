import { buscar, excluir, opcoesDoCalendario, salvar } from '@/lib/db';
import { Calendario } from '@/dominio/Calendario';
import { Data } from '@/dominio/Data';
import { Intimacao } from '@/dominio/Intimacao';
import { Prazo } from '@/dominio/Prazo';
import type { Registro } from '@/lib/tabelas';
import { Acoes, type Resultado } from './Acoes';

export class AcoesPrazo extends Acoes {
  static async salvar(fd: FormData): Promise<Resultado> {
    'use server';
    const id = AcoesPrazo.campo(fd, 'id');
    const anterior = id ? await buscar(Prazo, id) : undefined;
    const prazo = new Prazo({
      ...(anterior?.paraLinha() ?? { id: '', criado: '', status: 'pendente', cumprido_em: '', data_inicio: '', data_fim: '', ajuste_manual: '' }),
      ...AcoesPrazo.colunas(fd, Prazo, 'descricao', 'processo_id', 'intimacao_id', 'data_base', 'observacoes'),
      tipo_base: AcoesPrazo.campo(fd, 'tipo_base') === 'ciencia' ? 'ciencia' : 'disponibilizacao',
      contagem: AcoesPrazo.campo(fd, 'contagem') === 'corridos' ? 'corridos' : 'uteis',
      dias: String(Number.parseInt(AcoesPrazo.campo(fd, 'dias'), 10) || ''),
    } as Registro<'prazos'>);
    if (!prazo.descricao) return { erro: 'Descreva o prazo.' };
    const manual = AcoesPrazo.campo(fd, 'data_fim_manual');
    if (!Data.valida(manual)) {
      if (!Data.valida(prazo.data_base)) return { erro: 'Informe a data da publicação ou da intimação.' };
      if (!prazo.dias) return { erro: 'Informe a quantidade de dias.' };
    }
    try {
      prazo.recalcular(new Calendario(await opcoesDoCalendario()), manual);
    } catch (e) {
      return { erro: (e as Error).message };
    }

    const salvo = await salvar(Prazo, prazo.paraLinha());
    // Lançar o prazo encerra a análise da intimação de origem.
    if (!anterior && salvo.intimacao_id && (await buscar(Intimacao, salvo.intimacao_id))) await salvar(Intimacao, { id: salvo.intimacao_id, status: 'tratada' });
    AcoesPrazo.concluir(salvo.processo_id && !id ? `/processos/${salvo.processo_id}` : '/prazos', `Prazo salvo: vence em ${salvo.vence.formatada()}.`);
  }

  static async cumprir(fd: FormData) {
    'use server';
    await salvar(Prazo, { id: AcoesPrazo.campo(fd, 'id'), status: 'cumprido', cumprido_em: Data.hoje().iso });
    AcoesPrazo.atualizarTelas();
  }

  static async reabrir(fd: FormData) {
    'use server';
    await salvar(Prazo, { id: AcoesPrazo.campo(fd, 'id'), status: 'pendente', cumprido_em: '' });
    AcoesPrazo.atualizarTelas();
  }

  static async excluir(fd: FormData) {
    'use server';
    await excluir(Prazo, AcoesPrazo.campo(fd, 'id'));
    AcoesPrazo.concluir('/prazos', 'Prazo excluído.');
  }
}
