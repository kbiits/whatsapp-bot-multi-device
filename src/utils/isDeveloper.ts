import logger from "../logger";
import { normalizeNumber } from "./getSender";

const developerNumbers: string[] = (JSON.parse(process.env.DEVELOPER_WHATSAPP_NUMBER || '[]') as string[]).map(normalizeNumber);

const isDeveloper = (senderJid: string): boolean => developerNumbers.includes(normalizeNumber(senderJid));

// logs the sender id so LID-addressed developers (xxx@lid) can find the id to put in DEVELOPER_WHATSAPP_NUMBER
export const isDeveloperSender = (senderJid: string, command: string): boolean => {
    if (isDeveloper(senderJid)) return true;
    logger.warn(`Denied developer-only command "${command}" from sender ${senderJid}`);
    return false;
};

export default isDeveloper;
