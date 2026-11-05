import { promises as fs } from 'node:fs';
import path from 'node:path';
import { buscar, excluir, lerConfig, salvar } from '@/lib/db';
import { driveConfigurado, enviarParaDrive } from '@/lib/drive';
import { Cliente } from '@/dominio/Cliente';
import { Documento, type Formato } from '@/dominio/Documento';
import { Modelo } from '@/dominio/Modelo';
import { Acoes, type Resultado } from './Acoes';

/** Modelos e documentos gerados a partir deles. */
export class AcoesDocumento extends Acoes {
  static async salvarModelo(fd: FormData): Promise<Resultado> {
    'use server';
    const nome = AcoesDocumento.campo(fd, 'nome');
    const conteudo = String(fd.get('conteudo') ?? '').replace(/\r\n/g, '\n');
    if (!nome || !conteudo.trim()) return { erro: 'Informe o nome e o texto.' };
    const m = await salvar(Modelo, { id: AcoesDocumento.campo(fd, 'id'), nome, conteudo });
    AcoesDocumento.concluir(`/documentos/gerar/${m.id}`, 'Modelo salvo.');
  }

  static async excluirModelo(fd: FormData) {
    'use server';
    await excluir(Modelo, AcoesDocumento.campo(fd, 'id'));
    AcoesDocumento.concluir('/documentos', 'Modelo excluído.');
  }

  /** Gera o arquivo, guarda em documentos/ e, se o conector estiver ligado, envia ao Google Drive. */
  static async gerar(fd: FormData): Promise<Resultado> {
    'use server';
    const texto = String(fd.get('texto') ?? '');
    if (!texto.trim()) return { erro: 'O documento está vazio.' };
    const formato: Formato = AcoesDocumento.campo(fd, 'formato') === 'txt' ? 'txt' : 'docx';
    const cliente = await buscar(Cliente, AcoesDocumento.campo(fd, 'cliente_id'));
    const nome = `${AcoesDocumento.campo(fd, 'nome_modelo')}${cliente ? ` - ${cliente.nome}` : ''}`;

    const conteudo = await Documento.conteudo(texto, formato);
    const arquivo = Documento.nomeDeArquivo(nome, formato);
    await fs.mkdir(Documento.PASTA, { recursive: true });
    await fs.writeFile(path.join(Documento.PASTA, arquivo), conteudo);
    const doc = await salvar(Documento, { nome, arquivo, cliente_id: cliente?.id ?? '', processo_id: AcoesDocumento.campo(fd, 'processo_id') });

    let aviso = 'Documento gerado e guardado na pasta "documentos".';
    if ((await lerConfig()).drive_ativo === 'sim' && driveConfigurado()) {
      try {
        await salvar(Documento, { id: doc.id, drive_link: await enviarParaDrive(doc.nomeParaBaixar, doc.mime, conteudo) });
        aviso = 'Documento gerado e enviado para o Google Drive.';
      } catch (e) {
        aviso = `Documento gerado, mas não foi possível enviar ao Google Drive (${(e as Error).message}). Ele continua guardado no computador.`;
      }
    }
    AcoesDocumento.concluir(`/documentos?novo=${doc.id}`, aviso);
  }

  static async excluir(fd: FormData) {
    'use server';
    const doc = await buscar(Documento, AcoesDocumento.campo(fd, 'id'));
    if (doc) {
      await fs.rm(doc.caminho, { force: true });
      await excluir(Documento, doc.id);
    }
    AcoesDocumento.atualizarTelas();
  }
}
