import ChatSession from "../model/SessionSchema.js";
import { isValidSessionId } from "../util/validation.js";

async function getSessions(_req, res) {
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
        console.error('[getSessions]', err)
        res.status(500).json({ error: 'Errore interno del server' })
    }
}

async function getMessagesForSession (req, res){
    if (!isValidSessionId(req.params.sessionId)) {
        return res.status(400).json({ error: 'sessionId non valido' })
    }
    try {
        const session = await ChatSession.findOne({ sessionId: req.params.sessionId })
        res.json({ messages: session?.messages ?? [] })
    } catch (err) {
        console.error('[getMessagesForSession]', err)
        res.status(500).json({ error: 'Errore interno del server' })
    }
}

async function deleteSession (req, res){
    if (!isValidSessionId(req.params.sessionId)) {
        return res.status(400).json({ error: 'sessionId non valido' })
    }
    try {
        await ChatSession.deleteOne({ sessionId: req.params.sessionId })
        res.json({ ok: true })
    } catch (err) {
        console.error('[deleteSession]', err)
        res.status(500).json({ error: 'Errore interno del server' })
    }
}

export {getSessions, getMessagesForSession, deleteSession}