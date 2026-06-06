import { proto } from 'baileys';
import { deleteCalendarEvents, resolveCredentials } from '../../providers/GoogleCalendar';
import { ResolverResult } from '../../types/resolver';
import worker from '../../worker';

export const deleteAllReminders = async (
  query: any,
  jid: string,
  message: proto.IWebMessageInfo
): Promise<ResolverResult> => {
  try {
    const jobs = await worker.jobs(query);

    const byOwner = new Map<string, string[]>();
    for (const job of jobs) {
      const gcalEventId = job.attrs?.data?.gcalEventId;
      const gcalOwnerJid = job.attrs?.data?.gcalOwnerJid;
      if (gcalEventId && gcalOwnerJid) {
        const list = byOwner.get(gcalOwnerJid) || [];
        list.push(gcalEventId);
        byOwner.set(gcalOwnerJid, list);
      }
    }
    for (const [ownerJid, eventIds] of byOwner) {
      const creds = await resolveCredentials(ownerJid);
      if (creds) await deleteCalendarEvents(creds, eventIds);
    }

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
