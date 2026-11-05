'use client';

import Link from 'next/link';
import { useState, useTransition, type ReactNode } from 'react';
import type { Resultado } from '@/acoes/Acoes';

type Props = {
  acao: (fd: FormData) => Promise<Resultado>;
  children: ReactNode;
  rotulo: string;
  cancelar?: string;
  className?: string;
  /** Botões extras no rodapé (ex.: segundo formato de download). */
  extras?: ReactNode;
};

/**
 * Formulário que chama uma Server Action e mostra o erro devolvido sem apagar o que foi digitado.
 * (Com `action={...}` direto, o React limpa os campos após o envio, mesmo quando há erro.)
 */
export function Formulario({ acao, children, rotulo, cancelar, className = 'papel', extras }: Props) {
  const [erro, setErro] = useState('');
  const [pendente, iniciar] = useTransition();
  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form, (e.nativeEvent as SubmitEvent).submitter);
        iniciar(async () => {
          const r = await acao(fd);
          setErro(r?.erro ?? '');
          // Sucesso sem mudar de página (ex.: novo andamento): limpa para o próximo.
          if (!r?.erro) form.reset();
        });
      }}
    >
      {children}
      <p className="erro-form" role="alert">{erro}</p>
      <div className="rodape-form">
        <button className="btn" type="submit" disabled={pendente}>{pendente ? 'Salvando…' : rotulo}</button>
        {extras}
        {cancelar && <Link className="btn sec" href={cancelar}>Cancelar</Link>}
      </div>
    </form>
  );
}
