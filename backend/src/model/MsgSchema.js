import mongoose from 'mongoose'

const msgSchema = new mongoose.Schema(
    {
        id: String,
        role: { type: String, enum: ['user', 'assistant', 'error'] },
        content: String,
        contentType: {type: String, enum: ['text', 'map']},
        timestamp: Date,
        attachment: mongoose.Schema.Types.Mixed,
    },
    { _id: false },
)

export default msgSchema