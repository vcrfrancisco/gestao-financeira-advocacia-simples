'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

/** Mostra a mensagem de confirmação (?msg=...) deixada pela última ação e limpa o endereço. */
export function Aviso() {
  const params = useSearchParams();
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    const m = params.get('msg');
    if (!m) return;
    setMsg(m);
    const url = new URL(window.location.href);
    url.searchParams.delete('msg');
    window.history.replaceState(window.history.state, '', url);
  }, [params]);
  // Separado: o replaceState acima muda `params` e a limpeza daquele efeito cancelaria o tempo.
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 7000);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      <span>{msg}</span>
      <button type="button" onClick={() => setMsg(null)}>Fechar</button>
    </div>
  );
}
