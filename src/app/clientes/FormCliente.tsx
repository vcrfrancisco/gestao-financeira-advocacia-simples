import { AcoesCliente } from '@/acoes/AcoesCliente';
import { Formulario } from '@/components/Formulario';
import type { Cliente } from '@/dominio/Cliente';

export function FormCliente({ cliente: c, cancelar }: { cliente: Cliente; cancelar: string }) {
  const texto = (n: keyof Cliente & string, rotulo: string, extra: Record<string, string> = {}, largo = false) => (
    <div className={`campo${largo ? ' largo' : ''}`}><label htmlFor={n}>{rotulo}</label><input id={n} name={n} type="text" defaultValue={String(c[n] ?? '')} {...extra} /></div>
  );
  return (
    <Formulario acao={AcoesCliente.salvar} rotulo="Salvar cliente" cancelar={cancelar}>
      <input type="hidden" name="id" value={c.id} />
      <div className="campos">
        <fieldset className="largo">
          <legend>Tipo</legend>
          <label className="opcao"><input type="radio" name="tipo" value="PF" defaultChecked={!c.pessoaJuridica} /> Pessoa física</label>
          <label className="opcao"><input type="radio" name="tipo" value="PJ" defaultChecked={c.pessoaJuridica} /> Pessoa jurídica</label>
        </fieldset>
        {texto('nome', 'Nome completo ou razão social', { required: 'required' }, true)}
        {texto('cpf_cnpj', 'CPF ou CNPJ', { inputMode: 'numeric' })}
        {texto('rg', 'RG')}
        {texto('nacionalidade', 'Nacionalidade')}
        {texto('estado_civil', 'Estado civil')}
        {texto('profissao', 'Profissão')}
        {texto('telefone', 'Celular (WhatsApp)', { inputMode: 'tel', placeholder: '(31) 99999-9999' })}
        {texto('email', 'E-mail', { inputMode: 'email' })}
        {texto('endereco', 'Endereço completo', { placeholder: 'Rua, número, bairro, cidade/UF, CEP' }, true)}
        <div className="campo largo"><label htmlFor="observacoes">Observações</label><textarea id="observacoes" name="observacoes" defaultValue={c.observacoes} /></div>
      </div>
      <p className="ajuda" style={{ marginTop: '1rem' }}>Os dados de qualificação preenchem procurações e contratos.</p>
    </Formulario>
  );
}
