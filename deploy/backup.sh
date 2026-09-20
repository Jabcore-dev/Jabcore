#!/usr/bin/env bash
#
# backup.sh — záloha jednoho prostředí.
#
# Zálohuje DVĚ věci, protože ani jedna sama o sobě nestačí k obnovení webu:
#   1) databázi        (pg_dump — texty referencí, uživatelé adminu)
#   2) volume uploads  (nahrané obrázky — v gitu nejsou a v image taky ne)
#
# Použití:
#   ./deploy/backup.sh production
#   ./deploy/backup.sh production /mnt/zalohy    # jiný cíl než ./backups
#
# Do cronu (denně ve 3:20):
#   20 3 * * * cd /srv/jabcore && ./deploy/backup.sh production >> /var/log/jabcore-backup.log 2>&1
#
# Zálohy na stejném disku jako data nejsou záloha. Odvez je pryč — rsync,
# rclone, cokoliv — jinak je jeden mrtvý disk vezme s sebou.

set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

die() { printf '\033[1;31m✖ %s\033[0m\n' "$1" >&2; exit 1; }
log() { printf '\033[1;36m▶ %s\033[0m\n' "$1"; }

ENVIRONMENT="${1:-}"
[ -n "$ENVIRONMENT" ] || die "Použití: ./deploy/backup.sh <prostředí> [cílový adresář]"

ENV_FILE="deploy/$ENVIRONMENT.env"
[ -f "$ENV_FILE" ] || die "Neznámé prostředí '$ENVIRONMENT' — chybí $ENV_FILE"

# shellcheck source=/dev/null
. "./$ENV_FILE"

STACK_PREFIX="${STACK_PREFIX:-jabcore}"
DB="$STACK_PREFIX-db"
WEB="$STACK_PREFIX-web"

DEST="${2:-backups}/$ENVIRONMENT"
mkdir -p "$DEST"

STAMP="$(date +%Y-%m-%d_%H%M%S)"

docker inspect "$DB" >/dev/null 2>&1 || die "Kontejner $DB neběží — není co zálohovat."

# --- databáze ----------------------------------------------------------------
# Custom formát (-Fc) místo prostého SQL: je komprimovaný a dá se z něj obnovit
# i jedna tabulka přes pg_restore.
log "Zálohuji databázi → $DEST/db_$STAMP.dump"
docker exec "$DB" pg_dump -U jabcore -d jabcore -Fc > "$DEST/db_$STAMP.dump.tmp"
mv "$DEST/db_$STAMP.dump.tmp" "$DEST/db_$STAMP.dump"

# --- nahrané soubory ---------------------------------------------------------
# Čte se z běžícího web kontejneru, kde je volume namountované. Když web zrovna
# neběží, databáze je zazálohovaná i tak a skript to řekne nahlas místo aby
# tiše vyrobil zálohu bez obrázků.
if docker inspect "$WEB" >/dev/null 2>&1; then
  log "Zálohuji nahrané soubory → $DEST/uploads_$STAMP.tar.gz"
  docker exec "$WEB" tar -czf - -C /app/public uploads > "$DEST/uploads_$STAMP.tar.gz.tmp"
  mv "$DEST/uploads_$STAMP.tar.gz.tmp" "$DEST/uploads_$STAMP.tar.gz"
else
  printf '\033[1;33m!  Kontejner %s neběží — obrázky NEJSOU v téhle záloze.\033[0m\n' "$WEB" >&2
fi

# --- úklid -------------------------------------------------------------------
# Drží 30 posledních záloh od každého druhu. Bez tohohle cron za rok zaplní disk.
KEEP=30
for pattern in 'db_*.dump' 'uploads_*.tar.gz'; do
  # shellcheck disable=SC2012
  ls -1t "$DEST"/$pattern 2>/dev/null | tail -n +$((KEEP + 1)) | while read -r old; do
    echo "  mažu starou zálohu: $(basename "$old")"
    rm -f "$old"
  done
done

log "Hotovo."
du -sh "$DEST"
cat <<EOF

  Obnova databáze:
    docker exec -i $DB pg_restore -U jabcore -d jabcore --clean --if-exists < $DEST/db_<stamp>.dump

  Obnova souborů:
    docker exec -i $WEB tar -xzf - -C /app/public < $DEST/uploads_<stamp>.tar.gz

EOF
