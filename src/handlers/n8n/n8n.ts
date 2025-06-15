import { proto } from "baileys";
import { ResolverFunctionCarry, ResolverResult } from "../../types/resolver";
import getSenderPhone from "../../utils/getSender";
import axios from "axios";
import logger from "../../logger";

const developerNumbers = JSON.parse(process.env.DEVELOPER_WHATSAPP_NUMBER);
const webhookUrl = process.env.N8N_WEBHOOK_URL;
if (!webhookUrl) {
    console.error('N8N Webhook URL is not set in environment variables.');
    process.exit(1);
}

const sendN8nWebhook: ResolverFunctionCarry = (matches) => async (message: proto.IWebMessageInfo, jid: string, isFromGroup: Boolean, participant: string) => {
    const senderPhone = getSenderPhone(isFromGroup as boolean, participant, jid);
    if (!senderPhone) {
        console.error('Sender phone number could not be determined.');
        return { message: { text: 'Sender phone number could not be determined.' }, destinationId: jid };
    }

    // if (!developerNumbers.includes(senderPhone)) {
    //     console.warn('Webhook not sent for developer number:', senderPhone);
    //     return null;
    // }

    const payload = {
        message: message.message.conversation || message.message.extendedTextMessage?.text || '',
        sender: participant,
    };

    try {
        const resp = await axios.post(webhookUrl, payload, {
            auth: {
                username: 'nabiel',
                password: 'nabiel',
            },
        })

        return {
            destinationId: jid,
            message: { text: resp.data.text },
        }
    } catch (error) {
        logger.error('Error sending webhook to n8n:', error);
    }
}

export default sendN8nWebhook;