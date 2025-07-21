import pino from "pino";
import PinoPretty from "pino-pretty";
import colorette from "colorette";

const ENV = process.env.ENVIRONMENT?.toLowerCase() || 'production';
const logLevel = process.env.LOGGER_LEVEL || (ENV == 'production' ? 'warn' : 'debug');

const prettier = PinoPretty({
    messageFormat: '{filename} - {msg}',
    colorize: true,
    translateTime: 'SYS:standard',
})

const logger = pino({
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: colorette.isColorSupported,
            colorizeObjects: true,
            crlf: false,
            errorLikeObjectKeys: ['err', 'error'],
            levelFirst: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
            messageFormat: '{filename} - {msg}',

        },
    }
});

export default logger;