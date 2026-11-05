'use client';

import type { ReactNode } from 'react';

/** <select> que envia o formulário (GET) ao trocar de opção. */
export function EnviarAoMudar({ id, name, valor, rotulo, children }: { id: string; name: string; valor: string; rotulo: string; children: ReactNode }) {
  return (
    <div className="campo">
      <label htmlFor={id}>{rotulo}</label>
      <select id={id} name={name} defaultValue={valor} onChange={(e) => e.currentTarget.form?.requestSubmit()}>{children}</select>
    </div>
  );
}
