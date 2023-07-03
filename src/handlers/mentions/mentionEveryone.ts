import { proto } from "@whiskeysockets/baileys";
import logger from "../../logger";
import Socket from "../../sock";
import { ResolverFunction, ResolverFunctionCarry, ResolverResult } from "../../types/resolver";
import getAllParticipantsOfGroup from "../../utils/getAllparticipantsOfGroup";


const mentionEveryone: ResolverFunctionCarry = (): ResolverFunction => async (message: proto.IWebMessageInfo, jid: string, isFromGroup: Boolean): Promise<ResolverResult> => {
    const result: ResolverResult = {
        destinationId: jid,
        options: {
            quoted: message,
        },
    };
    if (!isFromGroup) {
        result.message = { text: "You can only use this feature in a group chat" };
        return result;
    }
    const participantsJids = await getAllParticipantsOfGroup(Socket.socket, jid);
    logger.debug('participants jids');
    logger.debug(participantsJids);
    result.message = {
        text: '.',
        mentions: participantsJids,
    }
    return result;
}

export default mentionEveryone;