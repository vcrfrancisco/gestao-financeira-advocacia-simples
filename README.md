# gestao-financeira-advocacia-simples
SALVE DR. RUBENS

Gestão de escritório de advocacia: prazos (dias úteis, feriados, recesso), intimações, agenda,
processos, clientes, financeiro (honorários parcelados, cobrança Pix) e geração de documentos
em Word/TXT com envio opcional ao Google Drive.

**Quem vai usar o programa: leia o [`LEIA-ME.txt`](LEIA-ME.txt).**

## Rodar

Uso no dia a dia: dois cliques em `Abrir-Escritorio.bat` (Windows) ou `Abrir-Escritorio.sh`
(Linux/Mac). O lançador baixa um Node.js portátil para `.node/` se o computador não tiver
Node ≥ 20.9, roda `npm ci` e `next build` quando o lockfile ou `src/` mudaram, sobe
`next start` na porta 3000 e abre o navegador (lógica em `scripts/iniciar.mjs`).

Desenvolvimento:

```bash
npm install
npm run dev      # http://localhost:3000
```

Google Drive (opcional): copie `.env.example` para `.env.local` e preencha o cliente OAuth2
(passo a passo no `LEIA-ME.txt`).

## Stack

Next.js 16 (App Router, Server Components, Server Actions) · React 19 · TypeScript ·
`papaparse` (CSV) · `docx` (Word) · `@googleapis/drive` (OAuth2 + Drive v3) · `qrcode` (Pix).

## Estrutura

```
src/
  dominio/     classes de domínio (sem acesso a disco; também rodam no navegador)
    Lancamento.ts            classe-pai de todos os registros
    Cliente, Processo, Andamento, Prazo, Intimacao, Evento,
    LancamentoFinanceiro, Modelo, Feriado, Documento    filhas, com seus métodos
    Data.ts                  dia do calendário (soma de dias/meses, formatação)
    Calendario.ts            dias úteis, feriados e cálculo de prazos
  acoes/       classes de ações (gravações); cada método estático é uma Server Action
    Acoes.ts                 classe-pai (leitura do formulário, redirecionamento)
    AcoesPrazo, AcoesProcesso, AcoesFinanceiro, ...
  lib/
    tabelas.ts               colunas de cada CSV
    db.ts                    repositório CSV (lê/grava instâncias das classes)
    feriadosBase.ts          base de feriados estaduais/municipais
    drive.ts                 conector Google Drive (OAuth2, escopo drive.file)
  dados/feriados-base.csv    feriados exportados do feriados.dev (2024–2027)
  app/         páginas e rotas de API (download, OAuth, municípios)
  components/  componentes de interface
scripts/iniciar.mjs  lançador (instala, compila se preciso, abre o navegador)
data/          CSVs do escritório (criados no primeiro uso, fora do git)
documentos/    arquivos gerados (fora do git)
```

### Decisões

- **CSV como banco**: uma tabela por arquivo em `data/`, separador `;` e BOM UTF-8 para abrir
  direto no Excel em português. Gravação em fila e por arquivo temporário + `rename`.
- **Domínio em classes**: cada CSV tem uma classe filha de `Lancamento`; as colunas viram
  propriedades por *declaration merging* (`interface Prazo extends Registro<'prazos'>`).
- **Ações em classes**: o Next só aceita `'use server'` em métodos **estáticos** (métodos de
  instância são recusados pelo compilador). As ações são chamadas soltas, por isso usam o nome
  da classe em vez de `this`. Componentes cliente recebem as ações por props.
- **Feriados**: nacionais calculados (qualquer ano) + base do feriados.dev filtrada pela UF e
  município escolhidos em Ajustes + feriados cadastrados à mão (`data/feriados.csv`).
  Fonte: [feriados-dev-oss](https://github.com/feriados-dev/feriados-dev-oss) (MIT, commit
  `2e5e787`), migrações aplicadas num Postgres e exportadas para CSV.
