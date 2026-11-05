import { excluir, salvar, salvarConfig } from '@/lib/db';
import { digitos } from '@/lib/formato';
import { desconectar } from '@/lib/drive';
import { Data } from '@/dominio/Data';
import { Feriado } from '@/dominio/Feriado';
import { Acoes, type Resultado } from './Acoes';

/** Dados do advogado, Pix, calendário de feriados e conector do Google Drive. */
export class AcoesAjustes extends Acoes {
  static async salvar(fd: FormData): Promise<Resultado> {
    'use server';
    const campo = (k: string) => AcoesAjustes.campo(fd, k);
    await salvarConfig({
      adv_nome: campo('adv_nome'), adv_email: campo('adv_email'), adv_cidade: campo('adv_cidade'), adv_endereco: campo('adv_endereco'),
      adv_oab: digitos(campo('adv_oab')), adv_uf: campo('adv_uf').toUpperCase().slice(0, 2),
      pix_chave: campo('pix_chave'), pix_nome: campo('pix_nome'), pix_cidade: campo('pix_cidade'),
      feriados_uf: campo('feriados_uf'),
      // Município só vale se for da UF escolhida (código "UF-nome").
      feriados_municipio: campo('feriados_municipio').startsWith(`${campo('feriados_uf')}-`) ? campo('feriados_municipio') : '',
      feriados_opcionais: fd.getAll('feriados_opcionais').join(','),
      recesso: fd.get('recesso') ? 'sim' : 'nao',
    });
    AcoesAjustes.concluir('/ajustes', 'Ajustes salvos.');
  }

  static async adicionarFeriado(fd: FormData): Promise<Resultado> {
    'use server';
    const feriado = AcoesAjustes.colunas(fd, Feriado, 'data', 'descricao');
    if (!Data.valida(feriado.data ?? '') || !feriado.descricao) return { erro: 'Informe a data e a descrição.' };
    await salvar(Feriado, feriado);
    AcoesAjustes.concluir('/ajustes', 'Feriado adicionado. Prazos novos já consideram essa data.');
  }

  static async removerFeriado(fd: FormData) {
    'use server';
    await excluir(Feriado, AcoesAjustes.campo(fd, 'id'));
    AcoesAjustes.atualizarTelas();
  }

  /** Liga/desliga o envio de documentos para o Google Drive. */
  static async alternarDrive(fd: FormData) {
    'use server';
    const ativo = AcoesAjustes.campo(fd, 'ativo') === 'sim';
    await salvarConfig({ drive_ativo: ativo ? 'sim' : 'nao' });
    AcoesAjustes.concluir('/ajustes', ativo ? 'Envio para o Google Drive ligado.' : 'Envio para o Google Drive desligado. Os documentos ficam só no computador.');
  }

  static async desconectarDrive() {
    'use server';
    await desconectar();
    AcoesAjustes.concluir('/ajustes', 'Conta Google desconectada.');
  }
}
