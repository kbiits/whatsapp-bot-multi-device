import 'dotenv/config'
import mongoose from 'mongoose';
import logger from './logger';
import sock from './sock';
import bootstrapAPI from './api';

const DB_URI = process.env.MONGODB_URI || null;
if (!DB_URI) {
    throw Error('DB URI Not Found!');
}

const api = bootstrapAPI();

// listen to sigterm/sigint signal
const shutdown = async () => {
    logger.warn('Received shutdown signal, closing connections...');

    if (api.getServer()) {
        const promiseStopAPI = new Promise((res) => {
            api.stop(() => {
                res(true);
            });
        })
        logger.info('Stopping API server...');
        await promiseStopAPI;
        logger.info('API server stopped');
    }

    if (sock.socket && sock.socket.ws && sock.socket.ws.isOpen) {
        logger.info('Closing WhatsApp connection...');
        await sock.socket.ws.close();
        logger.info('WhatsApp connection closed');
    }

    if (mongoose.connection.readyState === mongoose.ConnectionStates.connected) { // only disconnect if the connection is open
        logger.info('Disconnecting from database...');
        await mongoose.disconnect();
        logger.info('Database disconnected');
    }
};

const gracefullyShutdown = async () => {
    await shutdown();
    logger.info('App is gracefully shutdown');
    process.exit(0);
};

process.on("SIGINT", gracefullyShutdown);
process.on("SIGTERM", gracefullyShutdown);

(async () => {
    try {
        // connect to the database
        logger.info("Connecting to db...");
        const mongooseConnection = await mongoose.connect(DB_URI);
        logger.info("db connected");

        // start whatsapp connection
        await sock.connect()
        logger.info('Started WhatsApp connection...');

        // start the API
        api.start();
        logger.info(`API server started on port ${process.env.HTTP_PORT || 3000}`);
    } catch (error) {
        logger.error("Error starting the app: ", error);
        shutdown();
        logger.error("App shutdown due to error");
        process.exit(1);
    }
})()
