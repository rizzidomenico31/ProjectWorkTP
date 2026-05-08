import ChatSession from "../model/SessionSchema.js";
import { randomUUID } from 'crypto'
import fetch from 'node-fetch'
import FormData from 'form-data'

async function chatController (req, res){
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL
    try {
        if (!N8N_WEBHOOK_URL) {
            return res.status(500).json({ error: 'N8N_WEBHOOK_URL non configurato sul server' })
        }

        const { chatInput, sessionId } = req.body
        if (!chatInput || !chatInput.trim()) {
            return res.status(400).json({ error: 'chatInput mancante' })
        }

        const fetchOptions = getFetchOptions(req, chatInput, sessionId)
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
            data = { content: text, type: 'text' }
        }

        const { content: output, type: outputType } = Array.isArray(data) ? data[0] : data;

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
                        ? {name: req.file.originalname, size: req.file.size, type: 'pdf'}
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

        res.json({ content:output, contentType:outputType, raw: data })
    } catch (err) {
        console.error('[server error]', err)
        res.status(500).json({ error: err.message || 'Errore interno' })
    }
}

async function persistMessages(sessionId, userMsg, assistantMsg, dbStatus) {
    if (!dbStatus) return
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

function getFetchOptions(req, chatInput, sessionId) {
    if (req.file) {
        const form = new FormData()
        form.append('chatInput', chatInput)
        form.append('sessionId', sessionId || '')
        form.append('pdf', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        })
        return { method: 'POST', body: form, headers: form.getHeaders() }
    } else {
        return  {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatInput, sessionId: sessionId || '' }),
        }
    }
}


export {chatController}