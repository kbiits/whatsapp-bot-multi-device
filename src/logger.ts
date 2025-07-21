import pino from "pino";
import { isColorSupported } from "colorette";

const ENV = process.env.ENVIRONMENT?.toLowerCase() || 'production';
const logLevel = process.env.LOGGER_LEVEL || (ENV == 'production' ? 'warn' : 'debug');

const logger = pino({
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: isColorSupported,
            colorizeObjects: true,
            crlf: false,
            errorLikeObjectKeys: ['err', 'error'],
            levelFirst: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
            messageFormat: '{filename} - {msg}',

        },
    },
    level: logLevel,
});

export default logger;