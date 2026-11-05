import { TABELAS, type Registro, type Tabela } from '@/lib/tabelas';
import { Data } from './Data';

/**
 * Classe-pai de tudo o que é lançado no sistema (processo, prazo, intimação, financeiro...).
 * Cada filha corresponde a um CSV em data/ e traz os comportamentos daquele tipo de registro.
 *
 * As colunas viram propriedades: cada filha declara `interface Filha extends Registro<'tabela'> {}`
 * junto da classe, e o TypeScript junta as duas (declaration merging).
 */
export abstract class Lancamento<T extends Tabela = Tabela> {
  declare id: string;
  declare criado: string;

  constructor(linha: Registro<T>) {
    Object.assign(this, linha);
  }

  /** Nome curto para mostrar em listas, títulos e mensagens. */
  abstract get rotulo(): string;

  get criadoEm() {
    return Data.local(new Date(this.criado));
  }

  /** Volta ao formato de linha do CSV (só as colunas da tabela, todas como texto). */
  paraLinha(): Registro<T> {
    const { tabela } = this.constructor as unknown as { tabela: T };
    const self = this as unknown as Record<string, string>;
    return Object.fromEntries(TABELAS[tabela].map((c) => [c, self[c] ?? ''])) as Registro<T>;
  }
}

/** O que o repositório (lib/db.ts) precisa saber de cada classe filha. */
export type ClasseDeLancamento<T extends Tabela, L extends Lancamento<T>> = {
  new (linha: Registro<T>): L;
  readonly tabela: T;
};
