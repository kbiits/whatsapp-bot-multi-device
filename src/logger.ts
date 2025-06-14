import pino from "pino";
import PinoPretty from "pino-pretty";

const ENV = process.env.ENVIRONMENT?.toLowerCase() || 'production';
const logLevel = process.env.LOGGER_LEVEL || (ENV == 'production' ? 'warn' : 'debug');

const prettier = PinoPretty({
    messageFormat: '{filename} - {msg}',
    colorize: false,
    translateTime: 'SYS:standard',
})

const logger = pino({
    level: logLevel,
}, prettier);

export default logger;