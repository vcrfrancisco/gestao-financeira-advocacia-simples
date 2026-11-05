import { promises as fs } from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';
import type { OpcoesCalendario } from '@/dominio/Calendario';
import type { Feriado } from '@/dominio/Feriado';
import type { Config } from './tabelas';

// Base de feriados nacionais, estaduais e municipais exportada do projeto feriados.dev
// (github.com/feriados-dev/feriados-dev-oss, licença MIT). Só leitura; feriados locais
// extras continuam em data/feriados.csv.
type FeriadoBase = { data: string; nome: string; abrangencia: 'nacional' | 'estadual' | 'municipal'; local: string; local_nome: string };

let base: Promise<FeriadoBase[]> | null = null;
const carregarBase = () => (base ??= fs.readFile(path.join(process.cwd(), 'src', 'dados', 'feriados-base.csv'), 'utf8')
  .then((t) => Papa.parse<FeriadoBase>(t.replace(/^﻿/, ''), { header: true, skipEmptyLines: true, delimiter: ';' }).data));

/** Locais da base: UFs (código "MG") ou municípios de uma UF (código "MG-belo-horizonte"). */
async function locais(filtro: (codigo: string) => boolean) {
  const vistos = new Map<string, string>();
  for (const f of await carregarBase()) if (filtro(f.local)) vistos.set(f.local, f.local_nome);
  return [...vistos].map(([codigo, nome]) => ({ codigo, nome })).sort((a, b) => a.nome.localeCompare(b.nome));
}

export const estados = () => locais((c) => c.length === 2 && c !== 'BR');
export const municipios = (uf: string) => (uf ? locais((c) => c.startsWith(`${uf}-`)) : Promise.resolve([]));

export async function anosCobertos() {
  const anos = (await carregarBase()).map((f) => Number(f.data.slice(0, 4)));
  return { de: Math.min(...anos), ate: Math.max(...anos) };
}

/**
 * Feriados do escritório: base (Brasil + UF + município escolhidos) + cadastrados à mão.
 * Pontos facultativos da base não contam: quem decide é o admin, cadastrando-os em Ajustes.
 */
export async function opcoesCalendario(config: Config, cadastrados: Feriado[]): Promise<OpcoesCalendario> {
  const alvo = new Set(['BR', config.feriados_uf, config.feriados_municipio].filter(Boolean));
  const daBase = (await carregarBase())
    .filter((f) => alvo.has(f.local) && !/ponto facultativo/i.test(f.nome))
    .map((f) => ({ data: f.data, descricao: f.nome }));
  return {
    opcionais: config.feriados_opcionais.split(',').filter(Boolean),
    recesso: config.recesso !== 'nao',
    feriados: [...daBase, ...cadastrados.map((f) => ({ data: f.data, descricao: f.descricao }))],
  };
}
