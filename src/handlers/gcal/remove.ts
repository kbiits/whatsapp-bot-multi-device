import { proto } from 'baileys';
import GcalConfigModel from '../../models/GcalConfig';
import { ResolverFunctionCarry, ResolverResult } from '../../types/resolver';

export const gcalRemove: ResolverFunctionCarry =
  () =>
    async (message: proto.IWebMessageInfo, jid: string, isFromGroup: Boolean, participant: string): Promise<ResolverResult> => {
      const senderJid = isFromGroup ? participant : jid;

      try {
        const deleted = await GcalConfigModel.findOneAndDelete({ jid: senderJid });
        if (!deleted) {
          return {
            destinationId: jid,
            message: { text: 'No Google Calendar configuration found for your account.' },
            options: { quoted: message },
          };
        }

        return {
          destinationId: jid,
          message: { text: 'Google Calendar configuration removed.' },
          options: { quoted: message },
        };
      } catch (err) {
        console.log(err);
        return {
          destinationId: jid,
          message: { text: 'Failed to remove Google Calendar configuration.' },
          options: { quoted: message },
        };
      }
    };
