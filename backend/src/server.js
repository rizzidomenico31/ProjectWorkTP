import express from 'express'
import cors from 'cors'
import multer from 'multer'
import fetch from 'node-fetch'
import FormData from 'form-data'
import mongoose from 'mongoose'
import { randomUUID } from 'crypto'

const PORT = process.env.PORT || 8080
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL
const MONGODB_URI = process.env.MONGODB_URI
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*')
  .split(',')
  .map((s) => s.trim())

if (!N8N_WEBHOOK_URL) {
  console.warn('[WARN] N8N_WEBHOOK_URL is not set. /api/chat will return 500.')
}

// ── MongoDB ──────────────────────────────────────────────────────────────────

let dbReady = false

if (MONGODB_URI) {
  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      console.log('[MongoDB] Connected')
      dbReady = true
    })
    .catch((err) => console.warn('[MongoDB] Connection failed:', err.message))
} else {
  console.warn('[MongoDB] MONGODB_URI not set — chat history disabled.')
}

const msgSchema = new mongoose.Schema(
  {
    id: String,
    role: { type: String, enum: ['user', 'assistant', 'error'] },
    content: String,
    timestamp: Date,
    attachment: mongoose.Schema.Types.Mixed,
  },
  { _id: false },
)

const sessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, unique: true, required: true, index: true },
    title: { type: String, default: 'Nuova conversazione' },
    messages: [msgSchema],
  },
  { timestamps: true },
)

const ChatSession = mongoose.model('ChatSession', sessionSchema)

async function persistMessages(sessionId, userMsg, assistantMsg) {
  if (!dbReady) return
  try {
    let session = await ChatSession.findOne({ sessionId })
    if (!session) {
      const title =
        userMsg.content.length > 60
          ? userMsg.content.slice(0, 57) + '...'
          : userMsg.content
      session = new ChatSession({ sessionId, title, messages: [] })
    }
    session.messages.push(userMsg, assistantMsg)
    await session.save()
  } catch (err) {
    console.warn('[MongoDB] persistMessages error:', err.message)
  }
}

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
    dbConnected: dbReady,
  })
})

// ── Sessions API ──────────────────────────────────────────────────────────────

app.get('/api/sessions', async (_req, res) => {
  if (!dbReady) return res.json({ sessions: [] })
  try {
    const sessions = await ChatSession.find()
      .select('sessionId title createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(100)
    res.json({
      sessions: sessions.map((s) => ({
        sessionId: s.sessionId,
        title: s.title,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/sessions/:sessionId/messages', async (req, res) => {
  if (!dbReady) return res.json({ messages: [] })
  try {
    const session = await ChatSession.findOne({ sessionId: req.params.sessionId })
    res.json({ messages: session?.messages ?? [] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/sessions/:sessionId', async (req, res) => {
  if (!dbReady) return res.json({ ok: true })
  try {
    await ChatSession.deleteOne({ sessionId: req.params.sessionId })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Chat ──────────────────────────────────────────────────────────────────────

app.post('/api/chat', upload.single('pdf'), async (req, res) => {
  try {
    if (!N8N_WEBHOOK_URL) {
      return res.status(500).json({ error: 'N8N_WEBHOOK_URL non configurato sul server' })
    }

    const { chatInput, sessionId } = req.body
    if (!chatInput || !chatInput.trim()) {
      return res.status(400).json({ error: 'chatInput mancante' })
    }

    let fetchOptions

    if (req.file) {
      const form = new FormData()
      form.append('chatInput', chatInput)
      form.append('sessionId', sessionId || '')
      form.append('pdf', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      })
      fetchOptions = { method: 'POST', body: form, headers: form.getHeaders() }
    } else {
      fetchOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatInput, sessionId: sessionId || '' }),
      }
    }

    const upstream = await fetch(N8N_WEBHOOK_URL, fetchOptions)
    const text = await upstream.text()

    if (!upstream.ok) {
      console.error('[n8n error]', upstream.status, text)
      return res.status(502).json({
        error: `n8n ha risposto con ${upstream.status}`,
        details: text.slice(0, 500),
      })
    }

    let data
    try {
      data = JSON.parse(text)
    } catch {
      data = { output: text }
    }

    const output =
      (Array.isArray(data) ? data[0]?.output : data?.output) ||
      data?.message ||
      data?.text ||
      data?.response ||
      ''

    // Persist to MongoDB asynchronously (don't block the response)
    if (sessionId) {
      const now = new Date()
      persistMessages(
        sessionId,
        {
          id: randomUUID(),
          role: 'user',
          content: chatInput.trim(),
          timestamp: now,
          attachment: req.file
            ? { name: req.file.originalname, size: req.file.size, type: 'pdf' }
            : null,
        },
        {
          id: randomUUID(),
          role: 'assistant',
          content: output,
          timestamp: new Date(),
          attachment: null,
        },
      )
    }

    res.json({ output, raw: data })
  } catch (err) {
    console.error('[server error]', err)
    res.status(500).json({ error: err.message || 'Errore interno' })
  }
})

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
