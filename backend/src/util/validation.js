// Validazione centralizzata degli input lato server.
// Obiettivo: non fidarsi mai del client (MIME, dimensioni, formato) e validare il
// contenuto reale dei dati ricevuti.

const MAX_FILENAME_LEN = 200
const MAX_CHAT_INPUT_LEN = 8000

// UUID v4 generato dal frontend (uuidv4 / randomUUID)
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isValidSessionId(sessionId) {
  return typeof sessionId === 'string' && UUID_RE.test(sessionId)
}

// Rimuove path traversal, separatori di percorso e caratteri di controllo dal
// nome file fornito dal client, limitandone la lunghezza.
function sanitizeFilename(name = '') {
  const base = String(name)
    .replace(/[/\\]/g, '_')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f]/g, '')
    .trim()
  return base.slice(0, MAX_FILENAME_LEN) || 'documento.pdf'
}

// Verifica che il file caricato sia un PDF reale e non semplicemente dichiarato
// tale tramite il MIME (facilmente falsificabile).
function validatePdfFile(file) {
  if (!file) return { ok: true }

  const name = String(file.originalname || '')
  if (!/\.pdf$/i.test(name)) {
    return { ok: false, error: 'Il file deve avere estensione .pdf' }
  }

  const buf = file.buffer
  if (!buf || buf.length < 5) {
    return { ok: false, error: 'File PDF vuoto o non valido' }
  }

  // Magic bytes: un PDF inizia con "%PDF-" (lo spec consente pochi byte iniziali
  // prima dell'header, quindi cerchiamo nei primi 1024 byte).
  const header = buf.subarray(0, 1024).toString('latin1')
  if (!header.includes('%PDF-')) {
    return { ok: false, error: 'Il contenuto del file non è un PDF valido' }
  }

  // Un PDF integro termina con il marcatore "%%EOF".
  const tail = buf.subarray(Math.max(0, buf.length - 2048)).toString('latin1')
  if (!tail.includes('%%EOF')) {
    return { ok: false, error: 'Il PDF risulta troncato o corrotto' }
  }

  return { ok: true }
}

export {
  isValidSessionId,
  sanitizeFilename,
  validatePdfFile,
  MAX_CHAT_INPUT_LEN,
}
