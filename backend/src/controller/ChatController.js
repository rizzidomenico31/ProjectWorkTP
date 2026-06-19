import ChatSession from "../model/SessionSchema.js";
import { randomUUID } from 'crypto'
import fetch from 'node-fetch'
import FormData from 'form-data'
import {sanitizePdfBuffer} from "../util/sanitizePdf.js";
import {
    isValidSessionId,
    sanitizeFilename,
    validatePdfFile,
    MAX_CHAT_INPUT_LEN,
} from "../util/validation.js";

async function chatController (req, res){
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL
    try {
        if (!N8N_WEBHOOK_URL) {
            return res.status(500).json({ error: 'N8N_WEBHOOK_URL non configurato sul server' })
        }

        const { chatInput, sessionId } = req.body
        if (typeof chatInput !== 'string' || !chatInput.trim()) {
            return res.status(400).json({ error: 'chatInput mancante' })
        }
        if (chatInput.length > MAX_CHAT_INPUT_LEN) {
            return res.status(400).json({
                error: `chatInput troppo lungo (max ${MAX_CHAT_INPUT_LEN} caratteri)`,
            })
        }
        // sessionId è opzionale, ma se presente deve essere un UUID valido.
        if (sessionId && !isValidSessionId(sessionId)) {
            return res.status(400).json({ error: 'sessionId non valido' })
        }
        // Il file (se presente) deve essere un PDF reale, non solo dichiarato tale.
        if (req.file) {
            const check = validatePdfFile(req.file)
            if (!check.ok) {
                return res.status(400).json({ error: check.error })
            }
        }

        const fetchOptions = await getFetchOptions(req, chatInput, sessionId)
        const upstream = await fetch(N8N_WEBHOOK_URL, fetchOptions)
        const text = await upstream.text()

        if (!upstream.ok) {
            console.error('[n8n error]', upstream.status, text.slice(0, 500))
            return res.status(502).json({
                error: 'Errore nel servizio di elaborazione',
            })
        }

        let data
        try {
            data = JSON.parse(text)
        } catch {
            data = { content: text, type: 'text' }
        }

        const n8nData = Array.isArray(data) ? data[0] : data
        const outputType = n8nData?.type || 'text'
        let output = null
        switch (outputType) {
            case 'text': output = n8nData?.content
                break
            case 'quiz': output = JSON.stringify(n8nData?.questions)
                break
            case 'flashcard': output = JSON.stringify(n8nData?.contentFlashcard)
                break
            case 'map': output = JSON.stringify(n8nData?.contentMap)
                break
            default: output = JSON.stringify(n8nData?.content)
        }


        res.json({ content: output, contentType: outputType, raw: data })

        // Persist to MongoDB asynchronously (don't block the response)
        if (sessionId) {
            const now = new Date()
            persistMessages(
                sessionId,
                {
                    id: randomUUID(),
                    role: 'user',
                    content: chatInput.trim(),
                    contentType: "text",
                    timestamp: now,
                    attachment: req.file
                        ? {name: sanitizeFilename(req.file.originalname), size: req.file.size, type: 'pdf'}
                        : null,
                },
                {
                    id: randomUUID(),
                    role: 'assistant',
                    content: output,
                    contentType: outputType,
                    timestamp: new Date(),
                    attachment: null,
                },
            )
        }
    } catch (err) {
        console.error('[server error]', err)
        if (res.headersSent) return
        // I PDF rifiutati dalla sanitizzazione sono errori dell'input dell'utente.
        if (err.message?.includes('PDF')) {
            return res.status(400).json({ error: err.message })
        }
        res.status(500).json({ error: 'Errore interno del server' })
    }
}

async function persistMessages(sessionId, userMsg, assistantMsg) {
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
        session.save()
    } catch (err) {
        console.warn('[MongoDB] persistMessages error:', err.message)
    }
}

async function getFetchOptions(req, chatInput, sessionId) {
    if (req.file) {
        const sanitizedPdf = await sanitizePdfBuffer(req.file.buffer)
        const form = new FormData()
        form.append('chatInput', chatInput)
        form.append('sessionId', sessionId || '')
        form.append('pdf', sanitizedPdf, {
            filename: sanitizeFilename(req.file.originalname),
            contentType: 'application/pdf',
        })
        return {method: 'POST', body: form, headers: form.getHeaders()}
    } else {
        return {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({chatInput, sessionId: sessionId || ''}),
        }
    }
}


export {chatController}