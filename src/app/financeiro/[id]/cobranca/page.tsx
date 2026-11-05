import Link from 'next/link';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { AcoesFinanceiro } from '@/acoes/AcoesFinanceiro';
import { BotaoCopiar } from '@/components/BotaoCopiar';
import { BotaoAcao, Cabecalho, type ParamsId } from '@/components/ui';
import { carregar } from '@/lib/db';

export const metadata = { title: 'Cobrança' };

export default async function Cobranca({ params }: ParamsId) {
  const { id } = await params;
  const d = await carregar();
  const l = d.financeiro.find((x) => x.id === id);
  if (!l) notFound();
  const cli = d.cliente(l.cliente_id);
  let pix = '';
  let erro = '';
  try { pix = l.pix(d.config); } catch (e) { erro = (e as Error).message; }
  const qr = pix ? await QRCode.toString(pix, { type: 'svg', margin: 2, errorCorrectionLevel: 'M' }) : '';
  const mensagem = l.mensagemDeCobranca(d.config, cli, pix);
  const whats = cli?.whatsapp(mensagem);

  return (
    <>
      <Cabecalho
        titulo={`Cobrar ${l.valorFormatado}`}
        sub={`${l.rotulo}${cli ? `, ${cli.nome}` : ''}. Vencimento em ${l.vence.formatada()}.`}
        acoes={<BotaoAcao acao={AcoesFinanceiro.receberCobranca} id={id} classe="btn sec">Registrar recebimento</BotaoAcao>}
      />
      <div className="colunas">
        <section className="papel">
          <h2>Pix</h2>
          {erro ? <><p>{erro}</p><Link className="btn sec" href="/ajustes">Configurar Pix</Link></> : (
            <>
              <div className="qr" role="img" aria-label="QR Code do Pix" dangerouslySetInnerHTML={{ __html: qr }} />
              <p className="rotulo" style={{ marginTop: '1rem' }}>Pix copia e cola</p>
              <div className="codigo-pix" id="codigo-pix">{pix}</div>
              <div className="rodape-form"><BotaoCopiar alvo="#codigo-pix" rotulo="Copiar código" /></div>
              <p className="pequeno discreto">Confira o recebimento no aplicativo do banco antes de dar baixa.</p>
            </>
          )}
        </section>
        <section className="papel">
          <h2>Mensagem para o cliente</h2>
          <div className="campo"><label className="oculto" htmlFor="mensagem">Mensagem</label><textarea id="mensagem" rows={10} defaultValue={mensagem} /></div>
          <div className="rodape-form">
            {whats ? <a className="btn" href={whats} target="_blank" rel="noopener noreferrer">Enviar pelo WhatsApp</a> : <span className="discreto pequeno">Cadastre o celular do cliente para enviar pelo WhatsApp.</span>}
            <BotaoCopiar alvo="#mensagem" rotulo="Copiar mensagem" />
          </div>
        </section>
      </div>
    </>
  );
}
