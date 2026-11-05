import { promises as fs } from 'node:fs';
import { buscar } from '@/lib/db';
import { Documento } from '@/dominio/Documento';

// Baixa um documento gerado, guardado em documentos/.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const doc = await buscar(Documento, (await params).id);
  if (!doc) return new Response('Documento não encontrado.', { status: 404 });
  let dados: Buffer;
  try {
    dados = await fs.readFile(doc.caminho);
  } catch {
    return new Response('O arquivo foi apagado da pasta "documentos".', { status: 404 });
  }
  return new Response(new Uint8Array(dados), {
    headers: {
      'Content-Type': doc.mime,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(doc.nomeParaBaixar)}`,
    },
  });
}
