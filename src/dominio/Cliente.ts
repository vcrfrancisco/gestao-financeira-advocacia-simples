import type { Registro } from '@/lib/tabelas';
import { linkWhats } from '@/lib/formato';
import { Lancamento } from './Lancamento';

export interface Cliente extends Registro<'clientes'> {}

export class Cliente extends Lancamento<'clientes'> {
  static readonly tabela = 'clientes';

  get rotulo() { return this.nome; }
  get pessoaJuridica() { return this.tipo === 'PJ'; }
  get primeiroNome() { return this.nome.split(' ')[0]; }

  /** Texto de qualificação usado em procurações e contratos. */
  qualificacao() {
    const p = [this.nome];
    if (this.pessoaJuridica) {
      p.push('pessoa jurídica de direito privado');
      if (this.cpf_cnpj) p.push(`inscrita no CNPJ sob o nº ${this.cpf_cnpj}`);
      if (this.endereco) p.push(`com sede em ${this.endereco}`);
    } else {
      [this.nacionalidade, this.estado_civil, this.profissao].forEach((x) => x && p.push(x));
      if (this.rg) p.push(`portador(a) do RG nº ${this.rg}`);
      if (this.cpf_cnpj) p.push(`inscrito(a) no CPF sob o nº ${this.cpf_cnpj}`);
      if (this.endereco) p.push(`residente e domiciliado(a) em ${this.endereco}`);
    }
    if (this.email) p.push(`e-mail ${this.email}`);
    return p.join(', ');
  }

  /** Link do WhatsApp com a mensagem pronta, ou null sem celular cadastrado. */
  whatsapp(texto = `Olá, ${this.primeiroNome}!`) {
    return linkWhats(this.telefone, texto);
  }
}
