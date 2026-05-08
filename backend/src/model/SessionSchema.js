import msgSchema from "./MsgSchema.js";
import mongoose from 'mongoose'


const sessionSchema = new mongoose.Schema(
    {
        sessionId: { type: String, unique: true, required: true, index: true },
        title: { type: String, default: 'Nuova conversazione' },
        messages: [msgSchema],
    },
    { timestamps: true },
)

const ChatSession = mongoose.model('ChatSession', sessionSchema)
export default ChatSession