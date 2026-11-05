import { excluir, modificar, salvar } from '@/lib/db';
import { parseMoeda } from '@/lib/formato';
import { Andamento } from '@/dominio/Andamento';
import { Data } from '@/dominio/Data';
import { Documento } from '@/dominio/Documento';
import { Evento } from '@/dominio/Evento';
import { Intimacao } from '@/dominio/Intimacao';
import { LancamentoFinanceiro } from '@/dominio/LancamentoFinanceiro';
import { Prazo } from '@/dominio/Prazo';
import { Processo } from '@/dominio/Processo';
import { Acoes, type Resultado } from './Acoes';

/** Processos e seus andamentos. */
export class AcoesProcesso extends Acoes {
  static async salvar(fd: FormData): Promise<Resultado> {
    'use server';
    const numero = AcoesProcesso.campo(fd, 'numero');
    const cnj = Processo.formatarCNJ(numero);
    if (!numero && !AcoesProcesso.campo(fd, 'tipo_acao')) return { erro: 'Informe o número do processo ou o tipo de ação.' };
    const valor = parseMoeda(AcoesProcesso.campo(fd, 'valor_causa'));
    const p = await salvar(Processo, {
      ...AcoesProcesso.colunas(fd, Processo, 'id', 'cliente_id', 'polo', 'parte_contraria', 'tipo_acao', 'area', 'comarca', 'vara', 'fase', 'observacoes'),
      numero: cnj || numero,
      tribunal: AcoesProcesso.campo(fd, 'tribunal') || Processo.tribunalDoCNJ(numero),
      valor_causa_centavos: valor == null ? '' : String(valor),
      status: AcoesProcesso.campo(fd, 'status') || 'ativo',
    });
    // Intimações registradas antes do cadastro, com o mesmo número, passam a apontar para o processo.
    if (cnj) await modificar(Intimacao, (is) => is.map((i) => (!i.processo_id && p.mesmoNumero(i.numero_processo) ? Object.assign(i, { processo_id: p.id }) : i)));
    AcoesProcesso.concluir(`/processos/${p.id}`, cnj && !Processo.validarCNJ(cnj) ? 'Processo salvo. Atenção: o dígito verificador do número CNJ não confere.' : 'Processo salvo.');
  }

  static async excluir(fd: FormData) {
    'use server';
    const id = AcoesProcesso.campo(fd, 'id');
    // Sem id, os filtros abaixo apagariam tudo o que não tem processo vinculado.
    if (!id) return;
    // Prazos, andamentos e compromissos do processo saem junto; financeiro, intimações e documentos ficam, sem vínculo.
    await modificar(Prazo, (ls) => ls.filter((x) => x.processo_id !== id));
    await modificar(Andamento, (ls) => ls.filter((x) => x.processo_id !== id));
    await modificar(Evento, (ls) => ls.filter((x) => x.processo_id !== id));
    const desvincular = <L extends { processo_id: string }>(ls: L[]) => ls.map((x) => (x.processo_id === id ? Object.assign(x, { processo_id: '' }) : x));
    await modificar(LancamentoFinanceiro, desvincular);
    await modificar(Intimacao, desvincular);
    await modificar(Documento, desvincular);
    await excluir(Processo, id);
    AcoesProcesso.concluir('/processos', 'Processo excluído.');
  }

  static async registrarAndamento(fd: FormData): Promise<Resultado> {
    'use server';
    const andamento = AcoesProcesso.colunas(fd, Andamento, 'processo_id', 'data', 'descricao');
    if (!andamento.descricao) return { erro: 'Descreva o andamento.' };
    if (!Data.valida(andamento.data ?? '')) andamento.data = Data.hoje().iso;
    await salvar(Andamento, andamento);
    AcoesProcesso.atualizarTelas();
  }

  static async excluirAndamento(fd: FormData) {
    'use server';
    await excluir(Andamento, AcoesProcesso.campo(fd, 'id'));
    AcoesProcesso.atualizarTelas();
  }
}
