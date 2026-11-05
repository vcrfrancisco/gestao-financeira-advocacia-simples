import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { salvarConfig } from '@/lib/db';
import { trocarCodigo } from '@/lib/drive';

const voltar = (msg: string): never => redirect(`/ajustes?msg=${encodeURIComponent(msg)}`);

// Retorno do Google: confere o "state", troca o código pelos tokens e liga o envio.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const jar = await cookies();
  const esperado = jar.get('google_state')?.value;
  jar.delete('google_state');

  const code = q.get('code');
  if (q.get('error') || !code || !esperado || q.get('state') !== esperado) voltar('A conexão com o Google não foi concluída. Tente de novo.');

  let ok = true;
  try {
    await trocarCodigo(code!);
  } catch {
    ok = false;
  }
  if (!ok) voltar('O Google recusou a conexão. Confira o ID e a chave do cliente no .env.local.');

  await salvarConfig({ drive_ativo: 'sim' });
  voltar('Conta Google conectada. Os próximos documentos irão para o Drive.');
}
