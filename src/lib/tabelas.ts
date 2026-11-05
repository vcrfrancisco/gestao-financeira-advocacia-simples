// Cada tabela é um arquivo CSV em data/<nome>.csv, com estas colunas, nesta ordem.
// Tudo é texto: datas em dd/mm/aaaa (compromissos: dd/mm/aaaa hh:mm), valores em centavos,
// campos vazios = sem valor. Dentro do programa as datas circulam como AAAA-MM-DD (ver db.ts).
export const TABELAS = {
  clientes: ['id', 'criado', 'tipo', 'nome', 'cpf_cnpj', 'rg', 'nacionalidade', 'estado_civil', 'profissao', 'telefone', 'email', 'endereco', 'observacoes'],
  processos: ['id', 'criado', 'numero', 'cliente_id', 'polo', 'parte_contraria', 'tipo_acao', 'area', 'tribunal', 'comarca', 'vara', 'valor_causa_centavos', 'fase', 'status', 'observacoes'],
  andamentos: ['id', 'criado', 'processo_id', 'data', 'descricao'],
  prazos: ['id', 'criado', 'descricao', 'processo_id', 'intimacao_id', 'data_base', 'tipo_base', 'dias', 'contagem', 'data_inicio', 'data_fim', 'ajuste_manual', 'status', 'cumprido_em', 'observacoes'],
  intimacoes: ['id', 'criado', 'origem', 'data_disponibilizacao', 'tipo', 'tribunal', 'numero_processo', 'processo_id', 'texto', 'status'],
  eventos: ['id', 'criado', 'titulo', 'tipo', 'inicio', 'fim', 'local', 'processo_id', 'observacoes'],
  financeiro: ['id', 'criado', 'tipo', 'descricao', 'categoria', 'valor_centavos', 'vencimento', 'pago_em', 'cliente_id', 'processo_id'],
  modelos: ['id', 'criado', 'nome', 'conteudo'],
  feriados: ['id', 'criado', 'data', 'descricao'],
  documentos: ['id', 'criado', 'nome', 'arquivo', 'cliente_id', 'processo_id', 'drive_link'],
} as const;

/** Colunas gravadas como data dd/mm/aaaa no CSV. */
export const COLUNAS_DATA: ReadonlySet<string> = new Set(['data', 'data_base', 'data_inicio', 'data_fim', 'cumprido_em', 'data_disponibilizacao', 'inicio', 'fim', 'vencimento', 'pago_em']);

export type Tabela = keyof typeof TABELAS;
export type Registro<T extends Tabela> = Record<(typeof TABELAS)[T][number], string>;

// Ajustes ficam em data/config.csv, uma linha por chave (chave;valor).
export const CHAVES_CONFIG = ['adv_nome', 'adv_oab', 'adv_uf', 'adv_email', 'adv_cidade', 'adv_endereco', 'pix_chave', 'pix_nome', 'pix_cidade', 'feriados_uf', 'feriados_municipio', 'feriados_opcionais', 'recesso', 'drive_ativo', 'drive_pasta_id'] as const;
export type Config = Record<(typeof CHAVES_CONFIG)[number], string>;

/** Linha com todas as colunas vazias, para formulários de cadastro novo. */
export const linhaVazia = <T extends Tabela>(t: T, valores: Partial<Registro<T>> = {}) =>
  ({ ...Object.fromEntries(TABELAS[t].map((c) => [c, ''])), ...valores }) as Registro<T>;
