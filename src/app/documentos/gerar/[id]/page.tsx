import { notFound } from 'next/navigation';
import { AcoesDocumento } from '@/acoes/AcoesDocumento';
import { BotaoCopiar } from '@/components/BotaoCopiar';
import { EnviarAoMudar } from '@/components/EnviarAoMudar';
import { Formulario } from '@/components/Formulario';
import { Cabecalho, Opcoes, opcoesClientes, opcoesProcessos, param, type ParamsBusca, type ParamsId } from '@/components/ui';
import { carregar } from '@/lib/db';
import { driveConfigurado } from '@/lib/drive';

export const metadata = { title: 'Gerar documento' };

export default async function Gerar({ params, searchParams }: ParamsId & ParamsBusca) {
  const { id } = await params;
  const sp = await searchParams;
  const d = await carregar();
  const modelo = d.modelos.find((m) => m.id === id);
  if (!modelo) notFound();
  const processo = d.processo(param(sp, 'processo'));
  const cliente = d.cliente(param(sp, 'cliente')) ?? (processo && d.cliente(processo.cliente_id));
  const texto = cliente || processo ? modelo.preencher(d.config, cliente, processo) : '';
  const drive = d.config.drive_ativo === 'sim' && driveConfigurado();

  return (
    <>
      <Cabecalho titulo={modelo.rotulo} sub="Escolha para quem é o documento, revise o texto e gere o arquivo." />
      <form className="papel">
        <div className="campos">
          <EnviarAoMudar id="g-cliente" name="cliente" valor={cliente?.id ?? ''} rotulo="Cliente"><option value="">Selecione</option><Opcoes itens={opcoesClientes(d)} /></EnviarAoMudar>
          <EnviarAoMudar id="g-processo" name="processo" valor={processo?.id ?? ''} rotulo="Processo (opcional)"><option value="">Nenhum</option><Opcoes itens={opcoesProcessos(d, processo?.id)} /></EnviarAoMudar>
        </div>
        <noscript><button className="btn sec" style={{ marginTop: '1rem' }}>Preencher</button></noscript>
      </form>
      {texto && (
        <Formulario
          acao={AcoesDocumento.gerar}
          rotulo="Gerar em Word (.docx)"
          extras={<><button className="btn sec" type="submit" name="formato" value="txt">Gerar em texto (.txt)</button><BotaoCopiar alvo="#texto" rotulo="Copiar texto" /></>}
        >
          <input type="hidden" name="nome_modelo" value={modelo.nome} />
          <input type="hidden" name="cliente_id" value={cliente?.id ?? ''} />
          <input type="hidden" name="processo_id" value={processo?.id ?? ''} />
          <div className="campo">
            <label htmlFor="texto">Revise antes de gerar</label>
            <textarea id="texto" name="texto" className="documento" defaultValue={texto} key={`${cliente?.id}-${processo?.id}`} />
            {texto.includes('________') && <p className="ajuda">Os trechos “________” são dados que faltam no cadastro.</p>}
          </div>
          <p className="ajuda" style={{ marginTop: '.75rem' }}>{drive ? 'O arquivo fica guardado no computador e é enviado ao seu Google Drive.' : 'O arquivo fica guardado na pasta “documentos” do computador.'}</p>
        </Formulario>
      )}
    </>
  );
}
