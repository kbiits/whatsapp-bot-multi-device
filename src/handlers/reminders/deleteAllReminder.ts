import { proto } from 'baileys';
import { deleteCalendarEvents } from '../../providers/GoogleCalendar';
import { ResolverResult } from '../../types/resolver';
import worker from '../../worker';

export const deleteAllReminders = async (
  query: any,
  jid: string,
  message: proto.IWebMessageInfo
): Promise<ResolverResult> => {
  try {
    const jobs = await worker.jobs(query);
    const gcalEventIds = jobs
      .map((job) => job.attrs?.data?.gcalEventId)
      .filter((id): id is string => !!id);

    if (gcalEventIds.length) await deleteCalendarEvents(gcalEventIds);

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
