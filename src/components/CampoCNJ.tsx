'use client';

import { useState } from 'react';
import { Processo } from '@/dominio/Processo';
import { digitos } from '@/lib/formato';

/** Campo do número CNJ: formata ao sair, confere o dígito e preenche o tribunal se estiver vazio. */
export function CampoCNJ({ name, valor = '' }: { name: string; valor?: string }) {
  const [info, setInfo] = useState('Cole o número; o tribunal é identificado sozinho. Deixe em branco se ainda não foi distribuído.');
  return (
    <div className="campo">
      <label htmlFor={name}>Número do processo (CNJ)</label>
      <input
        id={name} name={name} type="text" inputMode="numeric" autoComplete="off"
        placeholder="0000000-00.0000.0.00.0000" defaultValue={valor} aria-describedby="numero-info"
        onBlur={(e) => {
          const d = digitos(e.currentTarget.value);
          if (d.length === 20) {
            e.currentTarget.value = Processo.formatarCNJ(d)!;
            const trib = Processo.tribunalDoCNJ(d);
            const campo = e.currentTarget.form?.elements.namedItem('tribunal') as HTMLInputElement | null;
            if (campo && !campo.value && trib) campo.value = trib;
            setInfo(Processo.validarCNJ(d) ? `Número válido${trib ? `, ${trib}` : ''}.` : 'O dígito verificador não confere. Confira o número.');
          } else if (d) setInfo(`O número CNJ tem 20 dígitos; você digitou ${d.length}.`);
        }}
      />
      <p className="ajuda" id="numero-info" aria-live="polite">{info}</p>
    </div>
  );
}
