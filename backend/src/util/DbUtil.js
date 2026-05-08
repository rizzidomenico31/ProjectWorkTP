import mongoose from 'mongoose'


export async function connect(mongoUri) {
    if (mongoUri) {
        mongoose
            .connect(mongoUri)
            .then(() => {
                console.log('[MongoDB] Connected')
            })
            .catch((err) => {
                console.warn('[MongoDB] Connection failed:', err.message)
            })
    } else {
        console.warn('[MongoDB] MONGODB_URI not set — chat history disabled.')
    }
}

export function isDbReady() {
    return mongoose.connection.readyState === 1
}