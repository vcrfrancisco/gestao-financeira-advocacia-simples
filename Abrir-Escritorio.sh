#!/usr/bin/env bash
# Dois cliques (ou "Executar como programa") para abrir o Escritório no Linux ou no Mac.
# Se o computador não tiver Node.js, baixa uma cópia só para o programa, na pasta .node.
cd "$(dirname "$0")" || exit 1
VERSAO=v26.13.0

falhar() { echo; echo "ERRO: $1"; read -rp "Aperte Enter para fechar." _; exit 1; }
node_serve() { command -v node >/dev/null && node -e 'const [a,b]=process.versions.node.split(".").map(Number); process.exit(a>20||(a===20&&b>=9)?0:1)'; }

if ! node_serve; then
  if [ ! -x .node/bin/node ]; then
    case "$(uname -s)-$(uname -m)" in
      Linux-x86_64) PACOTE=linux-x64 ;; Linux-aarch64) PACOTE=linux-arm64 ;;
      Darwin-arm64) PACOTE=darwin-arm64 ;; Darwin-x86_64) PACOTE=darwin-x64 ;;
      *) falhar "Este sistema não é suportado." ;;
    esac
    echo "Preparando o programa pela primeira vez (baixando o Node.js)..."
    rm -rf .node-baixando && mkdir .node-baixando || falhar "Não consegui criar a pasta .node."
    curl -fL --progress-bar "https://nodejs.org/dist/$VERSAO/node-$VERSAO-$PACOTE.tar.gz" | tar -xz -C .node-baixando --strip-components=1 \
      || falhar "Não consegui baixar o Node.js. Verifique a internet e tente de novo."
    mv .node-baixando .node
  fi
  export PATH="$PWD/.node/bin:$PATH"
fi

node scripts/iniciar.mjs || falhar "O programa não abriu (veja a mensagem acima)."
