import type { NextRequest } from 'next/server';
import { municipios } from '@/lib/feriadosBase';

// Municípios de uma UF que têm feriados na base (para o seletor em Ajustes).
export async function GET(req: NextRequest) {
  return Response.json(await municipios(req.nextUrl.searchParams.get('uf')?.toUpperCase().slice(0, 2) ?? ''));
}
