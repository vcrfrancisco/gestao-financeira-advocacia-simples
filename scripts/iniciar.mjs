// Abre o programa: instala/compila quando precisa, liga o servidor e abre o navegador.
// Chamado por Abrir-Escritorio.bat (Windows) e Abrir-Escritorio.sh (Linux/Mac).
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, realpathSync, statSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Porta fixa: é a mesma cadastrada no Google para o retorno do login do Drive.
const PORTA = 3000;
const ENDERECO = `http://localhost:${PORTA}`;
const NEXT = path.join(RAIZ, 'node_modules', 'next', 'dist', 'bin', 'next');
const env = { ...process.env, NEXT_TELEMETRY_DISABLED: '1' };
process.chdir(RAIZ);

const data = (p) => (existsSync(p) ? statSync(p).mtimeMs : 0);
const maisNovo = (...caminhos) => Math.max(...caminhos.flatMap((p) => (existsSync(p) && statSync(p).isDirectory()
  ? readdirSync(p, { recursive: true }).map((f) => data(path.join(p, String(f))))
  : [data(p)])));

function rodar(mensagem, args) {
  console.log(`\n${mensagem}\n`);
  const r = spawnSync(process.execPath, args, { stdio: 'inherit', env });
  if (r.status !== 0) throw new Error(`${mensagem.replace(/\.+$/, '')} não deu certo.`);
}

// npm vem junto do Node; o caminho muda entre o pacote do Windows e o de Linux/Mac.
function npm() {
  const dir = path.dirname(realpathSync(process.execPath));
  const cli = [path.join(dir, 'node_modules', 'npm', 'bin', 'npm-cli.js'), path.join(dir, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js')].find(existsSync);
  if (!cli) throw new Error('Não encontrei o npm junto do Node.js.');
  return cli;
}

const portaLivre = () => new Promise((ok) => {
  const s = net.createServer().once('error', () => ok(false)).once('listening', () => s.close(() => ok(true)));
  s.listen(PORTA);
});

async function programaRespondendo() {
  try {
    const r = await fetch(ENDERECO, { signal: AbortSignal.timeout(3000) });
    return (await r.text()).includes('Gestão do escritório');
  } catch {
    return false;
  }
}

function abrirNavegador() {
  const opcoes = { detached: true, stdio: 'ignore' };
  if (process.platform === 'win32') spawn('cmd', ['/c', `start "" "${ENDERECO}"`], { ...opcoes, windowsVerbatimArguments: true }).unref();
  else spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [ENDERECO], opcoes).unref();
}

async function principal() {
  // Já aberto (outra janela): só mostra de novo no navegador.
  if (await programaRespondendo()) {
    console.log(`O programa já está aberto em ${ENDERECO}.`);
    abrirNavegador();
    return;
  }
  if (!(await portaLivre())) throw new Error(`Outro programa está usando a porta ${PORTA}. Feche-o e tente de novo.`);

  if (data('package-lock.json') > data(path.join('node_modules', '.package-lock.json'))) {
    rodar('Instalando os componentes do programa (só na primeira vez ou após atualização; pode levar alguns minutos)...', [npm(), 'ci', '--no-audit', '--no-fund']);
  }
  if (maisNovo('src', 'package-lock.json', 'next.config.ts', 'tsconfig.json') > data(path.join('.next', 'BUILD_ID'))) {
    rodar('Preparando o programa (só na primeira vez ou após atualização)...', [NEXT, 'build']);
  }

  console.log('\nAbrindo o programa...');
  // Só neste computador: sem -H o Next escuta em 0.0.0.0 e qualquer um na mesma rede abriria os dados.
  const servidor = spawn(process.execPath, [NEXT, 'start', '-p', String(PORTA), '-H', '127.0.0.1'], { stdio: ['ignore', 'ignore', 'inherit'], env });
  servidor.on('exit', (codigo) => process.exit(codigo ?? 0));
  for (let i = 0; i < 120 && !(await programaRespondendo()); i += 1) await new Promise((r) => setTimeout(r, 500));
  if (!(await programaRespondendo())) {
    servidor.kill();
    throw new Error('O programa não respondeu a tempo.');
  }

  abrirNavegador();
  console.log(`\n  Pronto! O programa está aberto no navegador: ${ENDERECO}\n`);
  console.log('  Deixe esta janela aberta enquanto usa o programa.');
  console.log('  Para fechar o programa, feche esta janela.\n');
}

principal().catch((e) => {
  console.error(`\nERRO: ${e.message}\n`);
  process.exit(1);
});
