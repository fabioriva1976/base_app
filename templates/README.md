# Templates AI-First

Questi template sono pensati per essere copiati e adattati.
Non sono usati in runtime o nei test.

## Contenuto
- `templates/entity.api.template.ts` -> CRUD API standard (stile clienti)
- `templates/entity.test.template.ts` -> Test backend standard
- `templates/entity.page.template.astro` -> Pagina Astro base
- `templates/entity.script.template.ts` -> Script UI base
- `templates/entity.store.template.ts` -> Store real-time base

## Placeholder
I template usano placeholder che vengono sostituiti dallo script.
- `__ENTITY_PASCAL__` -> Prodotto
- `__ENTITY_CAMEL__` -> prodotto
- `__ENTITA_SNAKE__` -> prodotti
- `__ENTITA_CONST__` -> PRODOTTI
- `__ENTITA_PASCAL__` -> Prodotti
- `__ENTITA_CAMEL__` -> prodotti
- `__ENTITY_LABEL__` -> Prodotto
- `__ENTITA_LABEL_PLURAL__` -> Prodotti

## Uso consigliato
1. Usa lo script: `npm run generate:entity <entita_plural> <EntityName>`
2. Esempio: `npm run generate:entity prodotti Prodotto`
3. Se serve, personalizza i campi nei file generati
