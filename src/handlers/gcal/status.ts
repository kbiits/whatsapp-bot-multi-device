import { proto } from 'baileys';
import GcalConfigModel from '../../models/GcalConfig';
import { resolveCredentials } from '../../providers/GoogleCalendar';
import { ResolverFunctionCarry, ResolverResult } from '../../types/resolver';

export const gcalStatus: ResolverFunctionCarry =
  () =>
    async (message: proto.IWebMessageInfo, jid: string, isFromGroup: Boolean, participant: string): Promise<ResolverResult> => {
      const senderJid = isFromGroup ? participant : jid;

      const creds = await resolveCredentials(senderJid);
      if (!creds) {
        return {
          destinationId: jid,
          message: { text: 'Google Calendar is not configured for your account.\nUse "gcal setup" to set up your credentials.' },
          options: { quoted: message },
        };
      }

      return {
        destinationId: jid,
        message: {
          text: `Google Calendar is configured\nService Account: ${creds.clientEmail}\nCalendar ID: ${creds.calendarId}`,
        },
        options: { quoted: message },
      };
    };
