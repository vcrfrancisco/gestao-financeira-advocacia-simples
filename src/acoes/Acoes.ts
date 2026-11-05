import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { ClasseDeLancamento, Lancamento } from '@/dominio/Lancamento';
import type { Registro, Tabela, TABELAS } from '@/lib/tabelas';

/** Resposta de uma ação de formulário: só volta quando há erro para mostrar; no sucesso, redireciona. */
export type Resultado = { erro: string } | void;

/**
 * Classe-pai das ações (gravações) de cada domínio.
 *
 * Cada ação é um método estático com a diretiva 'use server': o Next a registra como
 * Server Action e ela pode ir direto no `action` de um <form>. Regras que o Next impõe:
 * - métodos de instância não podem ser Server Actions, por isso tudo é `static`;
 * - a ação é chamada solta (sem `this`), então use o nome da classe: `AcoesPrazo.campo(...)`;
 * - componentes 'use client' não importam estas classes: recebem a ação por props.
 */
export abstract class Acoes {
  protected static campo(fd: FormData, k: string) {
    return String(fd.get(k) ?? '').trim();
  }

  /** Lê do formulário as colunas pedidas, já com os nomes e o tipo da tabela do domínio. */
  protected static colunas<T extends Tabela, L extends Lancamento<T>>(
    fd: FormData, _: ClasseDeLancamento<T, L>, ...nomes: (typeof TABELAS)[T][number][]
  ): Partial<Registro<T>> {
    return Object.fromEntries(nomes.map((k) => [k, Acoes.campo(fd, k)])) as Partial<Registro<T>>;
  }

  /** Atualiza todas as telas e vai para `destino`, mostrando `msg` como aviso. */
  protected static concluir(destino: string, msg: string): never {
    revalidatePath('/', 'layout');
    redirect(`${destino}${destino.includes('?') ? '&' : '?'}msg=${encodeURIComponent(msg)}`);
  }

  /** Para botões de ação rápida que ficam na mesma tela. */
  protected static atualizarTelas() {
    revalidatePath('/', 'layout');
  }
}
