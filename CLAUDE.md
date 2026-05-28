# CLAUDE.md — ProjectWorkTP

Interfaccia web di chat AI per il **Politecnico di Bari** (Project Work con Teleperformance).
Il frontend dialoga con un orchestratore **n8n** tramite un backend Express che fa da proxy
e nasconde l'URL del webhook. Supporta l'upload di PDF e la persistenza delle conversazioni
su MongoDB.

Lingua di lavoro: **italiano** (UI, commenti, messaggi all'utente).

---

## Stack

- **Frontend**: Vite + React 18 + Tailwind CSS, servito da nginx. Niente TypeScript (JS/JSX puro).
- **Backend**: Node 20 + Express 4 (ESM, `"type": "module"`) + Multer + Mongoose.
- **DB**: MongoDB via Mongoose (storico chat). Opzionale: se `MONGODB_URI` manca, la chat funziona senza persistenza.
- **Orchestrazione AI**: webhook n8n esterno (non parte di questo repo).
- **Diagrammi**: Mermaid lato frontend (risposte con `contentType: 'map'`).
- **Containerizzazione**: Docker + Docker Compose.
- **Deploy**: Railway (due servizi separati, frontend e backend).

---

## Struttura del repo

```
.
├── backend/
│   ├── src/
│   │   ├── server.js              # entrypoint Express, CORS, multer, rotte
│   │   ├── controller/
│   │   │   ├── ChatController.js   # POST /api/chat → proxy a n8n + persistenza
│   │   │   └── SessionController.js# GET/DELETE sessioni e messaggi
│   │   ├── model/
│   │   │   ├── SessionSchema.js    # ChatSession (sessionId, title, messages[])
│   │   │   └── MsgSchema.js        # sotto-documento messaggio
│   │   └── util/
│   │       └── DbUtil.js           # connessione Mongoose + isDbReady()
│   ├── Dockerfile                  # node:20-alpine, espone 8080
│   └── railway.toml                # healthcheck su /health
└── frontend/
    ├── src/
    │   ├── App.jsx                 # layout, gestione sessione corrente
    │   ├── components/
    │   │   ├── ChatInterface.jsx   # area messaggi + header + EmptyState
    │   │   ├── MessageBubble.jsx   # rendering bolla (text | map/Mermaid)
    │   │   ├── InputBar.jsx        # textarea + allegato PDF
    │   │   ├── Sidebar.jsx         # elenco sessioni raggruppate per data
    │   │   ├── MermaidDiagram.jsx  # render diagrammi
    │   │   └── Icons.jsx           # icone SVG inline (no libreria)
    │   └── hooks/
    │       ├── useChat.js          # stato messaggi + invio a /api/chat
    │       └── useSessions.js      # lista/elimina sessioni
    ├── nginx.conf                  # SPA + proxy, listen ${PORT}
    └── Dockerfile                  # build Vite → nginx:alpine
```

---

## Comandi

### Sviluppo locale (senza Docker)
```bash
# Backend (porta 8080)
cd backend && npm install
N8N_WEBHOOK_URL=https://... npm run dev

# Frontend (porta 3000) — in un altro terminale
cd frontend && npm install
echo "VITE_API_URL=http://localhost:8080" > .env.local
npm run dev
```

### Docker Compose
```bash
cp .env.example .env   # imposta N8N_WEBHOOK_URL
docker compose up --build   # frontend su http://localhost:8080, backend su :8081
```

### Lint frontend
```bash
cd frontend && npm run lint
```

Non esiste ancora una suite di test. Se aggiungi logica non banale (es. validazione quiz),
proponi test prima di darli per scontati.

---

## Contratto API attuale

`POST /api/chat` — `multipart/form-data`
- `chatInput` (string, obbligatorio), `sessionId` (string), `pdf` (file PDF ≤ 20 MB, opzionale).
- Il backend inoltra a n8n in `multipart/form-data` se c'è un PDF, altrimenti in JSON.
- Risposta: `{ content, contentType, raw }` dove `contentType ∈ { 'text', 'map' }`.

`GET /api/sessions` — elenco sessioni (sessionId, title, createdAt, updatedAt).
`GET /api/sessions/:sessionId/messages` — messaggi di una sessione.
`DELETE /api/sessions/:sessionId` — elimina una sessione.
`GET /health` — stato (`n8nConfigured`, `dbConnected`).

---

## Convenzioni di codice

- **ESM ovunque** nel backend (`import`/`export`, mai `require`).
- Pattern backend: `server.js` registra le rotte → `controller/` contiene la logica → `model/` gli schemi Mongoose. Rispetta questa separazione: niente logica di business dentro `server.js`, niente query Mongoose dentro i componenti React.
- Frontend: componenti funzionali con hook. La logica di rete sta negli hook (`useChat`, `useSessions`), **non** nei componenti di presentazione.
- Le icone sono SVG inline in `Icons.jsx` — non introdurre `lucide-react` o altre librerie di icone senza chiedere.
- Stile: Tailwind con la palette custom `poliba` (`poliba-blue #003087`, `poliba-lightblue`, `poliba-gold`). Usa queste classi, non colori hardcoded.
- Messaggi utente, label e commenti in italiano.
- Il rendering dei messaggi assistant è guidato da `contentType`: `'text'` → `formatContent`, `'map'` → `<MermaidDiagram>`. Ogni nuovo tipo di contenuto va aggiunto qui (vedi sezione Quiz).

---

## Cosa NON fare

- Non esporre mai `N8N_WEBHOOK_URL` al frontend né in variabili `VITE_*`. Deve restare solo lato backend.
- Non modificare lo schema Mongoose (`SessionSchema`, `MsgSchema`) senza considerare i dati già esistenti: l'`enum` di `contentType` rifiuta valori non previsti e farebbe fallire il salvataggio.
- Non cambiare la porta del backend né la config nginx (`listen ${PORT}`, proxy `/api/*`) senza motivo: il deploy Railway e il Docker Compose ci fanno affidamento.
- `VITE_API_URL` è **build-time**: se cambia, serve un redeploy/rebuild del frontend, non basta riavviare.
- Non aggiungere dipendenze npm senza motivarle.
- Non rimuovere il fallback "DB assente" in `DbUtil.js`: l'app deve girare anche senza MongoDB.

---

## Known issues (da tenere presente)

1. **La persistenza su MongoDB non avviene.** In `ChatController.js`, `persistMessages` è
   definita come `persistMessages(sessionId, userMsg, assistantMsg, dbStatus)` e fa
   `if (!dbStatus) return` all'inizio, ma viene chiamata con soli **tre** argomenti
   (`dbStatus` è `undefined`), quindi esce subito senza salvare. Va corretta passando
   `isDbReady()` come quarto argomento (o rimuovendo il guard) prima di poter contare
   sullo storico, **cosa necessaria per salvare quiz e risposte**.
2. `session.save()` in `persistMessages` non è awaited (fire-and-forget): accettabile per
   ora, ma se i quiz richiedono consistenza valutane l'await.
3. `MsgSchema.contentType` ha `enum: ['text', 'map']` — qualsiasi nuovo tipo (es. `'quiz'`)
   va aggiunto all'enum o il salvataggio fallisce in silenzio.

---

## Feature in sviluppo: Quiz interattivi

**Obiettivo**: l'utente può chiedere all'assistente di generare un **quiz** (es. "creami un
quiz di 5 domande su X"). n8n restituisce il quiz in forma strutturata; il frontend lo
renderizza in modo **interattivo** (l'utente seleziona le risposte direttamente nella bolla
del messaggio, riceve feedback corretto/sbagliato e un punteggio finale), senza dover
ridigitare nulla in chat.

### Approccio consigliato (allineato all'architettura esistente)

Il sistema usa già `contentType` per scegliere come renderizzare la risposta assistant
(`text` vs `map`/Mermaid). I quiz seguono lo stesso pattern: un nuovo `contentType: 'quiz'`.

1. **Schema dati del quiz** (payload che n8n deve produrre dentro `content`):
   ```jsonc
   {
     "title": "Quiz su ...",
     "questions": [
       {
         "id": "q1",
         "text": "Domanda?",
         "options": ["A", "B", "C", "D"],
         "correctIndex": 1,          // indice della risposta corretta
         "explanation": "Perché ..." // opzionale, mostrato dopo la risposta
       }
     ]
   }
   ```
   Decidi se `content` è una stringa JSON (come avviene già con il fallback testo) o un
   oggetto. Coerentemente con `ChatController` che fa `JSON.parse(text)`, è probabile che
   n8n restituisca `{ content: <oggetto-quiz>, type: 'quiz' }`.

2. **Backend** (`ChatController.js` / `MsgSchema.js`):
   - Aggiungi `'quiz'` all'`enum` di `contentType` in `MsgSchema.js`.
   - Valuta se il payload quiz va salvato così com'è in `content` (Mongoose `Mixed` lo
     permetterebbe, ma `content` è attualmente `String`: potresti dover serializzare in JSON
     o cambiare il tipo del campo — **discutine prima di modificare lo schema**).
   - Le **risposte dell'utente** al quiz: decidi se persisterle (nuovo campo nel messaggio,
     o nuova rotta `POST /api/sessions/:id/quiz-answer`). Ricorda il known issue #1: senza
     fixare `persistMessages`, nulla viene salvato comunque.

3. **Frontend** (`MessageBubble.jsx` + nuovo componente):
   - Crea `components/QuizCard.jsx`: riceve il payload quiz, gestisce con `useState` la
     selezione dell'utente per ogni domanda, mostra feedback e punteggio.
   - In `MessageBubble.jsx`, estendi la logica di rendering:
     ```jsx
     {message.contentType === 'text'  && formatContent(message.content)}
     {message.contentType === 'map'   && <MermaidDiagram chart={message.content} />}
     {message.contentType === 'quiz'  && <QuizCard quiz={message.content} />}
     ```
   - Mantieni lo stile Tailwind/palette `poliba`. Lo stato delle risposte vive nel componente
     React (niente `localStorage` necessario; se vuoi persistere, passa per il backend).
   - Accessibilità: i bottoni-opzione devono essere navigabili da tastiera e avere stati
     `aria` per corretto/sbagliato.

4. **Interazione**: la selezione delle risposte **non** deve inviare un nuovo messaggio a
   n8n a ogni click (il quiz è già stato generato). L'invio a `/api/chat` serve solo a
   *generare* il quiz, non a valutarlo — la valutazione è client-side usando `correctIndex`.
   Se invece vuoi che la correzione passi dal backend (per non esporre le risposte corrette
   nel payload), allora il payload inviato al client **non** deve contenere `correctIndex` e
   serve una rotta dedicata che valuti lato server. **Chiarisci quale dei due modelli vuoi
   prima di implementare**, perché cambia sia lo schema dati sia la sicurezza.

### Domande aperte da risolvere con l'utente prima di scrivere codice
- Le risposte corrette possono stare nel payload inviato al browser, o vanno tenute server-side?
- I quiz e i risultati vanno persistiti su MongoDB (e quindi va prima fixato `persistMessages`)?
- Un quiz è "one-shot" o l'utente può ripeterlo? Va mostrato lo storico dei tentativi?
