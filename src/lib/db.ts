import { promises as fs } from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';
import { cache } from 'react';
import { CHAVES_CONFIG, COLUNAS_DATA, TABELAS, type Config, type Registro, type Tabela } from './tabelas';
import type { ClasseDeLancamento, Lancamento } from '@/dominio/Lancamento';
import { Data } from '@/dominio/Data';
import { Cliente } from '@/dominio/Cliente';
import { Processo } from '@/dominio/Processo';
import { Andamento } from '@/dominio/Andamento';
import { Prazo } from '@/dominio/Prazo';
import { Intimacao } from '@/dominio/Intimacao';
import { Evento } from '@/dominio/Evento';
import { LancamentoFinanceiro } from '@/dominio/LancamentoFinanceiro';
import { Modelo } from '@/dominio/Modelo';
import { Feriado } from '@/dominio/Feriado';
import { Documento } from '@/dominio/Documento';
import { opcoesCalendario } from './feriadosBase';

// Ponto e vírgula + BOM: o Excel em português abre o arquivo já separado em colunas e com acentos.
const PASTA = path.join(process.cwd(), 'data');
const SEPARADOR = ';';
const arquivo = (nome: string) => path.join(PASTA, `${nome}.csv`);

async function lerCSV(caminho: string): Promise<Record<string, string>[]> {
  let texto: string;
  try {
    texto = await fs.readFile(caminho, 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw e;
  }
  return Papa.parse<Record<string, string>>(texto.replace(/^﻿/, ''), { header: true, skipEmptyLines: true, delimiter: SEPARADOR }).data;
}

async function escreverCSV(nome: string, colunas: readonly string[], linhas: Record<string, string>[]) {
  await fs.mkdir(PASTA, { recursive: true });
  const celula = (l: Record<string, string>, c: string) => (COLUNAS_DATA.has(c) ? Data.paraCSV(l[c] ?? '') : l[c] ?? '');
  const csv = Papa.unparse({ fields: [...colunas], data: linhas.map((l) => colunas.map((c) => celula(l, c))) }, { delimiter: SEPARADOR, newline: '\r\n' });
  // Grava num arquivo temporário e troca: se faltar luz no meio, o CSV antigo continua inteiro.
  const tmp = `${arquivo(nome)}.tmp`;
  await fs.writeFile(tmp, `﻿${csv}\r\n`, 'utf8');
  await fs.rename(tmp, arquivo(nome));
}

// Uma gravação por vez, para duas abas abertas não sobrescreverem uma à outra.
let fila: Promise<unknown> = Promise.resolve();
function emFila<R>(fn: () => Promise<R>): Promise<R> {
  const p = fila.then(fn);
  fila = p.catch(() => {});
  return p;
}

const normalizar = <T extends Tabela>(t: T, l: Record<string, string>) =>
  Object.fromEntries(TABELAS[t].map((c) => [c, COLUNAS_DATA.has(c) ? Data.doCSV(l[c] ?? '') : l[c] ?? ''])) as Registro<T>;

const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export async function listar<T extends Tabela, L extends Lancamento<T>>(C: ClasseDeLancamento<T, L>): Promise<L[]> {
  return (await lerCSV(arquivo(C.tabela))).map((l) => new C(normalizar(C.tabela, l)));
}

export async function buscar<T extends Tabela, L extends Lancamento<T>>(C: ClasseDeLancamento<T, L>, id: string): Promise<L | undefined> {
  return id ? (await listar(C)).find((r) => r.id === id) : undefined;
}

/** Lê a tabela, aplica a alteração e grava, tudo dentro da fila. */
export function modificar<T extends Tabela, L extends Lancamento<T>>(C: ClasseDeLancamento<T, L>, fn: (itens: L[]) => L[]) {
  return emFila(async () => escreverCSV(C.tabela, TABELAS[C.tabela], fn(await listar(C)).map((i) => i.paraLinha())));
}

/** Cria (id vazio) ou atualiza (id existente) registros; campos não informados são mantidos. */
export async function salvarVarios<T extends Tabela, L extends Lancamento<T>>(C: ClasseDeLancamento<T, L>, lista: Partial<Registro<T>>[]): Promise<L[]> {
  const salvos: L[] = [];
  await modificar(C, (itens) => {
    for (const { id, criado: _, ...campos } of lista as Partial<Record<string, string>>[]) {
      const i = id ? itens.findIndex((x) => x.id === id) : -1;
      if (id && i < 0) throw new Error('Este registro não existe mais. Recarregue a página.');
      const base = i >= 0 ? itens[i].paraLinha() : { id: novoId(), criado: new Date().toISOString() };
      const item = new C(normalizar(C.tabela, { ...base, ...campos } as Record<string, string>));
      if (i >= 0) itens[i] = item; else itens.push(item);
      salvos.push(item);
    }
    return itens;
  });
  return salvos;
}

export const salvar = <T extends Tabela, L extends Lancamento<T>>(C: ClasseDeLancamento<T, L>, dados: Partial<Registro<T>>) =>
  salvarVarios(C, [dados]).then((r) => r[0]);

export const excluir = <T extends Tabela, L extends Lancamento<T>>(C: ClasseDeLancamento<T, L>, id: string) =>
  modificar(C, (itens) => itens.filter((x) => x.id !== id));

export async function lerConfig(): Promise<Config> {
  const c = Object.fromEntries(CHAVES_CONFIG.map((k) => [k, ''])) as Config;
  for (const l of await lerCSV(arquivo('config'))) if (l.chave in c) c[l.chave as keyof Config] = l.valor ?? '';
  return c;
}

export function salvarConfig(patch: Partial<Config>) {
  return emFila(async () => {
    const c = { ...(await lerConfig()), ...patch };
    await escreverCSV('config', ['chave', 'valor'], CHAVES_CONFIG.map((k) => ({ chave: k, valor: c[k] })));
  });
}

/** Opções do calendário forense do escritório (feriados da base + cadastrados + ajustes). */
export const opcoesDoCalendario = async () => opcoesCalendario(await lerConfig(), await listar(Feriado));

/** Tudo o que as telas precisam, lido de uma vez, com buscas por id (uma leitura por requisição: layout e página dividem). */
export const carregar = cache(async () => {
  const [config, clientes, processos, andamentos, prazos, intimacoes, eventos, financeiro, modelos, feriados, documentos] = await Promise.all([
    lerConfig(), listar(Cliente), listar(Processo), listar(Andamento), listar(Prazo), listar(Intimacao),
    listar(Evento), listar(LancamentoFinanceiro), listar(Modelo), listar(Feriado), listar(Documento),
  ]);
  const mClientes = new Map(clientes.map((c) => [c.id, c]));
  const mProcessos = new Map(processos.map((p) => [p.id, p]));
  return {
    config, clientes, processos, andamentos, prazos, intimacoes, eventos, financeiro, feriados, documentos,
    /** Modelos que vêm com o sistema + os do usuário, em ordem alfabética. */
    modelos: [...Modelo.PADRAO, ...modelos.sort((a, b) => a.nome.localeCompare(b.nome))],
    cliente: (id: string) => mClientes.get(id),
    processo: (id: string) => mProcessos.get(id),
    /** Opções do calendário forense (serializáveis, para o cálculo de prazos no navegador). */
    calendario: () => opcoesCalendario(config, feriados),
  };
});
export type Dados = Awaited<ReturnType<typeof carregar>>;
