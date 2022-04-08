import { MessageType, proto } from "@adiwajshing/baileys";
import sock from "../sock";
import { ResolverFunction, ResolverFunctionCarry, ResolverResult } from "../types/resolver";

const isFeatureNotActive = process.env.JODOHKU_FEATURE_ACTIVE?.toLowerCase() !== 'true';

const jodohkuHandler: ResolverFunctionCarry = (): ResolverFunction => async (message: proto.IWebMessageInfo, jid: string, isFromGroup: boolean): Promise<ResolverResult> => {
    if (isFeatureNotActive) {
        return;
    }

    if (!isFromGroup) {
        return {
            destinationId: jid,
            message: {
                text: "You can only use this feature inside a group chat",
            },
            options: {
                quoted: message,
            }
        }
    }

    const participants = (await sock.groupMetadata(jid)).participants.map(p => p.id);
    const idx = participants.indexOf(message.participant);
    idx !== -1 && participants.splice(idx, 1);

    const mutedJids: Array<string> = JSON.parse(process.env.JODOHKU_MUTED_JIDS);
    if (mutedJids.length) {
        mutedJids.forEach(jid => {
            const idxFound = participants.indexOf(jid);
            idxFound !== -1 && participants.splice(idxFound, 1);
        })
    }

    if (!participants.length) {
        return;
    }

    const matchedJid = participants[Math.floor(Math.random() * participants.length)];

    return {
        destinationId: jid,
        message: {
            text: `@${matchedJid.split('@')[0]}`,
            mentions: [matchedJid],
        },
        options: {
            quoted: message,
        }
    };
}

export default jodohkuHandler;