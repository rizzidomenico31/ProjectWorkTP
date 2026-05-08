import express from 'express'
import cors from 'cors'
import multer from 'multer'
import {chatController} from "./controller/ChatController.js";
import {deleteSession, getMessagesForSession, getSessions} from "./controller/SessionController.js";
import {connect, isDbReady} from "./util/DbUtil.js";

const PORT = process.env.PORT || 8080
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL
const MONGODB_URI = process.env.MONGODB_URI
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*')
  .split(',')
  .map((s) => s.trim())

// ── MongoDB ──────────────────────────────────────────────────────────────────

await connect(MONGODB_URI)

// ── Express ───────────────────────────────────────────────────────────────────

const app = express()

app.use(
  cors({
    origin: ALLOWED_ORIGINS.includes('*') ? true : ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'DELETE'],
  }),
)
app.use(express.json({ limit: '1mb' }))

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true)
    cb(new Error('Solo file PDF sono consentiti'))
  },
})

// ── Health ────────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    n8nConfigured: Boolean(N8N_WEBHOOK_URL),
    dbConnected: isDbReady(),
  })
})

// ── Sessions API ──────────────────────────────────────────────────────────────

app.get('/api/sessions', getSessions)

app.get('/api/sessions/:sessionId/messages', getMessagesForSession)

app.delete('/api/sessions/:sessionId', deleteSession)

// ── Chat ──────────────────────────────────────────────────────────────────────

app.post('/api/chat', upload.single('pdf'), chatController)

// ── Error handler ─────────────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.message?.includes('PDF')) {
    return res.status(400).json({ error: err.message })
  }
  res.status(500).json({ error: 'Errore interno del server' })
})

app.listen(PORT, () => {
  console.log(`Backend listening on :${PORT}`)
})
