# 🧪 Testing Documentation

Documentazione completa sui test e qualità del codice.

---

## 📚 Guide Disponibili

### [📊 Code Coverage Report](./CODE_COVERAGE.md)

Guida completa sul sistema di code coverage con Jest.

**Cosa trovi**:
- Quick start: come eseguire coverage
- Le 4 metriche spiegate (Lines, Statements, Branches, Functions)
- Come leggere i report (console e HTML)
- Come interpretare risultati
- Workflow per migliorare coverage
- Come l'AI usa il coverage
- Integrazione CI/CD
- Best practices

**Comandi principali**:
```bash
npm run test:coverage           # Tutti i test con coverage
npm run test:coverage:unit      # Solo test unitari
npm run test:coverage:html      # Apri report HTML
```

---

## 🎯 Coverage Attuale

| Metrica | Valore | Soglia | Status |
|---------|--------|--------|--------|
| **Statements** | 60.15% | 60% | ✅ OK |
| **Branches** | 50.56% | 50% | ✅ OK |
| **Functions** | 69.84% | 69% | ✅ OK |
| **Lines** | 60.21% | 60% | ✅ OK |

### File Critici

| File | Coverage | Target | Priorità |
|------|----------|--------|----------|
| `shared/schemas/entityFactory.ts` | 83% | 100% | 🔴 ALTA |
| `functions/api/clienti.ts` | 91% | 95% | 🟡 MEDIA |
| `functions/utils/authHelpers.ts` | 75% | 90% | 🟡 MEDIA |
| `functions/utils/auditLogger.ts` | 29% | 85% | 🔴 ALTA |

---

## 📁 Struttura Test

```
tests/
├── unit/                    # Test unitari (factory, utilities)
│   └── entityFactory.test.js
├── functions/               # Test integrazione Cloud Functions
│   ├── clienti.test.js
│   ├── attachments.test.js
│   ├── comments.test.js
│   ├── users.test.js
│   └── settings.test.js
└── e2e/                     # Test end-to-end (Cypress)
    └── (non ancora implementati)
```

---

## ⚙️ Configurazione

- **Jest Config**: [../../jest.config.js](../../jest.config.js)
- **Package Scripts**: [../../package.json](../../package.json)
- **Coverage Directory**: `/coverage` (git-ignored)

---

## 🚀 Quick Commands

```bash
# Test senza coverage (veloce)
npm test                    # Tutti i test
npm run test:unit           # Solo unit test

# Test con coverage (lento ma dettagliato)
npm run test:coverage       # Tutti i test + coverage
npm run test:coverage:unit  # Unit test + coverage
npm run test:coverage:watch # Watch mode + coverage
npm run test:coverage:html  # Coverage + apri HTML

# E2E (Cypress)
npm run test:e2e           # Headless
npm run test:e2e:open      # Con UI
```

---

## 🎓 Best Practices

### ✅ DO

- Esegui `npm run test:coverage` prima di commit importanti
- Mantieni coverage stabile o in crescita (mai in calo)
- Testa prima codice critico (Factory, API, Auth)
- Usa report HTML per identificare righe non testate
- Scrivi test significativi, non solo "coverage filler"

### ❌ DON'T

- NON ignorare coverage basso per codice di sicurezza
- NON puntare a 100% per tutto (focus su codice critico)
- NON confondere coverage con qualità (test devono verificare comportamento)
- NON creare test solo per aumentare coverage senza verifiche

---

## 📊 Report Output

### Console (Text)

```
--------------------------|---------|----------|---------|---------|
File                      | % Stmts | % Branch | % Funcs | % Lines |
--------------------------|---------|----------|---------|---------|
All files                 |   60.15 |    50.56 |   69.84 |   60.21 |
 shared/schemas           |   83.33 |    65.38 |   83.33 |   83.33 |
 functions/api            |   62.29 |    45.76 |      75 |   62.62 |
 functions/utils          |   45.23 |     57.5 |      60 |    43.9 |
--------------------------|---------|----------|---------|---------|
```

### HTML (Interattivo)

Dopo `npm run test:coverage:html` apre browser con:
- File colorati (verde/rosso/giallo)
- Click su file per vedere codice line-by-line
- Filtri per coverage percentage
- Drill-down in directories

### JSON (Per CI/CD)

Generati automaticamente in `/coverage`:
- `coverage-summary.json` - Summary per badge e CI
- `coverage-final.json` - Dati completi raw
- `lcov.info` - Formato standard per Codecov/SonarQube

---

## 🔗 Risorse Esterne

- [Jest Testing Framework](https://jestjs.io/)
- [Jest Coverage Configuration](https://jestjs.io/docs/configuration#collectcoveragefrom-array)
- [Istanbul Coverage Tool](https://istanbul.js.org/)
- [Codecov](https://about.codecov.io/)
- [SonarQube](https://www.sonarqube.org/)

---

## 📝 Prossimi Passi

1. [ ] Aumentare coverage `entityFactory.ts` a 100%
2. [ ] Creare test per `auditLogger.ts` (attualmente 29%)
3. [ ] Aumentare coverage `authHelpers.ts` a 90%
4. [ ] Integrare coverage check in CI/CD pipeline
5. [ ] Aggiungere badge coverage nel README principale
6. [ ] Configurare Codecov per tracking trend

---

**Ultimo aggiornamento**: 2026-01-12
**Versione documentazione**: 1.0
