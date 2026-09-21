# Nasazení

Server potřebuje **jen Docker** (a Caddy jako reverse proxy). Všechno ostatní
dělá `./build.sh` z kořene repozitáře.

```bash
./build.sh                 # zeptá se, které prostředí
./build.sh test            # testovací instance
./build.sh production      # produkce (zeptá se na potvrzení)
./build.sh --help          # všechny přepínače
```

## Jak je to poskládané

Jedna aplikace obsluhuje **obě domény**. Který web se naservíruje rozhoduje
[`src/middleware.ts`](../src/middleware.ts) podle hlavičky `Host`:

| Doména | Co servíruje |
|---|---|
| `jabcore.cz` | hlavní web |
| `portfolio.jabcore.cz` | portfolio onepager |

Proto oba bloky v `Caddyfile` míří na stejný port a Caddy nesmí `Host`
přepisovat.

Kontejnery publikují port jen na `127.0.0.1` - ven se dá jen přes Caddy,
který terminuje TLS.

## Prostředí

Každé prostředí jsou dva soubory:

| Soubor | Obsah | V gitu |
|---|---|---|
| `deploy/<env>.env` | adresy, porty, názvy kontejnerů | ano |
| `deploy/secrets.<env>.env` | heslo k DB, `AUTH_SECRET`, `GEMINI_API_KEY` | **ne** |

Nové prostředí = ty dva soubory plus blok v `Caddyfile`. `build.sh` si je najde
sám, není ho potřeba upravovat.

## První instalace na serveru

```bash
git clone <repo> /srv/jabcore && cd /srv/jabcore

cp deploy/secrets.env.template deploy/secrets.production.env
chmod 600 deploy/secrets.production.env
openssl rand -hex 24   # → POSTGRES_PASSWORD
openssl rand -hex 32   # → AUTH_SECRET
# GEMINI_API_KEY z https://aistudio.google.com/apikey (překlad referencí, nepovinné)
$EDITOR deploy/secrets.production.env

./build.sh production
```

Pak přidat bloky z `deploy/Caddyfile` do `/etc/caddy/Caddyfile`
a `systemctl reload caddy`.

## Administrace

Panel je na `/admin`. První účet se zakládá z příkazové řádky, protože panel
sám registraci nemá:

```bash
./deploy/admin.sh production admin@jabcore.cz "Michal Petříček" owner
```

Stejný příkaz na existující e-mail **změní heslo** - tak se dá panel odemknout,
když se heslo zapomene.

Role: `owner` spravuje i účty, `editor` jen obsah. Poslední vlastník nejde
smazat ani degradovat, jinak by se ze správy účtů nikdo nedostal zpět.

## Obrázky referencí

Ideální rozměr je **1920 × 1080 px**, tedy poměr 16:9. Napsané je to i v adminu
u pole pro nahrání a při nahrání nevhodného obrázku se objeví upozornění.

Proč zrovna 16:9: obrázek se zobrazuje na třech místech s různými poměry -
karta v seznamu 16:10, detail reference 16:9 a náhled při sdílení 1,91:1.
Všude se ořezává na střed, takže 16:9 leží mezi nimi a z každé strany zmizí
jen pár procent. Proto **důležité nech blíž středu**.

Minimum je 1200 × 675 px, strop 12 MB. Převod do WebP a zmenšení na 2000 px
proběhne automaticky při nahrání.

## Zálohy

```bash
./deploy/backup.sh production
```

Zálohuje **databázi i nahrané obrázky** - obrázky nejsou v gitu ani v image,
takže samotný `pg_dump` web neobnoví. Do cronu:

```
20 3 * * * cd /srv/jabcore && ./deploy/backup.sh production >> /var/log/jabcore-backup.log 2>&1
```

> Zálohy na stejném disku jako data nejsou záloha. Odvez je pryč.

## Ověření, že deploy projel

```bash
curl -s https://jabcore.cz/api/health | jq
```

Vrací `commit` a `buildTime` toho, co doopravdy běží - porovnej s tím, co
vypsal `build.sh`. Když se liší, běží starý kontejner.

## Když se něco pokazí

| Příznak | Příčina |
|---|---|
| `Authentication failed` při migracích | Postgres si heslo uložil při prvním startu do volume; změna v secrets ho nepřepíše. Návod vypíše `build.sh`. |
| Web hlásí `unhealthy` | `docker compose -f docker-compose.prod.yml logs web` |
| Deploy proběhl, web je starý | Caddy míří na jiný port, než je `WEB_PORT` v `<env>.env` |
| Testovací instance v Googlu | `NEXT_PUBLIC_SITE_ENV` není `test` - kontroluj `/robots.txt` |
