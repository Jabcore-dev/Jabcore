#!/usr/bin/env bash
#
# build.sh - nasazení webu Jabcore jedním příkazem.
#
# Server potřebuje jen Docker. Nastartuje Postgres, spustí migrace jako
# viditelný one-shot, sestaví a nastartuje web a počká, až nahlásí healthy.
#
# Použití:
#   ./build.sh                 zeptá se, které prostředí nasadit
#   ./build.sh test            nasadí testovací instanci
#   ./build.sh production      nasadí produkci (zeptá se na potvrzení)
#   ./build.sh production -y   …bez potvrzení (CI / cron)
#
# Přepínače:
#   -y, --yes       přeskočí potvrzení produkce
#       --no-pull   neudělá "git pull" (nasadí checkout tak, jak je)
#       --no-cache  sestaví image od nuly, bez Docker cache
#       --logs      po nasazení začne sledovat logy
#   -h, --help      tenhle text
#
# Každé prostředí jsou dva soubory v deploy/:
#
#   deploy/<env>.env            veřejné adresy, porty, názvy kontejnerů  (v gitu)
#   deploy/secrets.<env>.env    heslo k databázi, AUTH_SECRET            (NENÍ v gitu)
#
# Přidat prostředí = přidat ty dva soubory plus blok do Caddyfile.
# Nic tady nezná doménu; viz deploy/README.md.

set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

log()  { printf '\n\033[1;36m▶ %s\033[0m\n' "$1"; }
warn() { printf '\033[1;33m!  %s\033[0m\n' "$1" >&2; }
die()  { printf '\033[1;31m✖ %s\033[0m\n' "$1" >&2; exit 1; }

# Hlavičkový komentář výše je nápověda: vypíše se po první nekomentářový
# řádek, aby se ty dvě věci nikdy nerozešly.
usage() { awk 'NR>1 { if (!/^#/) exit; sub(/^# ?/, ""); print }' "$0"; }

# --- 1. argumenty ------------------------------------------------------------
ENVIRONMENT=""
ASSUME_YES=0
DO_PULL=1
NO_CACHE=""
FOLLOW_LOGS=0

while [ $# -gt 0 ]; do
  case "$1" in
    -y|--yes)   ASSUME_YES=1 ;;
    --no-pull)  DO_PULL=0 ;;
    --no-cache) NO_CACHE="--no-cache" ;;
    --logs)     FOLLOW_LOGS=1 ;;
    -h|--help)  usage; exit 0 ;;
    -*)         die "Neznámý přepínač: $1 (viz ./build.sh --help)" ;;
    *)
      [ -z "$ENVIRONMENT" ] || die "Prostředí zadané dvakrát: $ENVIRONMENT / $1"
      ENVIRONMENT="$1"
      ;;
  esac
  shift
done

# Prostředí se objevují z deploy/*.env, takže nové nevyžaduje změnu tady.
# Soubory secrets.<env>.env se odfiltrují.
list_environments() {
  local f name
  for f in deploy/*.env; do
    [ -e "$f" ] || continue
    name="$(basename "$f" .env)"
    case "$name" in secrets.*) continue ;; esac
    echo "$name"
  done
}

ENVIRONMENTS="$(list_environments)"
[ -n "$ENVIRONMENTS" ] || die "Žádné prostředí - chybí deploy/<env>.env."

# Bez prostředí na příkazové řádce: zeptat se. Neinteraktivní běh (CI, cron) ho
# musí pojmenovat - tiché defaultování je způsob, jak se testovací konfigurace
# dostane na produkční doménu.
if [ -z "$ENVIRONMENT" ]; then
  [ -t 0 ] || die "Nezadané prostředí. Použití: ./build.sh {$(echo $ENVIRONMENTS | tr ' ' '|')}"
  echo
  echo "Které prostředí chceš nasadit?"
  echo
  i=0
  for name in $ENVIRONMENTS; do
    i=$((i + 1))
    target="$(sed -n 's/^PUBLIC_BASE_URL=//p' "deploy/$name.env" | tail -n1)"
    printf '  %d) %-12s %s\n' "$i" "$name" "$target"
  done
  echo
  printf 'Volba [1-%d]: ' "$i"
  read -r choice
  ENVIRONMENT="$(echo $ENVIRONMENTS | cut -d' ' -f"${choice:-0}" 2>/dev/null || true)"
  [ -n "$ENVIRONMENT" ] && [ "${choice:-0}" -ge 1 ] 2>/dev/null || die "Neplatná volba."
fi

ENV_FILE="deploy/$ENVIRONMENT.env"
[ -f "$ENV_FILE" ] || die "Neznámé prostředí '$ENVIRONMENT' - čekal jsem $ENV_FILE. Známá: $(echo $ENVIRONMENTS | tr '\n' ' ')"

command -v docker >/dev/null || die "docker není nainstalovaný"
docker compose version >/dev/null 2>&1 || die "docker compose (v2) není k dispozici"

# --- 2. konfigurace prostředí ------------------------------------------------
# shellcheck source=/dev/null
. "./$ENV_FILE"

export ENVIRONMENT
export PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-http://localhost:3000}"
export PORTFOLIO_BASE_URL="${PORTFOLIO_BASE_URL:-$PUBLIC_BASE_URL}"

# Názvy kontejnerů a publikované porty. Prostředí, které sdílí stroj s jiným,
# si přepíše STACK_PREFIX a porty.
export STACK_PREFIX="${STACK_PREFIX:-jabcore}"
export BIND_ADDRESS="${BIND_ADDRESS:-127.0.0.1}"
export WEB_PORT="${WEB_PORT:-3000}"
# Exportuje se, jen když ho prostředí opravdu nastaví: prázdná hodnota nutí
# compose fallbackovat způsobem, který se mezi verzemi liší, a z názvu projektu
# se skládá název volume s databází.
if [ -n "${COMPOSE_PROJECT_NAME:-}" ]; then export COMPOSE_PROJECT_NAME; fi

DB="$STACK_PREFIX-db"
WEB="$STACK_PREFIX-web"

# --- 3. secrets --------------------------------------------------------------
# Mimo git: heslo k databázi a AUTH_SECRET pro admin panel. Soubor žije na
# serveru a přežije každý git pull.
export SECRETS_FILE="${SECRETS_FILE:-deploy/secrets.$ENVIRONMENT.env}"

if [ ! -f "$SECRETS_FILE" ]; then
  cat >&2 <<EOF

Chybí $SECRETS_FILE - secrets prostředí "$ENVIRONMENT".
Záměrně nejsou v gitu (heslo k databázi, AUTH_SECRET), takže se musí jednou
vytvořit na tomhle serveru:

  cp deploy/secrets.env.template $SECRETS_FILE
  chmod 600 $SECRETS_FILE
  \$EDITOR $SECRETS_FILE

Co do něj patří a proč, je v deploy/README.md.

EOF
  exit 1
fi

# Oba env soubory dostane i compose, aby příkazy vypsané na konci (logy, down)
# fungovaly po zkopírování samy o sobě: bez nich compose nezná heslo k databázi
# ani STACK_PREFIX a odmítne soubor vůbec naparsovat. Hodnoty exportované tímhle
# skriptem stejně vyhrávají - compose dává přednost prostředí shellu před
# --env-file.
COMPOSE="docker compose --env-file $ENV_FILE --env-file $SECRETS_FILE -f docker-compose.prod.yml"

# Přečte jednu hodnotu z KEY=VALUE souboru bez sourcování (heslo může
# obsahovat znaky, které by shell ochotně interpretoval).
env_value() { sed -n "s/^[[:space:]]*$2=//p" "$1" | tail -n1; }

# --- 4. potvrzení před sáhnutím na produkci ----------------------------------
if [ "$ENVIRONMENT" = "production" ] && [ "$ASSUME_YES" -ne 1 ]; then
  [ -t 0 ] || die "Odmítám neinteraktivní produkční deploy bez --yes."
  echo
  printf '\033[1;33mChystáš se nasadit PRODUKCI: %s\033[0m\n' "$PUBLIC_BASE_URL"
  printf 'Napiš "%s" pro pokračování: ' "$ENVIRONMENT"
  read -r answer
  [ "$answer" = "$ENVIRONMENT" ] || die "Zrušeno."
fi

# --- 5. stažení posledního kódu ----------------------------------------------
if [ "$DO_PULL" -eq 1 ] && [ -d .git ]; then
  log "git pull ($ENVIRONMENT)"
  # Neúspěšný pull se nesmí ignorovat: tiše by znovu nasadil STARÝ kód pod
  # hláškou o úspěchu. Obvyklá příčina jsou lokální změny na serveru.
  before="$(git rev-parse HEAD)"
  git pull --ff-only || die "git pull selhal - odmítám nasadit starý kód.
Vyřeš lokální změny na serveru (git status) a spusť znovu."
  after="$(git rev-parse HEAD)"
  # bash čte tenhle soubor za běhu, takže pull, který ho přepsal uprostřed, by
  # spustil směs starého a nového skriptu. Začni znovu tím novým.
  if [ "$before" != "$after" ]; then
    log "Repozitář aktualizován ($(git rev-parse --short "$before") → $(git rev-parse --short "$after")) - restartuji build.sh"
    exec "$0" "$ENVIRONMENT" --no-pull --yes
  fi
fi

# --- 6. odmítnout konfiguraci, která nemůže fungovat -------------------------
POSTGRES_PASSWORD="$(env_value "$SECRETS_FILE" POSTGRES_PASSWORD)"
[ -n "$POSTGRES_PASSWORD" ] || die "$SECRETS_FILE: chybí POSTGRES_PASSWORD.
Vygeneruj ho: openssl rand -hex 24"

# compose skládá DATABASE_URL řetězcovou interpolací, takže heslo obsahující
# @ : / ? # nebo % by tiše vyrobilo jiný connection string, než se zamýšlelo -
# obvykle takový, který se pořád připojí, jen jinam.
case "$POSTGRES_PASSWORD" in
  *[!A-Za-z0-9_-]*) die "POSTGRES_PASSWORD smí obsahovat jen A-Z a-z 0-9 _ -
(skládá se z něj DATABASE_URL, znaky jako @ : / % by URL rozbily).
Vygeneruj nové: openssl rand -hex 24" ;;
esac
export POSTGRES_PASSWORD

if [ "$ENVIRONMENT" = "production" ]; then
  # Produkční pojistky. Každá z nich je způsob, jak nasadit něco, co vypadá
  # v pořádku a není: web po prostém HTTP, sdílené defaultní heslo, nebo admin
  # panel s podepisovacím klíčem, který zná celý internet z gitu.
  problems=""
  case "$PUBLIC_BASE_URL" in
    http://*) problems="$problems\n  - PUBLIC_BASE_URL musí být https (deploy/$ENVIRONMENT.env)" ;;
  esac
  case "$PORTFOLIO_BASE_URL" in
    http://*) problems="$problems\n  - PORTFOLIO_BASE_URL musí být https (deploy/$ENVIRONMENT.env)" ;;
  esac
  case "$POSTGRES_PASSWORD" in
    jabcore|postgres|changeme|secret) problems="$problems\n  - POSTGRES_PASSWORD je pořád defaultní hodnota" ;;
  esac

  auth_secret="$(env_value "$SECRETS_FILE" AUTH_SECRET)"
  [ "${#auth_secret}" -ge 32 ] || problems="$problems\n  - AUTH_SECRET musí mít alespoň 32 znaků (openssl rand -hex 32)"

  # Jen varování: bez klíče web běží, chybí jen překlad v adminu.
  [ -n "$(env_value "$SECRETS_FILE" GEMINI_API_KEY)" ] \
    || warn "GEMINI_API_KEY chybí v $SECRETS_FILE - automatický překlad referencí nebude fungovat."

  if [ -n "$problems" ]; then
    printf '\033[1;31m✖ Produkční konfigurace není bezpečná k nasazení:\033[0m' >&2
    printf "$problems\n\n" >&2
    exit 1
  fi

  if [ -d .git ]; then
    branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
    [ "$branch" = "main" ] || warn "Nasazuješ větev '$branch', ne main."
  fi
fi

log "Nasazuji $ENVIRONMENT"
printf '  web          %-38s → %s:%s\n' "$PUBLIC_BASE_URL" "$BIND_ADDRESS" "$WEB_PORT"
printf '  portfolio    %-38s → %s:%s\n' "$PORTFOLIO_BASE_URL" "$BIND_ADDRESS" "$WEB_PORT"
printf '  kontejnery   %s-*\n' "$STACK_PREFIX"
printf '  secrets      %s\n' "$SECRETS_FILE"

# --- 7. identita buildu ------------------------------------------------------
# Zapéká se do prostředí webu, takže /api/health hlásí, co doopravdy běží.
# BUILD_TIME je ta, která funguje vždycky: odpoví na "je tohle ten deploy, co
# jsem právě spustil?" i když nikdo nezvedl verzi. Na deploy serveru není node
# (všechno běží v Dockeru), proto verze padá zpátky na sed - jinak by každý
# deploy hlásil "unknown", což je přesně ta nejednoznačnost, kvůli které tohle
# existuje.
APP_VERSION="$(node -p "require('./package.json').version" 2>/dev/null ||
  sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' package.json | head -1)"
export APP_VERSION="${APP_VERSION:-unknown}"
export BUILD_COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
export BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
log "Build $APP_VERSION ($BUILD_COMMIT) v $BUILD_TIME"

# --- 8. sestavení image + start databáze -------------------------------------
log "Buildím image a startuji Postgres"
$COMPOSE build $NO_CACHE web
$COMPOSE --profile tools build $NO_CACHE migrate
$COMPOSE up -d db

log "Čekám, až bude Postgres healthy"
db_status=""
for i in $(seq 1 60); do
  db_status="$(docker inspect --format '{{.State.Health.Status}}' "$DB" 2>/dev/null || echo starting)"
  [ "$db_status" = "healthy" ] && break
  sleep 2
done
[ "$db_status" = "healthy" ] || { $COMPOSE logs --tail 40 db >&2; die "Postgres nenaběhl"; }

# --- 9. migrace jako viditelný one-shot --------------------------------------
# Streamované naživo místo schování do startu webu, kde by s nimi healthcheck
# závodil: čeká se přesně tak dlouho, jak trvají, a případná chyba je vidět
# celá. Migrace jdou jen dopředu - vrátit kód na starší commit funguje, vrátit
# schéma ne.
if [ -d src/db/migrations ]; then
  log "Spouštím databázové migrace"
  if ! $COMPOSE --profile tools run --rm --no-deps migrate; then
    cat >&2 <<EOF

Migrace selhaly. Obvyklá příčina, chyba výše říká která:

1) Authentication failed / heslo nesedí
   Postgres si heslo uložil při prvním startu do volume a POSTGRES_PASSWORD
   v $SECRETS_FILE ho nepřepíše. Buď vrať do souboru to původní,
   nebo ho změň i uvnitř:
     docker exec -it $DB psql -U jabcore -d jabcore -c "ALTER USER jabcore WITH PASSWORD 'nove';"

2) Konflikt ve schématu
   Migrace už částečně proběhla. Podívej se na stav:
     docker exec -it $DB psql -U jabcore -d jabcore -c "\\dt"

EOF
    die "Nasazení zastaveno před startem webu."
  fi
else
  warn "src/db/migrations neexistuje - přeskakuji migrace (fáze 2 plánu)."
fi

# --- 10. start webu, pak čekání na healthy -----------------------------------
# Starý kontejner obsluhuje provoz po celou dobu buildu image výše; teprve
# tady se vymění.
log "Startuji web"
$COMPOSE up -d --no-deps web

log "Čekám, až bude web healthy"
web_status=""
for i in $(seq 1 60); do
  web_status="$(docker inspect --format '{{.State.Health.Status}}' "$WEB" 2>/dev/null || echo starting)"
  [ "$web_status" = "healthy" ] && break
  if [ "$web_status" = "unhealthy" ]; then
    $COMPOSE logs --tail 60 web >&2
    die "Web je unhealthy - logy výše."
  fi
  sleep 5
done
[ "$web_status" = "healthy" ] || { $COMPOSE logs --tail 60 web >&2; die "Web nenaběhl včas"; }

log "Hotovo - $ENVIRONMENT běží."
cat <<EOF

  Web       : $PUBLIC_BASE_URL
  Portfolio : $PORTFOLIO_BASE_URL
  Admin     : $PUBLIC_BASE_URL/admin
  Health    : $PUBLIC_BASE_URL/api/health   (hlásí commit $BUILD_COMMIT)

  Update    : ./build.sh $ENVIRONMENT
  Logy      : $COMPOSE logs -f
  Stop      : $COMPOSE down
  Záloha    : ./deploy/backup.sh $ENVIRONMENT
EOF

if [ "$FOLLOW_LOGS" -eq 1 ]; then
  echo
  $COMPOSE logs -f web
fi
