import { buscar, excluir, listar, salvar } from '@/lib/db';
import { digitos } from '@/lib/formato';
import { Data } from '@/dominio/Data';
import { Intimacao } from '@/dominio/Intimacao';
import { Processo } from '@/dominio/Processo';
import { Acoes, type Resultado } from './Acoes';

export class AcoesIntimacao extends Acoes {
  static async registrar(fd: FormData): Promise<Resultado> {
    'use server';
    const data = AcoesIntimacao.campo(fd, 'data_disponibilizacao');
    if (!Data.valida(data)) return { erro: 'Informe a data.' };
    const numero = AcoesIntimacao.campo(fd, 'numero_processo');
    // Número digitado de um processo já cadastrado: vincula sozinho.
    const proc = (await buscar(Processo, AcoesIntimacao.campo(fd, 'processo_id')))
      ?? (digitos(numero).length === 20 ? (await listar(Processo)).find((p) => p.mesmoNumero(numero)) : undefined);
    const i = await salvar(Intimacao, {
      ...AcoesIntimacao.colunas(fd, Intimacao, 'tipo', 'texto'),
      origem: AcoesIntimacao.campo(fd, 'origem') === 'ciencia' ? 'ciencia' : 'disponibilizacao',
      data_disponibilizacao: data,
      tribunal: AcoesIntimacao.campo(fd, 'tribunal') || proc?.tribunal || '',
      numero_processo: proc?.numero || Processo.formatarCNJ(numero) || numero,
      processo_id: proc?.id ?? '',
      status: 'nova',
    });
    AcoesIntimacao.concluir(`/prazos/novo?intimacao=${i.id}`, 'Intimação registrada. Agora lance o prazo.');
  }

  static async arquivar(fd: FormData) {
    'use server';
    await salvar(Intimacao, { id: AcoesIntimacao.campo(fd, 'id'), status: 'tratada' });
    AcoesIntimacao.atualizarTelas();
  }

  static async reabrir(fd: FormData) {
    'use server';
    await salvar(Intimacao, { id: AcoesIntimacao.campo(fd, 'id'), status: 'nova' });
    AcoesIntimacao.atualizarTelas();
  }

  static async excluir(fd: FormData) {
    'use server';
    await excluir(Intimacao, AcoesIntimacao.campo(fd, 'id'));
    AcoesIntimacao.atualizarTelas();
  }
}
