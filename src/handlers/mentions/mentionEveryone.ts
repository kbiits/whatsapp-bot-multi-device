import { proto } from "@adiwajshing/baileys";
import sock from "../../sock";
import { ResolverFunction, ResolverFunctionCarry, ResolverResult } from "../../types/resolver";


const mentionEveryone: ResolverFunctionCarry = (): ResolverFunction => async (message: proto.IWebMessageInfo, jid: string, isFromGroup: Boolean): Promise<ResolverResult> => {
    if (!isFromGroup) {
        return {
            destinationId: jid,
            message: { text: "You can only use this feature in a group chat" },
            options: {
                quoted: message,
            }
        };
    }
    const participantsJids = (await sock.groupMetadata(jid)).participants.map((p) => p.id) ?? [];
    return {
        destinationId: jid,
        message: {
            text: '.',
            mentions: participantsJids,
        },
        options: {
            quoted: message,
        }
    }
}

export default mentionEveryone;