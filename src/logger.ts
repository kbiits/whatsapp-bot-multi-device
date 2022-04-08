import pino from "pino";
import PinoPretty from "pino-pretty";

const ENV = process.env.ENVIRONMENT?.toLowerCase() || 'production';
const logLevel = ENV == 'production' ? 'warn' : (process.env.LOGGER_LEVEL || 'trace');

const prettier = PinoPretty({
    messageFormat: '{filename} - {msg}',
    colorize: false,
    translateTime: 'SYS:standard',
})

const logger = pino({
    level: logLevel,
}, prettier);

export default logger;