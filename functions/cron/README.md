# Funzioni Cron

Questa directory contiene le funzioni Cloud schedulate (cron jobs) per operazioni automatiche.

## scaricaLeggiNormattiva

Funzione cron che scarica automaticamente leggi da Normattiva e le salva nel database Firestore.

### Configurazione

- **Schedule**: Ogni giorno alle 2:00 AM (cron: `0 2 * * *`)
- **Timezone**: Europe/Rome
- **Region**: europe-west1

