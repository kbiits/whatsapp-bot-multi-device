import { proto } from 'baileys';
import Socket from "../sock";
import { ResolverFunction, ResolverFunctionCarry, ResolverResult } from "../types/resolver";
import { helpReply } from "./help";

const enableHelpCommand = process.env.ENABLE_HELP_COMMAND === 'true';

const helpWithoutPrefix: ResolverFunctionCarry = (matches): ResolverFunction => async (message: proto.IWebMessageInfo, jid: string, isFromGroup: boolean): Promise<ResolverResult> => {
    if (!enableHelpCommand) {
        return;
    }

    // if chat is from group and not mention the bot
    if (isFromGroup && !message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.includes(Socket.socket.user.id.replace(/:\d+/, ''))) {
        return;
    }

    return await helpReply(matches)(message, jid, isFromGroup);
}

export default helpWithoutPrefix;