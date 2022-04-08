import { isJidGroup, MessageType, proto } from "@adiwajshing/baileys";
import escapeRegExp from "lodash.escaperegexp";
import logger from "./logger";
import sock, { WAMessageUpsert } from "./sock";
import { ResolverFunction, ResolverResult } from "./types/resolver";
import checkPrefix from "./utils/checkPrefix";
import { getResolver, getResolverWithoutPrefix } from "./utils/resolve";

const developerNumbers = JSON.parse(process.env.DEVELOPER_WHATSAPP_NUMBER);
const isDevelopment = process.env.IS_DEVELOPMENT?.toLowerCase() !== 'false';
const shouldMuteWhenInDevelopment = process.env.MUTE_BOT_WHEN_DEVELOPMENT?.toLowerCase() !== 'false';
const shouldSendWarnIfInDevelopment = process.env.SEND_WARN_IF_IN_DEVELOPMENT?.toLowerCase() === 'true';

const handle = async (msgs: WAMessageUpsert) => {
    logger.info('dari handle');
    logger.info(msgs.type)
    msgs.messages.forEach(async msg => {
        sock.readMessages([msg.key]);
        if (!msg.message) return;
        if (msg.key.fromMe) return;
        const jid = msg.key.remoteJid;
        const participant = msg.participant?.replace(/\:\d*/, '') || msg.key.participant?.replace(/\:\d*/, '');
        const isFromGroup = isJidGroup(jid);
        const messageType: MessageType = Object.keys(msg.message)[0] as MessageType;
        let text: string = '';
        if (messageType === 'conversation') {
            text = msg.message?.conversation?.trim() ?? '';
        } else if (messageType === 'extendedTextMessage') {
            text = msg.message?.extendedTextMessage?.text?.trim() ?? '';
        } else if (messageType === 'imageMessage') {
            text = msg.message?.imageMessage?.caption?.trim() ?? '';
        }

        if (!text)
            return;

        logger.info('ini msg')
        logger.info(msg)

        const prefix = await checkPrefix(text.match(/(\S+)/)[1], jid);
        if (!prefix) {
            // replace all whitespace to be 1 character whitespace
            const resolver = getResolverWithoutPrefix(text.replace(/ {2,}/g, ' '));
            await sendMessageFromResolver(resolver, msg, isFromGroup, participant)
            return;
        }
        // if there's no command specified
        if (text.match(`^${escapeRegExp((prefix as string))}$`)) {
            sock.sendMessage(
                jid,
                {
                    text: `Halo, ${isFromGroup ? `@${participant.split('@')[0]}` : 'ada apa ?'}`,
                    mentions: isFromGroup ? [participant] : [],
                }
            );
            return;
        }

        const regexPrefix = new RegExp(`^ *${escapeRegExp(prefix as string)} *`);
        const resolver = getResolver(text.replace(regexPrefix, '').replace(/ +/g, ' '));
        await sendMessageFromResolver(resolver, msg, isFromGroup, participant);
    })

    async function sendMessageFromResolver(resolver: ResolverFunction, msg: proto.IWebMessageInfo, isFromGroup: boolean, participant: string) {
        if (!resolver) return;

        const jid = msg.key.remoteJid;
        if (
            isDevelopment
            && shouldMuteWhenInDevelopment
            && !developerNumbers.includes(isFromGroup ? participant : jid)
        ) {
            if (!shouldSendWarnIfInDevelopment) {
                return;
            }

            await sock.sendMessage(
                jid,
                {
                    text: "Sorry, currently my creator trying to improve me so I can't process your request now",
                },
                {
                    quoted: msg,
                }
            );
            return;
        }

        const sendMessage: ResolverResult = await resolver(msg, jid, isFromGroup);
        if (!sendMessage || !sendMessage.message) return;
        sock.sendMessage(sendMessage.destinationId, sendMessage.message, sendMessage.options);
    };
}

export default handle;