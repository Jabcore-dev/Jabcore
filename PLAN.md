# Plán: server, admin panel a portfolio.jabcore.cz

Migrace webu jabcore.cz ze statického exportu na GitHub Pages na vlastní server
s databází, administrací obsahu a druhou doménou pro portfolio.

Stav: **fáze 1, 2, 4 a 5 hotové** — zbývá fáze 3 (admin panel) a volitelná fáze 6.

---

## Proč

Dnešní stav ([next.config.ts](next.config.ts) s `output: 'export'`) znamená:

- obsah se dá měnit jen commitem do gitu,
- reference/portfolio nemá kde žít,
- všechny views jsou `'use client'` a texty tahají přes `useTranslation()`, takže
  [src/lib/i18n.ts](src/lib/i18n.ts) importuje všech 12 jazyků najednou —
  každý návštěvník stahuje **~356 KB překladů** včetně jedenácti, které neuvidí,
- zdvojený strom rout (`src/app/about` + `src/app/[locale]/about`) existuje jen
  proto, že statický export neumí přesměrovat na serveru.

Cíl: obsah v databázi, editovatelný přes vlastní admin panel, web renderovaný na
serveru, portfolio na samostatné doméně.

---

## Architektonická rozhodnutí

### Databáze: vlastní Postgres, ne Supabase

Supabase *je* Postgres s auth, storage a REST vrstvou navrch. Z toho bychom
využili prakticky jen databázi — auth řešíme pro pár lidí, realtime nepotřebujeme,
RLS nedává smysl, když k DB sahá jen náš server. Free tier navíc projekt po týdnu
nečinnosti uspí, takže reálně Pro ~25 USD/měs.

Když na serveru stejně poběží Node runtime, je Postgres jeden další kontejner.
Data u sebe, nulová cena navíc, žádná latence přes internet. Zálohy řeší
`deploy/backup.sh`.

### ORM: Drizzle

SQL-like API, migrace jako čitelné `.sql` soubory, žádný codegen krok ani binárka
navíc v Docker image (na rozdíl od Prismy, kterou používá jabcore-finance —
tam ale běží samostatné API, tady jde o jeden Next.js kontejner).

### Překlady: oddělená tabulka, ne sloupce

```
references          id, slug, client_name, year, industry, project_url,
                    cover_image, tech[], sort_order, published, created_at
reference_locales   reference_id, locale, title, summary, body,
                    testimonial, testimonial_author
                    PK (reference_id, locale)
```

Přidání jazyka je řádek navíc, ne migrace schématu. Frontend čte `locale`
s fallbackem na `cs`, stejně jako to dnes dělá [server-i18n.ts](src/lib/server-i18n.ts).

### Co jde do DB a co ne

| Zůstává v `src/locales/*.json` | Jde do databáze |
|---|---|
| popisky tlačítek, navigace, patička | reference / portfolio |
| validační a chybové hlášky | služby, produkty |
| statické texty sekcí | tým, případně blog |

Do adminu patří jen obsah, který reálně přibývá. Jinak si zaneřádíme rozhraní
a jednou překlepem v produkci rozbijeme navigaci.

### portfolio.jabcore.cz: jedna aplikace, dvě domény

Ne druhá appka ani druhé repo — onepager nad stejnými daty by zdvojil build,
paměť i deploy surface kvůli jedné stránce a musel by se dělit o datovou vrstvu.

Řeší to `middleware.ts` přepisem podle hostitele:

```
portfolio.jabcore.cz/          → rewrite na /[locale]/portfolio  (URL zůstává čistá)
jabcore.cz/[locale]/portfolio  → 301 na portfolio.jabcore.cz     (žádný duplicate content)
```

Route group `(portfolio)` má vlastní layout — jiná navigace, jiná patička, žádné
služby ani produkty. Obě domény míří v Caddy na stejný port, rozhodnutí padá až
v middleware.

**Tři věci, které s jednou appkou na dvou doménách snadno ujedou:**

1. [sitemap.ts](src/app/sitemap.ts) a [robots.ts](src/app/robots.ts) musí být
   host-aware — jinak portfolio doména naservíruje sitemapu hlavního webu.
2. Canonical na portfolio stránce míří na subdoménu, hreflang přes všech
   12 locales (navazuje na [metadata.ts](src/lib/metadata.ts)).
3. Onepager potřebuje `CreativeWork` JSON-LD u každé reference přes
   [jsonld.ts](src/lib/jsonld.ts). Bez toho je to pro Google jedna dlouhá
   stránka bez struktury.

### Devops: konvence z jabcore-finance + profiartstudio-web

`build.sh` v rootu dělá všechno — git pull, build, migrace, healthcheck, výpis
kam se nasadilo. Prostředí jsou soubory v `deploy/`, secrets mimo git, kontejnery
poslouchají jen na `127.0.0.1`, ven je pouští Caddy. Výstup česky.

Jabcore je průnik obou vzorů: Next.js standalone jako
[profiartstudio-web](../profiartstudio-web/web/Dockerfile), plus Postgres
a **migrace jako viditelný one-shot** před startem appky jako
[jabcore-finance](../jabcore-finance/build.sh).

Převzato z finance: `build.sh` odmítne nasadit nefunkční konfiguraci *dřív*, než
shodí běžící kontejner (prázdné heslo, `http://` v produkci, defaultní hodnoty).

---

## Cílová struktura

```
build.sh                        test | production, vše jedním příkazem
Dockerfile                      node:22-alpine, standalone, tini, health
docker-compose.yml              dev: postgres + app
docker-compose.prod.yml         prod: db + web
deploy/
  README.md                     co kam patří, jak založit secrets
  Caddyfile                     jabcore.cz + portfolio.jabcore.cz + test
  production.env                PUBLIC_BASE_URL, PORTFOLIO_BASE_URL, porty
  test.env
  secrets.env.template          POSTGRES_PASSWORD, AUTH_SECRET
  backup.sh                     pg_dump + volume s obrázky
src/
  middleware.ts                 host routing + detekce locale
  db/
    schema.ts                   Drizzle schéma
    migrations/                 generované .sql
  app/
    api/health/route.ts         commit + ping na DB
    (main)/[locale]/…           jabcore.cz
    (portfolio)/[locale]/…      portfolio.jabcore.cz
    admin/…                     panel, mimo [locale]
```

---

## Fáze

### Fáze 1 — Server a runtime  `~1–1,5 dne`  ✅ hotovo

- [x] `output: 'export'` → `output: 'standalone'`, zrušit `images.unoptimized`
- [x] `src/app/api/health/route.ts` — hlásí commit, build time a ping na DB
- [x] `Dockerfile` — node:22-alpine, multi-stage, tini, nextjs uživatel, HEALTHCHECK
- [x] `docker-compose.yml` (dev) a `docker-compose.prod.yml`
- [x] `build.sh` — prostředí, git pull s re-exec, validace konfigurace, migrace, healthcheck
- [x] `deploy/` — README, Caddyfile, production.env, test.env, secrets.env.template, backup.sh
- [x] `.gitignore` — `deploy/secrets.*.env`
- [x] `middleware.ts` — detekce locale, zrušen zdvojený strom rout
- [x] odstraněn nepoužívaný `react-router-dom`
- [x] `.github/workflows/ci.yml` místo GitHub Pages deploye

### Fáze 2 — Datová vrstva  `~1 den`  ✅ hotovo

- [x] Drizzle + `postgres` driver, `drizzle.config.ts`
- [x] `src/db/schema.ts` — `references`, `reference_locales`, `admin_users`
- [x] první migrace (`0000_rich_thena.sql`), zapojená do `build.sh` jako viditelný one-shot
- [x] `src/db/client.ts` — connection pool pro server komponenty
- [x] `src/db/seed.ts` — ukázková data pro vývoj

### Fáze 3 — Admin panel  `~3–5 dní`  ← **další na řadě**

- [ ] Auth.js (credentials), uživatelé v DB, argon2, session v HTTP-only cookie
- [ ] middleware hlídá `/admin`
- [ ] seznam referencí — řazení drag&drop, publikovat/skrýt
- [ ] editor s tabem pro každý jazyk, čeština povinná, odznak „hotovo / chybí"
- [ ] upload obrázků na volume, varianty přes `sharp`, cesta do DB
- [ ] `revalidatePath()` po uložení

> Na tab s jazyky si dát pozor — bez odznaků a fallbacku na češtinu se
> z dvanácti jazyků stane peklo a rozdělaný překlad rozbije web.

### Fáze 4 — Reference na hlavním webu  `~1–2 dny`  ✅ hotovo

- [x] `/[locale]/reference` a `/[locale]/reference/[slug]` jako **server komponenty**
- [x] `src/lib/references.ts` — čtení s fallbackem překladů **po polích**
- [x] metadata a hreflang pro detail, `generateStaticParams` nad publikovanými slugy
- [x] `CreativeWork` JSON-LD na detailu
- [x] doplněno do [sitemap.ts](src/app/sitemap.ts)
- [x] preview sekce na homepage (server komponenta, přežije výpadek DB)
- [x] odkaz v navigaci + aktivní stav i na detailu

### Fáze 5 — portfolio.jabcore.cz  `~1,5–2 dny`  ✅ hotovo

- [x] middleware: routing podle `Host`, rewrite portfolio domény, 308 z hlavní
- [x] `src/app/portfolio/[locale]` s vlastním layoutem (bez i18next v prohlížeči)
- [x] onepager s filtrem podle oboru + plné case studies s kotvami
- [x] host-aware `sitemap.ts` a `robots.ts`
- [x] canonical na portfolio doménu, hreflang, `CreativeWork` JSON-LD u každé položky
- [x] Caddy blok v [deploy/Caddyfile](deploy/Caddyfile)
- [ ] DNS záznam `portfolio.jabcore.cz` → IP serveru *(až bude server)*

### Fáze 6 — Port zbytku obsahu  `~2–3 dny`  *(volitelné)*

- [ ] služby, produkty, tým do DB stejným vzorem
- [ ] UI texty **zůstávají** v `src/locales/*.json`

---

## Jak se to spouští

```bash
# vývoj
docker compose up -d          # jen databáze, port 5434
cp .env.example .env.local
npm run db:migrate && npm run db:seed
npm run dev

# nasazení (na serveru)
./build.sh production
```

Celý řetězec je ověřený proti dočasnému prostředí: Postgres naběhne, migrace
proběhnou jako viditelný one-shot, web se sestaví a nahlásí healthy,
`deploy/backup.sh` vyrobí dump i archiv obrázků.

## Co nezapomenout

- `backup.sh` zálohuje **i volume s obrázky**, ne jen `pg_dump` — nahrané fotky
  referencí nejsou v gitu.
- `PORTFOLIO_BASE_URL` se zapéká do image stejně jako `NEXT_PUBLIC_SITE_URL`
  u profiartstudia, takže test a produkce mají vlastní image.
- Postgres si heslo uloží při prvním startu do volume; změna
  `POSTGRES_PASSWORD` v secrets ho nepřepíše.
- Vývojová databáze jede na **portu 5434**, ne 5432 — ten drží jabcore-finance.
- Migrace běží z vlastní Docker vrstvy (`target: migrator`), protože produkční
  image je Next standalone a `tsx` ani `src/` v něm nejsou.
- Root `/` záměrně **neredirektuje** češtinu: je to canonical adresa české
  homepage (viz hreflang v `metadata.ts`). Middleware přesouvá jen ostatní jazyky.
- Tabulka se jmenuje `project_references`, ne `references` — to je v SQL
  rezervované slovo a ruční dotaz bez uvozovek spadne na nesrozumitelné
  „syntax error at or near". V kódu zůstává `references`.
- `next build` běží uvnitř Docker image, kde databáze není. Proto je připojení
  v [src/db/client.ts](src/db/client.ts) líné a stránky čtoucí DB volají
  `skipPrerenderWithoutDatabase()` — jinak by se předgenerovaly prázdné a
  takové se servírovaly z cache až do další revalidace.
- Caddy nesmí přepisovat hlavičku `Host`, jinak portfolio doména spadne zpátky
  na hlavní web.

## Mimo rozsah

Kontaktní formulář jede na EmailJS z prohlížeče ([src/lib/emailjs.ts](src/lib/emailjs.ts)),
takže nemáme historii poptávek. Se serverem a DB je to otázka jednoho API route
a tabulky — ale je to samostatná věc, až po téhle migraci.
