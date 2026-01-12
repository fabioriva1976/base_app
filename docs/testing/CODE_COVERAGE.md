# 📊 Code Coverage

Guida sintetica all’uso del coverage nel progetto (stato attuale).

## Comandi

```bash
npm run test:coverage
npm run test:coverage:unit
npm run test:coverage:watch
npm run test:coverage:html
```

## Output

I report sono salvati in `coverage/`:

- `coverage/lcov-report/index.html` (report HTML)
- `coverage/coverage-summary.json`
- `coverage/coverage-final.json`
- `coverage/lcov.info`

## Configurazione

Le soglie e i percorsi inclusi/esclusi sono in `jest.config.js`.
