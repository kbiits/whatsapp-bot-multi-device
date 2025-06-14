export default function getSenderPhone(isFromGroup: boolean, participant: string, jid: string): string {
    if (isFromGroup) {
        return participant.split('@')[0];
    }

    return jid.split('@')[0];
}