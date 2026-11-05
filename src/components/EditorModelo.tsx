'use client';

import { useRef } from 'react';
import type { Resultado } from '@/acoes/Acoes';
import { Modelo } from '@/dominio/Modelo';
import { Formulario } from './Formulario';

/** Editor de modelo com a lista de campos automáticos para inserir no ponto do cursor. */
export function EditorModelo({ acao, id, nome, conteudo, cancelar }: { acao: (fd: FormData) => Promise<Resultado>; id: string; nome: string; conteudo: string; cancelar: string }) {
  const texto = useRef<HTMLTextAreaElement>(null);
  const inserir = (campo: string) => {
    const a = texto.current!;
    const i = a.selectionStart ?? a.value.length;
    a.value = a.value.slice(0, i) + campo + a.value.slice(a.selectionEnd ?? i);
    a.focus();
    a.selectionStart = a.selectionEnd = i + campo.length;
  };
  return (
    <div className="colunas colunas-modelo">
      <Formulario acao={acao} rotulo="Salvar modelo" cancelar={cancelar}>
        <input type="hidden" name="id" value={id} />
        <div className="campo">
          <label htmlFor="nome">Nome do modelo</label>
          <input id="nome" name="nome" type="text" defaultValue={nome} required />
        </div>
        <div className="campo" style={{ marginTop: '1rem' }}>
          <label htmlFor="conteudo">Texto</label>
          <textarea id="conteudo" ref={texto} className="documento" name="conteudo" defaultValue={conteudo} required aria-describedby="ajuda-modelo" />
          <p className="ajuda" id="ajuda-modelo">Linha começando com “# ” vira título centralizado em negrito. Use **assim** para negrito. Linha com “_____” vira assinatura centralizada.</p>
        </div>
      </Formulario>
      <aside className="papel">
        <h2>Campos automáticos</h2>
        <p className="discreto pequeno">Clique para inserir no texto, onde está o cursor.</p>
        <ul className="lista">
          {Modelo.CAMPOS.map(([k, n]) => (
            <li key={k}><div className="item-corpo"><button className="btn-texto" type="button" onClick={() => inserir(`{{${k}}}`)}>{n}</button><div className="meta">{`{{${k}}}`}</div></div></li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
