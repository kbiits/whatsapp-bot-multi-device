import { proto } from 'baileys';
import GcalConfigModel from '../../models/GcalConfig';
import { ResolverFunctionCarry, ResolverResult } from '../../types/resolver';

export const gcalSetup: ResolverFunctionCarry =
  (matches: RegExpMatchArray) =>
    async (message: proto.IWebMessageInfo, jid: string, isFromGroup: Boolean, participant: string): Promise<ResolverResult> => {
      const senderJid = isFromGroup ? participant : jid;
      const clientEmail = matches[1].trim();
      const privateKey = matches[2].trim();
      const calendarId = matches[3].trim();

      try {
        await GcalConfigModel.findOneAndUpdate(
          { jid: senderJid },
          { clientEmail, privateKey, calendarId },
          { upsert: true, new: true },
        );

        return {
          destinationId: jid,
          message: {
            text: `Google Calendar configured successfully!\nService Account: ${clientEmail}\nCalendar ID: ${calendarId}\n\nYou can now use --gcal when creating reminders.`,
          },
          options: { quoted: message },
        };
      } catch (err) {
        console.log(err);
        return {
          destinationId: jid,
          message: { text: 'Failed to save Google Calendar configuration.' },
          options: { quoted: message },
        };
      }
    };
