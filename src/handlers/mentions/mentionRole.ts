import { proto } from "@adiwajshing/baileys";
import { ResolverFunction, ResolverFunctionCarry, ResolverResult } from "../../types/resolver";
import { sendRoleMention } from "../../utils/sendRoleMention";

const mentionRole: ResolverFunctionCarry = (matches): ResolverFunction => async (message: proto.IWebMessageInfo, jid: string, isFromGroup: Boolean): Promise<ResolverResult> => {
    if (!isFromGroup) {
        return {
            destinationId: jid,
            message: { text: "You can only use this feature in a group chat" },
            options: {
                quoted: message,
            }
        };
    }
    const sendMessage = await sendRoleMention(matches, jid);
    if (!sendMessage) return;
    sendMessage.options = {
        quoted: message,
    }
    return sendMessage;
}

export default mentionRole;