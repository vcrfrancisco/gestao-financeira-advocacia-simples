import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { driveConfigurado, urlConsentimento } from '@/lib/drive';

// Início do OAuth2: manda para a tela de permissão do Google com um "state" contra CSRF.
export async function GET() {
  if (!driveConfigurado()) {
    redirect(`/ajustes?msg=${encodeURIComponent('Falta configurar o acesso ao Google (arquivo .env.local). Veja o LEIA-ME.txt.')}`);
  }
  const state = randomBytes(16).toString('hex');
  (await cookies()).set('google_state', state, { httpOnly: true, sameSite: 'lax', maxAge: 600, path: '/' });
  redirect(urlConsentimento(state));
}
