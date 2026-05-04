import express from 'express'
import cors from 'cors'
import multer from 'multer'
import fetch from 'node-fetch'
import FormData from 'form-data'

const PORT = process.env.PORT || 8080
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*')
  .split(',')
  .map((s) => s.trim())

if (!N8N_WEBHOOK_URL) {
  console.warn('[WARN] N8N_WEBHOOK_URL is not set. /api/chat will return 500.')
}

const app = express()

app.use(
  cors({
    origin: ALLOWED_ORIGINS.includes('*') ? true : ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
  }),
)
app.use(express.json({ limit: '1mb' }))

// PDF only, max 20 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true)
    cb(new Error('Solo file PDF sono consentiti'))
  },
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', n8nConfigured: Boolean(N8N_WEBHOOK_URL) })
})

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
      // multipart/form-data: text fields + binary PDF
      const form = new FormData()
      form.append('chatInput', chatInput)
      form.append('sessionId', sessionId || '')
      form.append('pdf', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      })
      fetchOptions = {
        method: 'POST',
        body: form,
        headers: form.getHeaders(),
      }
    } else {
      // JSON payload when there is no file
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

    // Try to parse JSON, fall back to plain text
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

    res.json({ output, raw: data })
  } catch (err) {
    console.error('[server error]', err)
    res.status(500).json({ error: err.message || 'Errore interno' })
  }
})

// Multer / generic error handler
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.message?.includes('PDF')) {
    return res.status(400).json({ error: err.message })
  }
  res.status(500).json({ error: 'Errore interno del server' })
})

app.listen(PORT, () => {
  console.log(`Backend listening on :${PORT}`)
})
