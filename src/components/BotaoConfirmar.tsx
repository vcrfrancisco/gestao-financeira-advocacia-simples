'use client';

import { useEffect, useState } from 'react';

/** Botão de exclusão em dois toques: o primeiro pede confirmação, o segundo envia. */
export function BotaoConfirmar({ acao, id, rotulo = 'Excluir', mini = false }: { acao: (fd: FormData) => Promise<void>; id: string; rotulo?: string; mini?: boolean }) {
  const [armado, setArmado] = useState(false);
  useEffect(() => {
    if (!armado) return;
    const t = setTimeout(() => setArmado(false), 4000);
    return () => clearTimeout(t);
  }, [armado]);
  return (
    <form action={acao} className="inline">
      <input type="hidden" name="id" value={id} />
      <button
        className={`btn perigo${mini ? ' mini' : ''}`}
        data-armado={armado || undefined}
        onClick={(e) => { if (!armado) { e.preventDefault(); setArmado(true); } }}
      >
        {armado ? 'Toque de novo para confirmar' : rotulo}
      </button>
    </form>
  );
}
