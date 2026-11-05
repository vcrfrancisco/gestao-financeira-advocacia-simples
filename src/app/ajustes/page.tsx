import { AcoesAjustes } from '@/acoes/AcoesAjustes';
import { Formulario } from '@/components/Formulario';
import { SeletorLocal } from '@/components/SeletorLocal';
import { BotaoAcao, Cabecalho } from '@/components/ui';
import { carregar } from '@/lib/db';
import { driveConectado, driveConfigurado } from '@/lib/drive';
import { anosCobertos, estados, municipios } from '@/lib/feriadosBase';
import { Calendario } from '@/dominio/Calendario';
import { Data } from '@/dominio/Data';
import type { Config } from '@/lib/tabelas';

export const metadata = { title: 'Ajustes' };

export default async function Ajustes() {
  const d = await carregar();
  const c = d.config;
  const ano = Data.hoje().ano;
  const opcoes = await d.calendario();
  const calendario = new Calendario(opcoes);
  const doAno = opcoes.feriados.filter((f) => f.data.startsWith(String(ano)));
  const considerados = [...new Map([...calendario.nacionais(ano), ...doAno.map((f) => [f.data, f.descricao] as const)])].sort(([a], [b]) => a.localeCompare(b));
  const opcionais = c.feriados_opcionais.split(',');
  const cobertura = await anosCobertos();
  const configurado = driveConfigurado();
  const conectado = await driveConectado();
  const driveLigado = c.drive_ativo === 'sim';
  const texto = (n: keyof Config, rotulo: string, extra: Record<string, string | number> = {}, largo = false) => (
    <div className={`campo${largo ? ' largo' : ''}`}><label htmlFor={n}>{rotulo}</label><input id={n} name={n} type="text" defaultValue={c[n]} {...extra} /></div>
  );

  return (
    <>
      <Cabecalho titulo="Ajustes" />
      <div className="aviso">Seus dados ficam em planilhas (CSV) na pasta <strong>data</strong> do programa, só neste computador. Para fazer cópia de segurança, copie essa pasta e a pasta <strong>documentos</strong>.</div>

      <Formulario acao={AcoesAjustes.salvar} rotulo="Salvar ajustes" className="">
        <section className="papel">
          <h2>Seus dados</h2>
          <p className="discreto pequeno">Usados em procurações, contratos e mensagens de cobrança.</p>
          <div className="campos">
            {texto('adv_nome', 'Nome completo', {}, true)}
            {texto('adv_oab', 'Nº da OAB', { inputMode: 'numeric' })}
            {texto('adv_uf', 'UF da OAB', { maxLength: 2 })}
            {texto('adv_email', 'E-mail', { inputMode: 'email' })}
            {texto('adv_cidade', 'Cidade (para datar documentos)')}
            {texto('adv_endereco', 'Endereço do escritório', {}, true)}
          </div>
        </section>
        <section className="papel">
          <h2>Pix para cobranças</h2>
          <div className="campos">
            {texto('pix_chave', 'Chave Pix', { placeholder: 'CPF, CNPJ, e-mail, +5531999999999 ou aleatória' }, true)}
            {texto('pix_nome', 'Nome do recebedor')}
            {texto('pix_cidade', 'Cidade do recebedor')}
          </div>
        </section>
        <section className="papel">
          <h2>Calendário de prazos</h2>
          <p>Fins de semana, feriados nacionais, Carnaval e Sexta-feira Santa já são considerados. Escolha onde você atua para incluir os feriados estaduais e municipais da base <a href="https://feriados.dev" target="_blank" rel="noopener noreferrer">feriados.dev</a> ({cobertura.de} a {cobertura.ate}).</p>
          <SeletorLocal estados={await estados()} uf={c.feriados_uf} municipio={c.feriados_municipio} municipiosIniciais={await municipios(c.feriados_uf)} />
          <fieldset>
            <legend>Feriados opcionais nos tribunais onde você atua</legend>
            {Object.entries(Calendario.FERIADOS_OPCIONAIS).map(([k, n]) => (
              <label key={k} className="opcao"><input type="checkbox" name="feriados_opcionais" value={k} defaultChecked={opcionais.includes(k)} /> {n}</label>
            ))}
            <label className="opcao"><input type="checkbox" name="recesso" value="1" defaultChecked={c.recesso !== 'nao'} /> Suspender prazos no recesso de 20 de dezembro a 20 de janeiro (art. 220 do CPC)</label>
          </fieldset>
          <details style={{ marginTop: '.75rem' }}>
            <summary>Ver feriados considerados em {ano}</summary>
            <ul className="pequeno">{considerados.map(([data, nome]) => <li key={data}>{Data.de(data).formatada()}, {Data.de(data).nomeDoDia}: {nome}</li>)}</ul>
          </details>
        </section>
      </Formulario>

      <section className="papel" style={{ marginTop: '1.25rem' }}>
        <h2>Feriados locais e suspensões de expediente</h2>
        <p className="discreto pequeno">Para datas que não estão na base: aniversário da comarca, suspensões do tribunal etc.</p>
        {d.feriados.length > 0 && (
          <ul className="lista" style={{ marginBottom: '1rem' }}>
            {[...d.feriados].sort((a, b) => a.data.localeCompare(b.data)).map((f) => (
              <li key={f.id}>
                <div className="item-corpo"><strong>{f.dia.formatada()}</strong>, {f.rotulo}</div>
                <div className="item-acoes"><BotaoAcao acao={AcoesAjustes.removerFeriado} id={f.id} classe="btn mini perigo">Remover</BotaoAcao></div>
              </li>
            ))}
          </ul>
        )}
        <Formulario acao={AcoesAjustes.adicionarFeriado} rotulo="Adicionar" className="">
          <div className="linha-form">
            <div className="campo" style={{ flex: '0 1 11rem' }}><label htmlFor="f-data">Data</label><input id="f-data" name="data" type="date" required /></div>
            <div className="campo" style={{ flex: '2 1 14rem' }}><label htmlFor="f-desc">Descrição</label><input id="f-desc" name="descricao" type="text" placeholder="Ex.: Aniversário da cidade" required /></div>
          </div>
        </Formulario>
      </section>

      <section className="papel" id="drive">
        <h2>Google Drive</h2>
        <p>Quando ligado, cada documento gerado também é enviado para a pasta <strong>Escritório – Documentos</strong> no seu Google Drive. O programa só enxerga os arquivos que ele mesmo criou lá.</p>
        {!configurado ? (
          <div className="aviso alerta">Para usar o Drive, é preciso cadastrar o acesso do Google uma única vez (arquivo <code>.env.local</code>). O passo a passo está no arquivo <strong>LEIA-ME.txt</strong>.</div>
        ) : (
          <>
            <form action={AcoesAjustes.alternarDrive}>
              <input type="hidden" name="ativo" value={driveLigado ? 'nao' : 'sim'} />
              <p>
                Envio para o Drive: <span className={`etiqueta ${driveLigado ? 'ok' : ''}`}>{driveLigado ? 'Ligado' : 'Desligado'}</span>{' '}
                <button className="btn mini sec" role="switch" aria-checked={driveLigado}>{driveLigado ? 'Desligar' : 'Ligar'}</button>
              </p>
            </form>
            {driveLigado && (
              conectado ? (
                <div className="acoes">
                  <span className="etiqueta ok">Conta Google conectada</span>
                  <form action={AcoesAjustes.desconectarDrive} className="inline"><button className="btn mini perigo">Desconectar conta</button></form>
                </div>
              ) : (
                <a className="btn" href="/api/google/conectar">Conectar conta Google</a>
              )
            )}
          </>
        )}
      </section>
    </>
  );
}
