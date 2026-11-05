'use client';

import { useEffect, useState } from 'react';

type Local = { codigo: string; nome: string };

/** UF e município dos feriados da base; a lista de municípios vem de /api/municipios ao trocar a UF. */
export function SeletorLocal({ estados, uf, municipio, municipiosIniciais }: { estados: Local[]; uf: string; municipio: string; municipiosIniciais: Local[] }) {
  const [ufAtual, setUf] = useState(uf);
  const [buscados, setBuscados] = useState<{ uf: string; lista: Local[] }>({ uf: '', lista: [] });
  // Calculada na renderização: ao voltar para a UF salva, o <select> já nasce com o município salvo.
  const lista = ufAtual === uf ? municipiosIniciais : buscados.uf === ufAtual ? buscados.lista : [];
  useEffect(() => {
    if (!ufAtual || ufAtual === uf) return;
    let vivo = true;
    fetch(`/api/municipios?uf=${ufAtual}`).then((r) => r.json()).then((m: Local[]) => { if (vivo) setBuscados({ uf: ufAtual, lista: m }); });
    return () => { vivo = false; };
  }, [ufAtual, uf]);
  return (
    <div className="campos" style={{ marginBottom: '1rem' }}>
      <div className="campo">
        <label htmlFor="feriados_uf">Estado onde você atua</label>
        <select id="feriados_uf" name="feriados_uf" value={ufAtual} onChange={(e) => setUf(e.target.value)}>
          <option value="">Só feriados nacionais</option>
          {estados.map((e) => <option key={e.codigo} value={e.codigo}>{e.nome}</option>)}
        </select>
      </div>
      <div className="campo">
        <label htmlFor="feriados_municipio">Município (comarca)</label>
        <select id="feriados_municipio" name="feriados_municipio" defaultValue={municipio} key={ufAtual} disabled={!ufAtual}>
          <option value="">Nenhum</option>
          {lista.map((m) => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
        </select>
      </div>
    </div>
  );
}
