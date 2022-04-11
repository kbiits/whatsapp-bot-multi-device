import { WASocket } from "@adiwajshing/baileys";

export const regexCleanParticipant = /\:\d*/;
const getAllParticipantsOfGroup =
    async (sock: WASocket, jid: string): Promise<string[]> =>
        (await sock.groupMetadata(jid)).participants.map(p => p.id.replace(regexCleanParticipant, ''));

export default getAllParticipantsOfGroup;