import pino from "pino";
import PinoPretty from "pino-pretty";

const ENV = process.env.ENVIRONMENT?.toLowerCase() || 'production';
const logLevel = process.env.LOGGER_LEVEL || (ENV == 'production' ? 'warn' : 'debug');

// Configure pino-pretty for better readability in development
const prettier = PinoPretty({
    colorize: true,
    translateTime: 'SYS:standard',
    ignore: 'hostname',
    levelFirst: true,
});

const logger = pino({
    level: logLevel,
}, prettier);

export default logger;