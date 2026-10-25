import { regexCleanParticipant } from "./getAllparticipantsOfGroup";

export default function getSenderPhone(isFromGroup: boolean, participant: string, jid: string): string {
    if (isFromGroup) {
        return participant.split('@')[0];
    }

    return jid.split('@')[0];
}

// "628123:12@s.whatsapp.net", "+62 812-3", "628123" -> digits only, without device suffix
export const normalizeNumber = (input: string): string =>
    (input || '').split('@')[0].replace(regexCleanParticipant, '').replace(/\D/g, '');
