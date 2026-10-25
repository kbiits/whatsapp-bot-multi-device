import { isJidGroup, proto } from 'baileys';
import logger from '../logger';
import BlacklistModel from '../models/Blacklist';
import Socket from '../sock';
import { normalizeNumber } from './getSender';

// in-memory cache so every incoming message doesn't hit the db
// number -> lid (empty string when unknown)
const entries = new Map<string, string>();
// every id that should be ignored: phone numbers and their LIDs
const blockedIds = new Set<string>();

const rebuildBlockedIds = () => {
    blockedIds.clear();
    entries.forEach((lid, number) => {
        blockedIds.add(number);
        lid && blockedIds.add(lid);
    });
};

export const loadBlacklist = async (): Promise<void> => {
    const docs = await BlacklistModel.find({}, { number: 1, lid: 1 }).lean().exec();
    entries.clear();
    docs.forEach(doc => entries.set(doc.number, doc.lid || ''));
    rebuildBlockedIds();
    logger.info(`Loaded ${entries.size} blacklisted number(s)`);
};

// WhatsApp may address a sender by LID instead of phone number, so look it up while we still know the number
const resolveLid = async (number: string): Promise<string> => {
    try {
        const [result] = (await Socket.socket?.onWhatsApp(`${number}@s.whatsapp.net`)) || [];
        return result?.lid ? normalizeNumber(String(result.lid)) : '';
    } catch (error) {
        logger.warn({ error }, `Failed to resolve LID for ${number}`);
        return '';
    }
};

export const isBlacklisted = (jidOrNumber: string): boolean => {
    const number = normalizeNumber(jidOrNumber);
    return !!number && blockedIds.has(number);
};

// every jid that may identify the sender: phone-number jid and/or LID, depending on addressing mode
const getSenderCandidates = (msg: proto.IWebMessageInfo): string[] => {
    const key = msg.key as proto.IMessageKey & Record<string, string | undefined>;
    const candidates = [
        msg.participant,
        key.participant,
        key.participantPn,
        key.participantLid,
        key.participantAlt,
        key.senderPn,
        key.senderLid,
        key.remoteJidAlt,
    ];
    if (key.remoteJid && !isJidGroup(key.remoteJid)) {
        candidates.push(key.remoteJid);
    }
    return candidates.filter(Boolean);
};

export const isBlacklistedMessage = (msg: proto.IWebMessageInfo): boolean => {
    if (!blockedIds.size || !msg.key || msg.key.fromMe) return false;
    return getSenderCandidates(msg).some(isBlacklisted);
};

export const addToBlacklist = async (numbers: string[], addedBy: string): Promise<string[]> => {
    const added: string[] = [];
    for (const number of numbers) {
        if (blockedIds.has(number)) continue;
        const lid = await resolveLid(number);
        await BlacklistModel.updateOne({ number }, { number, lid, addedBy }, { upsert: true }).exec();
        entries.set(number, lid);
        added.push(lid ? `${number} (lid ${lid})` : number);
    }
    rebuildBlockedIds();
    return added;
};

// accepts phone numbers or LIDs
export const removeFromBlacklist = async (ids: string[]): Promise<string[]> => {
    const removed = [...entries.entries()]
        .filter(([number, lid]) => ids.includes(number) || (lid && ids.includes(lid)))
        .map(([number]) => number);
    if (!removed.length) return [];

    await BlacklistModel.deleteMany({ number: { $in: removed } }).exec();
    removed.forEach(number => entries.delete(number));
    rebuildBlockedIds();
    return removed;
};

export const getBlacklist = (): string[] =>
    [...entries.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([number, lid]) => lid ? `${number} (lid ${lid})` : `${number} (lid unknown)`);

// numbers typed in the command text + users mentioned in the message
export const parseNumbersFromCommand = (text: string, message: proto.IWebMessageInfo): string[] => {
    const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const typedNumbers = text
        .split(/[\s,]+/)
        .filter(token => token && !token.startsWith('@'));

    return [...new Set(
        [...mentionedJids, ...typedNumbers]
            .map(normalizeNumber)
            .filter(number => number.length >= 5)
    )];
};
