import { Data } from './Data';

export type TipoBase = 'disponibilizacao' | 'ciencia';
export type Contagem = 'uteis' | 'corridos';

/** Dados simples (serializáveis) para montar o calendário no servidor ou no navegador. */
export type OpcoesCalendario = {
  /** Chaves de Calendario.FERIADOS_OPCIONAIS marcadas em Ajustes. */
  opcionais: string[];
  /** Recesso forense de 20/12 a 20/01 (art. 220 do CPC). */
  recesso: boolean;
  /** Feriados que não são calculados: base do feriados.dev (UF e município) e os cadastrados à mão. */
  feriados: { data: string; descricao: string }[];
};

export type ResultadoPrazo = {
  dataPublicacao: string | null;
  dataInicio: string;
  dataFim: string;
  /** Dias sem contagem no período, exceto fins de semana. */
  descontados: { data: string; motivo: string }[];
};

/** Calendário forense: sabe quais dias são úteis e calcula vencimentos de prazos. */
export class Calendario {
  static readonly FERIADOS_OPCIONAIS: Record<string, string> = {
    quarta_cinzas: 'Quarta-feira de Cinzas',
    quinta_santa: 'Quinta-feira Santa',
    corpus_christi: 'Corpus Christi',
    dia_justica: 'Dia da Justiça (8 de dezembro)',
    servidor_publico: 'Dia do Servidor Público (28 de outubro)',
  };

  private readonly opcionais: Set<string>;
  private readonly avulsos: Map<string, string>;
  private readonly cache = new Map<number, Map<string, string>>();

  constructor(private readonly opcoes: OpcoesCalendario) {
    this.opcionais = new Set(opcoes.opcionais);
    this.avulsos = new Map(opcoes.feriados.map((f) => [f.data, f.descricao]));
  }

  private static pascoa(ano: number) {
    const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), hh = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - hh - k) % 7, m = Math.floor((a + 11 * hh + 22 * l) / 451);
    const mes = Math.floor((hh + l - 7 * m + 114) / 31), dia = ((hh + l - 7 * m + 114) % 31) + 1;
    return Data.de(`${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`);
  }

  /** Feriados nacionais calculados (valem para qualquer ano, mesmo fora da base do feriados.dev). */
  nacionais(ano: number) {
    if (this.cache.has(ano)) return this.cache.get(ano)!;
    const m = new Map<string, string>();
    const pascoa = Calendario.pascoa(ano);
    const fixo = (md: string, desc: string) => m.set(`${ano}-${md}`, desc);
    const movel = (n: number, desc: string) => m.set(pascoa.maisDias(n).iso, desc);
    const op = Calendario.FERIADOS_OPCIONAIS;
    fixo('01-01', 'Confraternização Universal'); fixo('04-21', 'Tiradentes'); fixo('05-01', 'Dia do Trabalho');
    fixo('09-07', 'Independência do Brasil'); fixo('10-12', 'Nossa Senhora Aparecida'); fixo('11-02', 'Finados');
    fixo('11-15', 'Proclamação da República');
    if (ano >= 2024) fixo('11-20', 'Dia Nacional de Zumbi e da Consciência Negra');
    fixo('12-25', 'Natal');
    movel(-48, 'Carnaval (segunda-feira)'); movel(-47, 'Carnaval (terça-feira)'); movel(-2, 'Sexta-feira Santa');
    if (this.opcionais.has('quarta_cinzas')) movel(-46, op.quarta_cinzas);
    if (this.opcionais.has('quinta_santa')) movel(-3, op.quinta_santa);
    if (this.opcionais.has('corpus_christi')) movel(60, op.corpus_christi);
    if (this.opcionais.has('dia_justica')) fixo('12-08', op.dia_justica);
    if (this.opcionais.has('servidor_publico')) fixo('10-28', op.servidor_publico);
    this.cache.set(ano, m);
    return m;
  }

  emRecesso(d: Data) {
    return this.opcoes.recesso && ((d.mes === 12 && d.dia >= 20) || (d.mes === 1 && d.dia <= 20));
  }

  /** Por que o dia não é útil, ou null se for útil. */
  motivo(d: Data): string | null {
    if (d.diaDaSemana === 0) return 'domingo';
    if (d.diaDaSemana === 6) return 'sábado';
    if (this.emRecesso(d)) return 'recesso forense';
    return this.nacionais(d.ano).get(d.iso) || this.avulsos.get(d.iso) || null;
  }

  util(d: Data) {
    return this.motivo(d) === null;
  }

  /** Fim de semana ou feriado. O recesso fica de fora: ele suspende a contagem, não o expediente. */
  private semExpediente(d: Data) {
    return d.diaDaSemana === 0 || d.diaDaSemana === 6 || this.nacionais(d.ano).has(d.iso) || this.avulsos.has(d.iso);
  }

  calcularPrazo({ dataBase, tipoBase, dias, contagem }: { dataBase: string; tipoBase: TipoBase; dias: number; contagem: Contagem }): ResultadoPrazo {
    if (!Data.valida(dataBase)) throw new Error('Informe a data.');
    if (!Number.isInteger(dias) || dias < 1 || dias > 3650) throw new Error('Informe uma quantidade de dias entre 1 e 3650.');
    const pulados: { data: string; motivo: string }[] = [];
    const proximo = (d: Data, serve: (x: Data) => boolean) => {
      let a = d.maisDias(1);
      while (!serve(a)) { pulados.push({ data: a.iso, motivo: this.motivo(a)! }); a = a.maisDias(1); }
      return a;
    };
    const proximoUtil = (d: Data) => proximo(d, (x) => this.util(x));

    let ref = Data.de(dataBase);
    let publicacao: string | null = null;
    // Publicação no Diário: considera-se publicada no 1º dia com expediente após a disponibilização.
    // O recesso não adia a publicação: disponibilizada em 19/01, publica em 20/01 e conta a partir de 21/01.
    if (tipoBase !== 'ciencia') { ref = proximo(ref, (x) => !this.semExpediente(x)); publicacao = ref.iso; }
    const inicio = proximoUtil(ref);
    let fim = inicio;
    if (contagem === 'corridos') {
      for (let n = 1; n < dias;) {
        fim = fim.maisDias(1);
        if (this.emRecesso(fim)) pulados.push({ data: fim.iso, motivo: 'recesso forense' });
        else n += 1;
      }
      if (!this.util(fim)) { pulados.push({ data: fim.iso, motivo: `${this.motivo(fim)} (vencimento prorrogado)` }); fim = proximoUtil(fim); }
    } else {
      for (let n = 1; n < dias; n += 1) fim = proximoUtil(fim);
    }
    return {
      dataPublicacao: publicacao,
      dataInicio: inicio.iso,
      dataFim: fim.iso,
      descontados: pulados.filter((p) => p.motivo !== 'sábado' && p.motivo !== 'domingo'),
    };
  }
}
