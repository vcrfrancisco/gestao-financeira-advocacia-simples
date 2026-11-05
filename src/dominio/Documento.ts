import path from 'node:path';
import { AlignmentType, Document, Packer, Paragraph, TextRun } from 'docx';
import { semAcentos } from '@/lib/formato';
import type { Registro } from '@/lib/tabelas';
import { Lancamento } from './Lancamento';

export const FORMATOS = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain; charset=utf-8',
} as const;
export type Formato = keyof typeof FORMATOS;

export interface Documento extends Registro<'documentos'> {}

/** Documento gerado a partir de um modelo, guardado em documentos/ (e no Drive, se ligado). */
export class Documento extends Lancamento<'documentos'> {
  static readonly tabela = 'documentos';
  /** Onde os arquivos gerados ficam guardados no computador. */
  static readonly PASTA = path.join(process.cwd(), 'documentos');

  /** Conteúdo do arquivo no formato pedido. */
  static async conteudo(texto: string, formato: Formato): Promise<Buffer> {
    const linhas = texto.replace(/\r\n/g, '\n').split('\n');
    if (formato === 'txt') return Buffer.from(linhas.map((l) => l.replace(/^# /, '').replace(/\*\*([^*]+)\*\*/g, '$1')).join('\r\n'), 'utf8');
    return Packer.toBuffer(Documento.docx(linhas));
  }

  /** Nome de arquivo sem acentos nem símbolos, único pelo carimbo de tempo. */
  static nomeDeArquivo(nome: string, formato: Formato) {
    const base = semAcentos(nome).replace(/[^A-Za-z0-9 -]+/g, '').trim().replace(/\s+/g, '-').slice(0, 80) || 'documento';
    return `${base}-${Date.now().toString(36)}.${formato}`;
  }

  // Regras do texto dos modelos: "# " = título centralizado em negrito, **x** = negrito,
  // linha com "_____" = assinatura centralizada (e a linha seguinte, o nome, também).
  private static docx(linhas: string[]) {
    const trechos = (linha: string, negrito = false) => linha.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((t) => {
      const b = /^\*\*[^*]+\*\*$/.test(t);
      return new TextRun({ text: b ? t.slice(2, -2) : t, bold: b || negrito });
    });
    let aposAssinatura = false;
    const paragrafos = linhas.map((l) => {
      if (l.startsWith('# ')) {
        aposAssinatura = false;
        return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: trechos(l.slice(2).trim(), true) });
      }
      if (!l.trim()) { aposAssinatura = false; return new Paragraph({}); }
      const centro = /^_{5,}/.test(l.trim()) || aposAssinatura;
      aposAssinatura = centro;
      return new Paragraph({
        alignment: centro ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
        indent: centro ? undefined : { firstLine: 709 },
        spacing: { after: centro ? 0 : 120, line: 360 },
        children: trechos(l),
      });
    });
    return new Document({
      styles: { default: { document: { run: { font: 'Times New Roman', size: 24 } } } },
      // A4 com margens de 3 cm (superior/esquerda) e 2 cm (inferior/direita).
      sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1701, right: 1134, bottom: 1134, left: 1701 } } }, children: paragrafos }],
    });
  }

  get rotulo() { return this.nome; }
  get formato(): Formato { return this.arquivo.endsWith('.txt') ? 'txt' : 'docx'; }
  get mime() { return FORMATOS[this.formato]; }
  get nomeParaBaixar() { return `${this.nome}.${this.formato}`; }
  get noDrive() { return Boolean(this.drive_link); }
  /** Caminho do arquivo em documentos/ (basename impede sair da pasta). */
  get caminho() { return path.join(Documento.PASTA, path.basename(this.arquivo)); }
}
