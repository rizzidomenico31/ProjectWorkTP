# AI Chat Interface — Politecnico di Bari

Interfaccia web per conversare con un orchestratore **n8n** tramite webhook,
con supporto all'**upload di PDF** per task di analisi documentale.
Project Work realizzato in collaborazione con Teleperformance.

## Architettura

```
┌──────────────┐   HTTPS    ┌──────────────┐   HTTPS   ┌───────────────┐
│   Frontend   │ ─────────▶ │   Backend    │ ────────▶ │  n8n webhook  │
│ Vite + React │  /api/chat │ Node Express │           │ (orchestrator)│
└──────────────┘            └──────────────┘           └───────────────┘
   nginx :80                    Express :8080
```

- Il **frontend** è una SPA Vite/React servita da nginx.
- Il **backend** Node/Express riceve i messaggi (con eventuale PDF allegato) e li
  inoltra al webhook n8n. L'URL del webhook **non viene mai esposto al browser**.
- I PDF vengono inoltrati come `multipart/form-data` con il campo `pdf`.

## Stack

- **Frontend**: Vite + React 18 + Tailwind CSS, servito da nginx
- **Backend**: Node 20 + Express + Multer
- **Containerizzazione**: Docker + Docker Compose
- **Deploy**: Railway (2 servizi separati)

---

## Configurazione

Copia `.env.example` in `.env` e imposta:

| Variabile          | Lato     | Descrizione                                              |
|--------------------|----------|----------------------------------------------------------|
| `N8N_WEBHOOK_URL`  | backend  | URL del webhook n8n (obbligatorio)                       |
| `ALLOWED_ORIGINS`  | backend  | CSV di origini per CORS (default `*`)                    |
| `VITE_API_URL`     | frontend | URL pubblico del backend (vuoto in locale: nginx proxy)  |

### Contratto API

**`POST /api/chat`** (Content-Type: `multipart/form-data`)

| Campo       | Tipo   | Note                            |
|-------------|--------|---------------------------------|
| `chatInput` | string | Messaggio utente (obbligatorio) |
| `sessionId` | string | UUID di sessione                |
| `pdf`       | file   | PDF (max 20 MB), opzionale      |

Risposta: `{ "output": "...", "raw": <payload n8n> }`.

Il backend inoltra a n8n in `multipart/form-data` se è presente un PDF, altrimenti in JSON.

---

## Sviluppo locale (senza Docker)

```bash
# Backend
cd backend
npm install
N8N_WEBHOOK_URL=https://... npm run dev   # → http://localhost:8080

# Frontend (in altro terminale)
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8080" > .env.local
npm run dev   # → http://localhost:3000
```

---

## Docker Compose (locale)

```bash
cp .env.example .env   # imposta N8N_WEBHOOK_URL
docker compose up --build
# → http://localhost:8080
```

`VITE_API_URL` resta vuoto: nginx fa da proxy `/api/*` → `backend:8080`.

---

## Deploy su Railway

### Step 1 — servizio **backend**

1. New Project → **Deploy from GitHub repo** → seleziona il repo
2. Settings → **Root Directory**: `backend`
3. Settings → Build → **Builder**: `Dockerfile`
4. Variables:
   ```
   N8N_WEBHOOK_URL = https://your-n8n.com/webhook/...
   ALLOWED_ORIGINS = https://<frontend-url>.up.railway.app
   ```
5. Settings → Networking → **Generate Domain** → copia l'URL pubblico

### Step 2 — servizio **frontend**

1. Stesso progetto: **+ New** → **GitHub Repo** → stesso repo
2. Settings → **Root Directory**: `frontend`
3. Settings → Build → **Builder**: `Dockerfile`
4. Variables (build-time):
   ```
   VITE_API_URL = https://<backend-url>.up.railway.app
   ```
5. Settings → Networking → **Generate Domain**
6. Aggiorna `ALLOWED_ORIGINS` sul backend con l'URL del frontend

> **Importante**: `VITE_API_URL` è build-time. Se lo cambi, fai **Redeploy** del frontend.

---

## Asset

Salva il logo del Politecnico di Bari in `frontend/public/poliba-logo.png`.
È referenziato dall'header della chat (con fallback automatico se mancante).
