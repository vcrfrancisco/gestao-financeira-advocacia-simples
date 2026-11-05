export const digitos = (s: string) => s.replace(/\D/g, '');

/** "Petrópolis" vira "Petropolis". */
export const semAcentos = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

export const fMoeda = (centavos: number) => (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Centavos guardados no CSV para o formato do campo de digitação ("1500,00"). */
export const centInput = (c: string) => (c === '' ? '' : (Number(c) / 100).toFixed(2).replace('.', ','));

/** "R$ 1.500,00", "1500,5" ou "1.500" para centavos; null se não for um valor. */
export function parseMoeda(v: string): number | null {
  let s = v.trim().replace(/R\$|\s/g, '');
  if (!s) return null;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

export function formatarTelefone(v: string) {
  const d = digitos(v).slice(0, 11);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return v;
}

export function formatarCpfCnpj(v: string) {
  const d = digitos(v);
  if (d.length === 11) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (d.length === 14) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  return v;
}

export function linkWhats(tel: string, texto: string) {
  let d = digitos(tel);
  if (!d) return null;
  if (d.length <= 11) d = `55${d}`;
  return `https://wa.me/${d}?text=${encodeURIComponent(texto)}`;
}

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
