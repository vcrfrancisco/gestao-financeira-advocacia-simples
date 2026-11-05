'use client';

import { useState } from 'react';

/** Copia o texto (ou o valor de um campo) indicado por `alvo` (seletor CSS). */
export function BotaoCopiar({ alvo, rotulo = 'Copiar' }: { alvo: string; rotulo?: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      className="btn sec"
      onClick={async () => {
        const el = document.querySelector<HTMLElement>(alvo);
        if (!el) return;
        const texto = el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement ? el.value : el.innerText.trim();
        await navigator.clipboard.writeText(texto);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
      }}
    >
      {copiado ? 'Copiado!' : rotulo}
    </button>
  );
}
