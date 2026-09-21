-- Obor reference se od teď vybírá z pevného seznamu (src/lib/industries.ts)
-- a v databázi je jen jeho klíč. Dřív se psal volným textem, takže tu můžou
-- být „Průmysl", „průmysl", „E-commerce" nebo „e-shop" - tahle migrace je
-- převede na klíče ze seznamu.
--
-- Porovnává se bez velikosti písmen a bez okolních mezer. Hodnoty, které se
-- nepodaří přiřadit, zůstanou beze změny: admin je u reference ukáže jako
-- „původní hodnota mimo seznam" a nechá vybrat obor ručně. Tipovat a psát
-- do databáze něco, co tam nikdo nezadal, by bylo horší.

UPDATE "project_references"
SET "industry" = CASE lower(btrim("industry"))
  WHEN 'průmysl' THEN 'prumysl'
  WHEN 'prumysl' THEN 'prumysl'
  WHEN 'výroba' THEN 'prumysl'
  WHEN 'vyroba' THEN 'prumysl'
  WHEN 'průmysl a výroba' THEN 'prumysl'
  WHEN 'strojírenství' THEN 'prumysl'
  WHEN 'industry' THEN 'prumysl'
  WHEN 'manufacturing' THEN 'prumysl'

  WHEN 'e-commerce' THEN 'ecommerce'
  WHEN 'ecommerce' THEN 'ecommerce'
  WHEN 'e commerce' THEN 'ecommerce'
  WHEN 'e-shop' THEN 'ecommerce'
  WHEN 'eshop' THEN 'ecommerce'
  WHEN 'retail' THEN 'ecommerce'
  WHEN 'obchod' THEN 'ecommerce'

  WHEN 'veřejná správa' THEN 'verejna-sprava'
  WHEN 'verejna sprava' THEN 'verejna-sprava'
  WHEN 'samospráva' THEN 'verejna-sprava'

  WHEN 'zdravotnictví' THEN 'zdravotnictvi'
  WHEN 'zdravotnictvi' THEN 'zdravotnictvi'

  WHEN 'doprava' THEN 'doprava'
  WHEN 'logistika' THEN 'doprava'
  WHEN 'doprava a logistika' THEN 'doprava'

  WHEN 'vzdělávání' THEN 'vzdelavani'
  WHEN 'vzdelavani' THEN 'vzdelavani'
  WHEN 'školství' THEN 'vzdelavani'

  WHEN 'služby' THEN 'sluzby'
  WHEN 'sluzby' THEN 'sluzby'

  WHEN 'finance' THEN 'finance'
  WHEN 'bankovnictví' THEN 'finance'
  WHEN 'pojišťovnictví' THEN 'finance'

  WHEN 'energetika' THEN 'energetika'
  WHEN 'stavebnictví' THEN 'stavebnictvi'
  WHEN 'reality' THEN 'stavebnictvi'
  WHEN 'it' THEN 'technologie'
  WHEN 'technologie' THEN 'technologie'
  WHEN 'média' THEN 'media'
  WHEN 'marketing' THEN 'media'
  WHEN 'cestovní ruch' THEN 'cestovni-ruch'
  WHEN 'gastronomie' THEN 'cestovni-ruch'
  WHEN 'zemědělství' THEN 'zemedelstvi'
  WHEN 'neziskový sektor' THEN 'neziskovy-sektor'
  WHEN 'neziskovka' THEN 'neziskovy-sektor'

  ELSE "industry"
END
WHERE "industry" IS NOT NULL;
--> statement-breakpoint

-- Prázdný řetězec po vymazání pole v adminu znamená „bez oboru".
UPDATE "project_references" SET "industry" = NULL WHERE btrim("industry") = '';
