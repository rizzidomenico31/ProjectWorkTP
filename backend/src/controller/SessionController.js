import ChatSession from "../model/SessionSchema.js";

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
        res.status(500).json({ error: err.message })
    }
}

async function getMessagesForSession (req, res){
    try {
        const session = await ChatSession.findOne({ sessionId: req.params.sessionId })
        res.json({ messages: session?.messages ?? [] })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

async function deleteSession (req, res){
    try {
        await ChatSession.deleteOne({ sessionId: req.params.sessionId })
        res.json({ ok: true })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

export {getSessions, getMessagesForSession, deleteSession}