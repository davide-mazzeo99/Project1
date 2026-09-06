# Budget — gestione budget personale (PWA)

App per gestire il budget personale (conto corrente Santander + investimenti
Trade Republic), pensata per essere installata sulla schermata Home
dell'iPhone e usata come un'app nativa. **Tutti i dati restano sul
dispositivo** (IndexedDB, tramite [Dexie.js](https://dexie.org/)): nessun
backend, nessun account, nessuna telemetria, nessuna chiamata di rete
obbligatoria.

## Stack

React 18 + TypeScript + Vite · Tailwind CSS · Dexie.js (IndexedDB) ·
Recharts · PapaParse · date-fns · Zod · vite-plugin-pwa

## Avvio in sviluppo

```bash
npm install
npm run dev
```

Apre il dev server su `http://localhost:5173`. Passa `-- --host` (già
impostato di default in questo progetto) per renderlo raggiungibile anche
da altri dispositivi sulla stessa rete Wi-Fi — utile per aprirlo
dall'iPhone durante lo sviluppo.

## Build di produzione

```bash
npm run build      # genera dist/ (include service worker e manifest)
npm run preview    # serve dist/ in locale per verificarla prima del deploy
```

Per servire l'app da un sotto-percorso (es. GitHub Pages,
`https://<utente>.github.io/<repo>/`) invece che dalla radice, passa la
variabile `VITE_BASE_PATH`:

```bash
VITE_BASE_PATH=/nome-repo/ npm run build
```

## Deploy su GitHub Pages

Il repository include un workflow (`.github/workflows/deploy-pages.yml`) che
builda e pubblica l'app automaticamente ad ogni push su `main` (oppure
avviabile a mano dalla tab **Actions** del repo con "Run workflow").

Per attivarlo la prima volta serve un unico passaggio manuale, che solo il
proprietario del repository può fare (il workflow da solo non può abilitare
Pages):

1. Vai su **Settings → Pages** del repository su GitHub.
2. In **Build and deployment → Source** scegli **GitHub Actions**.
3. Fai un push su `main` (o lancia il workflow manualmente): dopo un paio di
   minuti l'app sarà live su `https://<utente>.github.io/<repo>/`.

Da lì è installabile su iPhone allo stesso modo descritto sotto, semplicemente
aprendo quell'URL in Safari invece dell'indirizzo della rete locale — con il
vantaggio di un indirizzo stabile che non cambia ad ogni riavvio del dev
server.

## Installare la PWA sull'iPhone (dalla rete locale)

1. Sullo stesso Mac/PC dove hai il progetto, lancia il dev server o il
   preview di produzione:
   ```bash
   npm run dev       # per iterare rapidamente, oppure
   npm run build && npm run preview
   ```
2. Trova l'indirizzo IP locale del computer (visibile nell'output del
   comando, o con `ipconfig getifaddr en0` su Mac / `hostname -I` su
   Linux/WSL).
3. Assicurati che iPhone e computer siano sulla **stessa rete Wi-Fi**.
4. Sull'iPhone apri **Safari** (deve essere Safari, non Chrome: solo
   Safari può installare PWA su iOS) e vai su `http://<IP-DEL-COMPUTER>:5173`
   (o `:4173` per il preview di produzione).
5. Tocca l'icona **Condividi** (il quadrato con la freccia verso l'alto)
   nella barra in basso.
6. Scorri e tocca **"Aggiungi a Home"**.
7. Conferma: l'icona apparirà sulla schermata Home e l'app si aprirà a
   schermo intero, senza barra degli indirizzi, come un'app nativa.

Per un uso quotidiano più stabile (indirizzo che non cambia ogni volta),
conviene fare il deploy di `dist/` su un hosting statico qualsiasi
(Netlify, Vercel, GitHub Pages, un server proprio…) e installare la PWA da
lì — l'app funziona comunque interamente offline una volta installata,
qualunque sia l'hosting.

## Dati di esempio

Dalla Dashboard, se non ci sono ancora transazioni, puoi caricare 6 mesi di
dati di esempio (transazioni, portafoglio, budget) con un tocco per vedere
subito i grafici popolati, e rimuoverli allo stesso modo quando vuoi
ripartire da zero.

## Funzionalità principali

- **Inserimento rapido**: tastierino numerico grande, importo → categoria →
  salvataggio in pochi tocchi.
- **Import CSV guidato**: rilevamento automatico di separatore, encoding e
  formato numerico; se il formato non viene riconosciuto, mappatura manuale
  delle colonne con anteprima, salvabile come preset riutilizzabile per
  quella banca. Deduplica automatica delle righe già importate.
- **Categorizzazione automatica**: regole per parola chiave create al volo
  quando categorizzi una transazione, applicate ai nuovi import e
  riapplicabili in ogni momento alle transazioni esistenti.
- **Dashboard**: entrate/spese/risparmio del mese, confronto con il mese
  precedente e la media degli ultimi 6 mesi, rapporto affitto/entrate,
  ritmo di spesa, grafici (donut categorie con drill-down, andamento
  entrate/spese/investimenti, tasso di risparmio, patrimonio netto, affitto
  nel tempo, heatmap spese giornaliere).
- **Portafoglio**: posizioni con P/L assoluto e percentuale, allocazione,
  distinzione tra capitale versato e rendimento non realizzato, snapshot
  mensile automatico. Prezzi aggiornabili dal mercato (cripto via CoinGecko,
  gratis; azioni/ETF via Twelve Data, richiede una tua API key gratuita in
  Impostazioni) all'apertura della pagina o a un tocco — sempre modificabili
  a mano, e senza mai bloccare l'app se sei offline.
- **Budget**: per categoria, con copia dal mese precedente, categorie fisse
  precompilate automaticamente, avvisi visivi al superamento.
- **Backup**: export/import completo in JSON, export CSV delle transazioni
  filtrate, promemoria in-app se non fai un backup da 30+ giorni (iOS può
  cancellare i dati di app inutilizzate a lungo).

## Note su alcune scelte

- **Preset di import Santander/Trade Republic**: non avendo un export CSV
  reale delle due banche a disposizione, l'app non assume un formato fisso
  — al primo import ti guida nella mappatura delle colonne una volta sola,
  poi la salva come preset e la riapplica automaticamente ai successivi
  import dello stesso istituto.
- **Prezzi del portafoglio**: cripto e azioni/ETF si aggiornano dal mercato
  (CoinGecko/Twelve Data) quando c'è rete, con fallback silenzioso all'ultimo
  prezzo salvato se sei offline o non hai configurato una API key — questa è
  l'unica funzione dell'app che fa chiamate di rete, ed è per design
  "best-effort": nessun'altra funzionalità dipende da internet.
- **Routing**: l'app usa `HashRouter` (URL del tipo `/#/transazioni`)
  invece del routing "pulito", scelta deliberata per funzionare senza
  configurazione server su qualsiasi hosting statico e per gestire
  correttamente i deep link quando viene aperta da installata sulla
  schermata Home.
