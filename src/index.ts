import 'dotenv/config'
import mongoose from 'mongoose';
import logger from './logger';

const DB_URI = process.env.MONGODB_URI || null;
if (!DB_URI) {
    throw Error('DB URI Not Found!');
}

(async () => {
    console.log("Connecting to db...");
    mongoose
        .connect(DB_URI)
        .then(async () => {
            console.log("db connected");

            // start whatsapp connection
            logger.info('Starting WhatsApp connection...');
            const Socket = await import("./sock")
            await Socket.default.connect()
        })
        .catch((err) => {
            console.log('Failed to connect to db');
            console.log(err);
            throw err;
        });
})().catch((err) => console.log('encountered error : ', err))
