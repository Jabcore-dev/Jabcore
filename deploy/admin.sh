#!/usr/bin/env bash
#
# admin.sh - založí nebo změní účet do administrace (e-mail + role).
#
#   ./deploy/admin.sh production admin@jabcore.cz "Michal Petříček" owner
#   ./deploy/admin.sh production admin@jabcore.cz              # jméno a roli se doptá
#
# Role: owner (může spravovat účty) | editor (jen obsah). Výchozí je owner.
#
# Hesla tu nejsou - přihlašuje Jabcore Platform, e-mail musí sedět s účtem
# tam. Tohle je cesta zpátky do panelu, když v něm nezůstal žádný vlastník.
#
# Běží v migrate kontejneru, protože produkční image je Next standalone a tsx
# ani src/ v něm nejsou.

set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

die() { printf '\033[1;31m✖ %s\033[0m\n' "$1" >&2; exit 1; }

ENVIRONMENT="${1:-}"
[ -n "$ENVIRONMENT" ] || die "Použití: ./deploy/admin.sh <prostředí> <e-mail> [jméno] [owner|editor]"

ENV_FILE="deploy/$ENVIRONMENT.env"
[ -f "$ENV_FILE" ] || die "Neznámé prostředí '$ENVIRONMENT' - chybí $ENV_FILE"

EMAIL="${2:-}"
[ -n "$EMAIL" ] || die "Chybí e-mail."
NAME="${3:-}"
ROLE="${4:-owner}"

# shellcheck source=/dev/null
. "./$ENV_FILE"

export ENVIRONMENT
export PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-http://localhost:3000}"
export PORTFOLIO_BASE_URL="${PORTFOLIO_BASE_URL:-$PUBLIC_BASE_URL}"
export STACK_PREFIX="${STACK_PREFIX:-jabcore}"
export BIND_ADDRESS="${BIND_ADDRESS:-127.0.0.1}"
export WEB_PORT="${WEB_PORT:-3000}"
if [ -n "${COMPOSE_PROJECT_NAME:-}" ]; then export COMPOSE_PROJECT_NAME; fi

SECRETS_FILE="${SECRETS_FILE:-deploy/secrets.$ENVIRONMENT.env}"
[ -f "$SECRETS_FILE" ] || die "Chybí $SECRETS_FILE - viz deploy/README.md."
export SECRETS_FILE

POSTGRES_PASSWORD="$(sed -n 's/^[[:space:]]*POSTGRES_PASSWORD=//p' "$SECRETS_FILE" | tail -n1)"
[ -n "$POSTGRES_PASSWORD" ] || die "$SECRETS_FILE: chybí POSTGRES_PASSWORD."
export POSTGRES_PASSWORD

docker compose --env-file "$ENV_FILE" --env-file "$SECRETS_FILE" \
  -f docker-compose.prod.yml --profile tools \
  run --rm -T migrate \
  npx tsx src/db/create-admin.ts "$EMAIL" "$NAME" "$ROLE"
