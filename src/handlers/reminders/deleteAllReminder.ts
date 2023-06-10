import { proto } from '@whiskeysockets/baileys';
import { ResolverResult } from '../../types/resolver';
import worker from '../../worker';

export const deleteAllReminders = async (
  query: any,
  jid: string,
  message: proto.IWebMessageInfo
): Promise<ResolverResult> => {
  try {
    const deleted = await worker.cancel(query);
    return {
      destinationId: jid,
      message: { text: `${deleted} reminders deleted` },
      options: {
        quoted: message,
      },
    };
  } catch (error) {
    console.log(error);
    return {
      destinationId: jid,
      message: { text: `Failed to delete all reminders` },
      options: {
        quoted: message,
      },
    };
  }
};
