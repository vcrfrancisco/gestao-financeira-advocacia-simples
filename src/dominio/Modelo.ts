import type { Config, Registro } from '@/lib/tabelas';
import { Lancamento } from './Lancamento';
import { Data } from './Data';
import type { Cliente } from './Cliente';
import type { Processo } from './Processo';

export interface Modelo extends Registro<'modelos'> {}

/** Modelo de documento com {{campos}} que são trocados pelos dados do cadastro. */
export class Modelo extends Lancamento<'modelos'> {
  static readonly tabela = 'modelos';

  static readonly CAMPOS: [string, string][] = [
    ['cliente.nome', 'Nome do cliente'], ['cliente.qualificacao', 'Qualificação completa'], ['cliente.cpf_cnpj', 'CPF ou CNPJ'],
    ['cliente.endereco', 'Endereço do cliente'], ['cliente.telefone', 'Telefone do cliente'], ['processo.numero', 'Número do processo'],
    ['processo.vara', 'Vara'], ['processo.comarca', 'Comarca'], ['processo.tribunal', 'Tribunal'], ['processo.tipo_acao', 'Tipo de ação'],
    ['processo.parte_contraria', 'Parte contrária'], ['advogado.nome', 'Seu nome'], ['advogado.oab', 'Seu nº da OAB'], ['advogado.uf_oab', 'UF da OAB'],
    ['advogado.endereco', 'Endereço do escritório'], ['advogado.cidade', 'Cidade'], ['advogado.email', 'Seu e-mail'],
    ['data_extenso', 'Data por extenso'], ['data_hoje', 'Data (dd/mm/aaaa)'],
  ];

  /** Modelos que já vêm com o sistema (não ficam no CSV; "editar" cria uma cópia). */
  static readonly PADRAO = [
    new Modelo({
      id: 'padrao-procuracao', criado: '', nome: 'Procuração ad judicia et extra', conteudo: `# PROCURAÇÃO AD JUDICIA ET EXTRA

OUTORGANTE: {{cliente.qualificacao}}

OUTORGADO(A): {{advogado.nome}}, advogado(a) inscrito(a) na OAB/{{advogado.uf_oab}} sob o nº {{advogado.oab}}, com escritório profissional em {{advogado.endereco}}, e-mail {{advogado.email}}.

PODERES: pelo presente instrumento, o(a) outorgante nomeia e constitui o(a) outorgado(a) seu(sua) bastante procurador(a), conferindo-lhe os poderes da cláusula ad judicia et extra para o foro em geral, em qualquer juízo, instância ou tribunal, podendo propor contra quem de direito as ações competentes e defendê-lo(a) nas contrárias, seguindo umas e outras até final decisão, usando os recursos legais e acompanhando-os, conferindo-lhe ainda poderes especiais para confessar, desistir, transigir, firmar compromissos ou acordos, receber e dar quitação, agindo em conjunto ou separadamente, podendo ainda substabelecer esta a outrem, com ou sem reservas de iguais poderes, dando tudo por bom, firme e valioso.

{{advogado.cidade}}, {{data_extenso}}.



_______________________________________
{{cliente.nome}}`,
    }),
    new Modelo({
      id: 'padrao-contrato', criado: '', nome: 'Contrato de honorários advocatícios', conteudo: `# CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS

CONTRATANTE: {{cliente.qualificacao}}

CONTRATADO(A): {{advogado.nome}}, advogado(a) inscrito(a) na OAB/{{advogado.uf_oab}} sob o nº {{advogado.oab}}, com escritório profissional em {{advogado.endereco}}.

CLÁUSULA 1ª – DO OBJETO. O(A) CONTRATADO(A) prestará serviços advocatícios ao(à) CONTRATANTE no seguinte assunto: {{processo.tipo_acao}} {{processo.numero}}.

CLÁUSULA 2ª – DOS HONORÁRIOS. Pelos serviços, o(a) CONTRATANTE pagará ao(à) CONTRATADO(A) o valor de R$ ________ (________________), na forma ________________.

CLÁUSULA 3ª – DAS DESPESAS. Custas processuais, emolumentos, perícias e demais despesas correrão por conta do(a) CONTRATANTE.

CLÁUSULA 4ª – DOS HONORÁRIOS DE SUCUMBÊNCIA. Os honorários de sucumbência pertencem ao(à) CONTRATADO(A), nos termos do art. 23 da Lei 8.906/1994, sem prejuízo dos honorários aqui contratados.

CLÁUSULA 5ª – DO FORO. Fica eleito o foro da comarca de {{advogado.cidade}} para dirimir dúvidas oriundas deste contrato.

{{advogado.cidade}}, {{data_extenso}}.



_______________________________________
{{cliente.nome}}



_______________________________________
{{advogado.nome}} – OAB/{{advogado.uf_oab}} {{advogado.oab}}`,
    }),
  ];

  get rotulo() { return this.nome; }
  get padrao() { return this.id.startsWith('padrao-'); }

  /** Troca cada {{campo}} pelo dado do cadastro; o que faltar vira "________". */
  preencher(config: Config, cliente?: Cliente, processo?: Processo) {
    const hoje = Data.hoje();
    const dados: Record<string, string | undefined> = {
      'advogado.nome': config.adv_nome, 'advogado.oab': config.adv_oab, 'advogado.uf_oab': config.adv_uf,
      'advogado.email': config.adv_email, 'advogado.endereco': config.adv_endereco, 'advogado.cidade': config.adv_cidade,
      data_extenso: hoje.porExtenso(), data_hoje: hoje.formatada(),
    };
    if (cliente) {
      for (const [k, v] of Object.entries(cliente.paraLinha())) dados[`cliente.${k}`] = v;
      dados['cliente.qualificacao'] = cliente.qualificacao();
    }
    if (processo) for (const [k, v] of Object.entries(processo.paraLinha())) dados[`processo.${k}`] = v;
    return this.conteudo.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k: string) => dados[k] || '________');
  }
}
