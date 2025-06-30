import 'dotenv/config'
import mongoose from 'mongoose';
import logger from './logger';
import sock from './sock';

const DB_URI = process.env.MONGODB_URI || null;
if (!DB_URI) {
    throw Error('DB URI Not Found!');
}

// listen to sigterm/sigint signal
const gracefulShutdown = async () => {
    logger.warn('Received shutdown signal, closing connections...');

    if (!sock.socket) return;

    if (!sock.socket.ws.isOpen) return;

    await sock.socket.ws.close();
    await mongoose.disconnect();
    logger.info('App shut down gracefully');
    process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

(async () => {
    console.log("Connecting to db...");
    mongoose
        .connect(DB_URI)
        .then(async () => {
            console.log("db connected");

            // start whatsapp connection
            const Socket = await import("./sock")
            await Socket.default.connect()
            logger.warn('Started WhatsApp connection...');
        })
        .catch((err) => {
            console.log('Failed to connect to db');
            console.log(err);
            throw err;
        });
})().catch((err) => console.log('encountered error : ', err))
