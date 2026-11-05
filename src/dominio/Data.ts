const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const pad = (n: number) => String(n).padStart(2, '0');

/** Um dia do calendário, sem horário nem fuso: tudo é calculado em UTC para não "pular" de dia. */
export class Data {
  private constructor(private readonly utc: Date) {}

  static de(iso: string) {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    return new Data(new Date(Date.UTC(y, m - 1, d)));
  }

  /** Dia, no fuso deste computador, de um instante (ex.: o carimbo `criado`, que é gravado em UTC). */
  static local(d: Date) {
    return new Data(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())));
  }

  static hoje() {
    return Data.local(new Date());
  }

  /** "2026-02-30" não é válida; "2026-02-28" é. */
  static valida(iso: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(iso) && Data.de(iso).iso === iso;
  }

  /**
   * Data lida do CSV → AAAA-MM-DD (ou AAAA-MM-DDThh:mm, nos compromissos).
   * O padrão é dd/mm/aaaa; mm/dd/aaaa só é reconhecida quando não há dúvida (segundo número > 12).
   * AAAA-MM-DD (formato antigo dos arquivos) passa direto.
   */
  static doCSV(texto: string) {
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::\d{2})?)?$/.exec(texto.trim());
    if (!m) return texto.trim();
    let [dia, mes] = [Number(m[1]), Number(m[2])];
    if (mes > 12 && dia <= 12) [dia, mes] = [mes, dia];
    const iso = `${m[3]}-${pad(mes)}-${pad(dia)}`;
    return m[4] ? `${iso}T${pad(Number(m[4]))}:${m[5]}` : iso;
  }

  /** AAAA-MM-DD[Thh:mm] → dd/mm/aaaa[ hh:mm], como a data é gravada no CSV. */
  static paraCSV(valor: string) {
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}:\d{2}))?$/.exec(valor);
    return m ? `${m[3]}/${m[2]}/${m[1]}${m[4] ? ` ${m[4]}` : ''}` : valor;
  }

  static nomeDoMes(mes: number) {
    return MESES[mes - 1];
  }

  get iso() { return this.utc.toISOString().slice(0, 10); }
  get ano() { return this.utc.getUTCFullYear(); }
  get mes() { return this.utc.getUTCMonth() + 1; }
  get dia() { return this.utc.getUTCDate(); }
  /** AAAA-MM, para agrupar por mês. */
  get mesAno() { return this.iso.slice(0, 7); }
  get diaDaSemana() { return this.utc.getUTCDay(); }
  get nomeDoDia() { return DIAS[this.diaDaSemana]; }

  maisDias(n: number) {
    const r = new Date(this.utc);
    r.setUTCDate(r.getUTCDate() + n);
    return new Data(r);
  }

  /** 31/01 + 1 mês = 28/02 (ou 29/02): fica no último dia quando o mês é mais curto. */
  maisMeses(n: number) {
    const alvo = new Date(Date.UTC(this.ano, this.mes - 1 + n, 1));
    const ultimo = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate();
    alvo.setUTCDate(Math.min(this.dia, ultimo));
    return new Data(alvo);
  }

  diasAte(outra: Data) {
    return Math.round((outra.utc.getTime() - this.utc.getTime()) / 86400000);
  }

  /** dd/mm/aaaa */
  formatada() { return `${pad(this.dia)}/${pad(this.mes)}/${this.ano}`; }
  /** 4 de novembro de 2026 */
  porExtenso() { return `${this.dia} de ${MESES[this.mes - 1]} de ${this.ano}`; }
  /** "nov" */
  mesAbreviado() { return MESES[this.mes - 1].slice(0, 3); }

  /** "vence hoje", "vence em 3 dias", "venceu há 2 dias". */
  textoVencimento(hoje = Data.hoje()) {
    const d = hoje.diasAte(this);
    if (d < 0) return `venceu há ${-d} dia${d === -1 ? '' : 's'}`;
    if (d === 0) return 'vence hoje';
    if (d === 1) return 'vence amanhã';
    return `vence em ${d} dias`;
  }

  /** Classe visual: 'urgente' (vencido ou hoje), 'proximo' (até 3 dias) ou ''. */
  urgencia(hoje = Data.hoje()) {
    const d = hoje.diasAte(this);
    if (d <= 0) return 'urgente';
    if (d <= 3) return 'proximo';
    return '';
  }
}
