import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { auth, drive } from '@googleapis/drive';
import { lerConfig, salvarConfig } from './db';

// Escopo mínimo: o app só enxerga os arquivos que ele mesmo criou no Drive.
const ESCOPO = 'https://www.googleapis.com/auth/drive.file';
const NOME_PASTA = 'Escritório – Documentos';
const ARQUIVO_TOKEN = path.join(process.cwd(), 'data', 'google-token.json');

export const driveConfigurado = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

const clienteOAuth = () => new auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/google/callback',
);

export const urlConsentimento = (state: string) =>
  clienteOAuth().generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: [ESCOPO], state });

export async function trocarCodigo(code: string) {
  const { tokens } = await clienteOAuth().getToken(code);
  await fs.mkdir(path.dirname(ARQUIVO_TOKEN), { recursive: true });
  await fs.writeFile(ARQUIVO_TOKEN, JSON.stringify(tokens), { mode: 0o600 });
}

async function lerTokens() {
  try {
    return JSON.parse(await fs.readFile(ARQUIVO_TOKEN, 'utf8'));
  } catch {
    return null;
  }
}

export const driveConectado = async () => Boolean(await lerTokens());

export async function desconectar() {
  const tokens = await lerTokens();
  if (tokens?.refresh_token) await clienteOAuth().revokeToken(tokens.refresh_token).catch(() => {});
  await fs.rm(ARQUIVO_TOKEN, { force: true });
  await salvarConfig({ drive_pasta_id: '' });
}

/** Envia um arquivo para a pasta do escritório no Drive e devolve o link para abri-lo. */
export async function enviarParaDrive(nome: string, mimeType: string, conteudo: Buffer) {
  const tokens = await lerTokens();
  if (!tokens) throw new Error('conecte sua conta Google em Ajustes');
  const oauth = clienteOAuth();
  oauth.setCredentials(tokens);
  // O Google renova o acesso sozinho; guardamos o token novo para a próxima vez.
  oauth.on('tokens', (novos) => { fs.writeFile(ARQUIVO_TOKEN, JSON.stringify({ ...tokens, ...novos }), { mode: 0o600 }).catch(() => {}); });
  const api = drive({ version: 'v3', auth: oauth });

  let pasta = (await lerConfig()).drive_pasta_id;
  if (pasta) {
    // Só 404 quer dizer "pasta apagada"; outra falha (rede, 5xx) não pode criar uma pasta duplicada.
    const atual = await api.files.get({ fileId: pasta, fields: 'trashed' }).catch((e) => {
      if (e?.response?.status === 404) return null;
      throw e;
    });
    if (!atual || atual.data.trashed) pasta = '';
  }
  if (!pasta) {
    const criada = await api.files.create({ requestBody: { name: NOME_PASTA, mimeType: 'application/vnd.google-apps.folder' }, fields: 'id' });
    pasta = criada.data.id!;
    await salvarConfig({ drive_pasta_id: pasta });
  }

  const r = await api.files.create({
    requestBody: { name: nome, parents: [pasta] },
    media: { mimeType, body: Readable.from(conteudo) },
    fields: 'webViewLink',
  });
  return r.data.webViewLink ?? '';
}
