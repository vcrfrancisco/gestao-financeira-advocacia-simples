import Link from 'next/link';
import { AcoesDocumento } from '@/acoes/AcoesDocumento';
import { BotaoConfirmar } from '@/components/BotaoConfirmar';
import { Cabecalho, Vazio, param, type ParamsBusca } from '@/components/ui';
import { carregar } from '@/lib/db';
import { driveConfigurado } from '@/lib/drive';

export const metadata = { title: 'Documentos' };

export default async function Documentos({ searchParams }: ParamsBusca) {
  const novo = param(await searchParams, 'novo');
  const d = await carregar();
  const gerados = [...d.documentos].sort((a, b) => b.criado.localeCompare(a.criado));
  const drive = d.config.drive_ativo === 'sim' && driveConfigurado();
  return (
    <>
      <Cabecalho titulo="Documentos" sub="Escreva o modelo uma vez e gere preenchido para cada cliente, em Word ou texto." acoes={<Link className="btn" href="/documentos/modelos/novo">Novo modelo</Link>} />
      <section className="papel">
        <h2>Modelos</h2>
        <ul className="lista">
          {d.modelos.map((m) => (
            <li key={m.id}>
              <div className="item-corpo"><Link className="titulo" href={`/documentos/gerar/${m.id}`}>{m.rotulo}</Link>{m.padrao && <div className="meta">Modelo incluído no sistema</div>}</div>
              <div className="item-acoes">
                <Link className="btn mini" href={`/documentos/gerar/${m.id}`}>Gerar documento</Link>
                <Link className="btn mini sec" href={`/documentos/modelos/${m.id}`}>{m.padrao ? 'Copiar e editar' : 'Editar'}</Link>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="papel">
        <div className="papel-cabecalho">
          <h2>Documentos gerados</h2>
          <span className="pequeno discreto">{drive ? 'Enviados também para o Google Drive.' : <>Guardados na pasta “documentos”. <Link href="/ajustes">Ligar o Google Drive</Link></>}</span>
        </div>
        {gerados.length ? (
          <ul className="lista">
            {gerados.map((doc) => (
              <li key={doc.id} className={doc.id === novo ? 'destaque' : undefined}>
                <div className="item-corpo">
                  <strong>{doc.rotulo}</strong> <span className="etiqueta">{doc.formato === 'txt' ? 'Texto (.txt)' : 'Word (.docx)'}</span>
                  <div className="meta">Gerado em {doc.criadoEm.formatada()}{d.processo(doc.processo_id) && `, ${d.processo(doc.processo_id)!.rotulo}`}</div>
                </div>
                <div className="item-acoes">
                  <a className={`btn mini${doc.id === novo ? '' : ' sec'}`} href={`/api/documentos/${doc.id}`}>Baixar</a>
                  {doc.noDrive && <a className="btn mini sec" href={doc.drive_link} target="_blank" rel="noopener noreferrer">Abrir no Drive</a>}
                  <BotaoConfirmar acao={AcoesDocumento.excluir} id={doc.id} mini />
                </div>
              </li>
            ))}
          </ul>
        ) : <Vazio>Nenhum documento gerado ainda.</Vazio>}
      </section>
    </>
  );
}
