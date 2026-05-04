# AI Chat Interface — Politecnico di Bari

Interfaccia web per conversare con un orchestratore **n8n** tramite webhook.  
Project Work realizzato in collaborazione con Teleperformance.

## Stack

- **Frontend**: Vite + React 18 + Tailwind CSS
- **Serve**: nginx (produzione) / Vite dev server (sviluppo)
- **Containerizzazione**: Docker + Docker Compose
- **Deploy**: Railway

---

## Configurazione

L'unica variabile d'ambiente richiesta è l'URL del webhook n8n:

```
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-id
```

Copia `.env.example` in `.env` e imposta il valore corretto.

### Formato atteso dal webhook n8n

**Request (POST):**
```json
{
  "chatInput": "messaggio dell'utente",
  "sessionId": "uuid-sessione"
}
```

**Response accettata (uno dei seguenti formati):**
```json
{ "output": "risposta dell'AI" }
{ "message": "risposta dell'AI" }
[{ "output": "risposta dell'AI" }]
```

---

## Sviluppo locale

```bash
cd frontend
npm install
cp ../.env.example .env.local   # imposta VITE_N8N_WEBHOOK_URL
npm run dev
# → http://localhost:3000
```

---

## Docker (locale)

```bash
cp .env.example .env            # imposta VITE_N8N_WEBHOOK_URL
docker compose up --build
# → http://localhost
```

---

## Deploy su Railway

1. Crea un nuovo progetto su [Railway](https://railway.app)
2. Collega questo repository GitHub
3. Imposta il **Root Directory** su `frontend`
4. Nella sezione **Variables**, aggiungi:
   ```
   VITE_N8N_WEBHOOK_URL = https://your-n8n-instance.com/webhook/...
   ```
5. Railway rileva automaticamente il `Dockerfile` e fa il deploy

> **Nota**: `VITE_N8N_WEBHOOK_URL` viene injettata a **build time**. Ogni cambio richiede un nuovo build.
