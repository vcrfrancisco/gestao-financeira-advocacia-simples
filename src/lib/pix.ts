import { digitos, semAcentos } from './formato';

// Pix "copia e cola" estático (padrão EMV do Banco Central).
const ascii = (t: string) => semAcentos(t).replace(/[^A-Za-z0-9 .\-/@]/g, '').trim();
const campo = (id: string, v: string) => id + String(v.length).padStart(2, '0') + v;

function crc16(s: string) {
  let crc = 0xffff;
  for (const b of new TextEncoder().encode(s)) {
    crc ^= b << 8;
    for (let i = 0; i < 8; i += 1) { crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1; crc &= 0xffff; }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** A chave vai só com dígitos: CPF/CNPJ sem pontuação e telefone como +5531999999999. */
function normalizarChave(chave: string) {
  const k = chave.trim();
  if (/^\+[\d\s()-]+$/.test(k)) return `+${digitos(k)}`;
  if (/^[\d.\-/\s]+$/.test(k) && [11, 14].includes(digitos(k).length)) return digitos(k);
  return k;
}

export function gerarPix({ chave, nome, cidade, centavos, txid, descricao }: { chave: string; nome: string; cidade: string; centavos: number; txid: string; descricao: string }) {
  if (!chave) throw new Error('Cadastre sua chave Pix em Ajustes.');
  let conta = campo('00', 'br.gov.bcb.pix') + campo('01', normalizarChave(chave));
  const desc = ascii(descricao);
  const espaco = 99 - conta.length - 4;
  if (desc && espaco > 0) conta += campo('02', desc.slice(0, espaco));
  const id = txid.replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***';
  const p = campo('00', '01') + campo('26', conta) + campo('52', '0000') + campo('53', '986')
    + (centavos ? campo('54', (centavos / 100).toFixed(2)) : '') + campo('58', 'BR')
    + campo('59', ascii(nome).toUpperCase().slice(0, 25) || 'RECEBEDOR') + campo('60', ascii(cidade).toUpperCase().slice(0, 15) || 'BRASIL')
    + campo('62', campo('05', id)) + '6304';
  return p + crc16(p);
}
