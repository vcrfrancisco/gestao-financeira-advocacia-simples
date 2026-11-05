import { AcoesIntimacao } from '@/acoes/AcoesIntimacao';
import { CampoCNJ } from '@/components/CampoCNJ';
import { Formulario } from '@/components/Formulario';
import { Cabecalho, Opcoes, opcoesProcessos, param, type ParamsBusca } from '@/components/ui';
import { carregar } from '@/lib/db';
import { Data } from '@/dominio/Data';
import { Intimacao } from '@/dominio/Intimacao';

export const metadata = { title: 'Registrar intimação' };

export default async function NovaIntimacao({ searchParams }: ParamsBusca) {
  const processoId = param(await searchParams, 'processo');
  const d = await carregar();
  return (
    <>
      <Cabecalho titulo="Registrar intimação" sub="Publicação no Diário, intimação no sistema do tribunal, pessoal ou por oficial." />
      <Formulario acao={AcoesIntimacao.registrar} rotulo="Registrar e lançar prazo" cancelar="/intimacoes">
        <div className="campos">
          <fieldset className="largo">
            <legend>Tipo de intimação</legend>
            <label className="opcao"><input type="radio" name="origem" value="disponibilizacao" defaultChecked /> Publicação no Diário (DJe/DJEN): informe a data de disponibilização</label>
            <label className="opcao"><input type="radio" name="origem" value="ciencia" /> Intimação no sistema, pessoal ou por oficial: informe a data da ciência</label>
          </fieldset>
          <div className="campo"><label htmlFor="data_disponibilizacao">Data</label><input id="data_disponibilizacao" name="data_disponibilizacao" type="date" defaultValue={Data.hoje().iso} required /></div>
          <div className="campo">
            <label htmlFor="tipo">Assunto</label>
            <input id="tipo" name="tipo" type="text" list="assuntos" placeholder="Ex.: Despacho" />
            <datalist id="assuntos">{Intimacao.ASSUNTOS.map((a) => <option key={a} value={a} />)}</datalist>
          </div>
          <div className="campo largo">
            <label htmlFor="processo_id">Processo cadastrado</label>
            <select id="processo_id" name="processo_id" defaultValue={processoId}><option value="">Nenhum (informe o número abaixo)</option><Opcoes itens={opcoesProcessos(d)} /></select>
          </div>
          <CampoCNJ name="numero_processo" />
          <div className="campo"><label htmlFor="tribunal">Tribunal</label><input id="tribunal" name="tribunal" type="text" /></div>
          <div className="campo largo"><label htmlFor="texto">Texto da intimação</label><textarea id="texto" name="texto" placeholder="Cole aqui o teor, se tiver" /></div>
        </div>
      </Formulario>
    </>
  );
}
