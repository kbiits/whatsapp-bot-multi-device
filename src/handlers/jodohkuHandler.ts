import { proto } from 'baileys';
import Socket from "../sock";
import { ResolverFunction, ResolverFunctionCarry, ResolverResult } from "../types/resolver";
import getAllParticipantsOfGroup, { regexCleanParticipant } from "../utils/getAllparticipantsOfGroup";

const isFeatureNotActive = process.env.JODOHKU_FEATURE_ACTIVE?.toLowerCase() !== 'true';
const mutedJids: string[] = JSON.parse(process.env.JODOHKU_MUTED_JIDS);

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

    const participants = await getAllParticipantsOfGroup(Socket.socket, jid);
    const senderJid = message.participant?.replace(regexCleanParticipant, '') || message.key.participant?.replace(regexCleanParticipant, '')
    const idx = participants.indexOf(senderJid);
    idx !== -1 && participants.splice(idx, 1);

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