import { proto } from 'baileys';
import { agendaConstDefinition } from '../../constants/agenda';
import { deleteCalendarEvent, deleteCalendarEvents } from '../../providers/GoogleCalendar';
import { ResolverFunction, ResolverFunctionCarry, ResolverResult } from '../../types/resolver';
import worker from '../../worker';
import { deleteAllReminders } from './deleteAllReminder';

export const deleteReminder: ResolverFunctionCarry =
  (matches: RegExpMatchArray): ResolverFunction =>
    async (message: proto.IWebMessageInfo, jid: string): Promise<ResolverResult> => {
      let query: any = getQuery(matches[1], jid);

      if (matches[2].toLowerCase() === 'all') {
        return await deleteAllReminders(query, jid, message);
      }
      const jobs = await worker.jobs(query, {
        _id: 1,
      });

      const idsDelete: Array<string> = matches[2].split(/ *, */);
      if (!jobs.length || !idsDelete.length) {
        return {
          destinationId: jid,
          message: { text: `Invalid id` },
          options: {
            quoted: message,
          },
        };
      }

      let count: number = 0;

      if (idsDelete.length == 1) {
        const nthDelete = parseInt(idsDelete[0]);
        const job = jobs[nthDelete - 1];
        const gcalEventId = job.attrs?.data?.gcalEventId;
        if (gcalEventId) await deleteCalendarEvent(gcalEventId);
        await job.remove();
        count = 1;
      } else {
        const jids = [];
        const gcalEventIds: string[] = [];
        for (const idx of idsDelete) {
          const position = parseInt(idx) - 1;
          if (!jobs[position]) {
            return {
              destinationId: jid,
              message: { text: `Invalid id : ${idx}, please check your ids before sending the command` },
              options: {
                quoted: message,
              },
            };
          }
          jids.push(jobs[position].attrs._id);
          const gcalId = jobs[position].attrs?.data?.gcalEventId;
          if (gcalId) gcalEventIds.push(gcalId);
        }
        try {
          if (gcalEventIds.length) await deleteCalendarEvents(gcalEventIds);
          const deletedCount = await worker.cancel({
            _id: {
              $in: jids,
            },
          });
          count = deletedCount;
        } catch (error) {
          console.log(error);

          return {
            destinationId: jid,
            message: { text: 'Failed to delete reminders' },
            options: {
              quoted: message,
            },
          };
        }
      }

      // await jobs[nthDelete - 1].remove();

      return {
        destinationId: jid,
        message: { text: `${count} reminders deleted` },
      };
    };

const getQuery = (match: string, jid: string): Object => {
  let query: Object;
  if (!match)
    query = {
      name: agendaConstDefinition.send_reminder,
      'data.jid': jid,
      nextRunAt: { $exists: true, $ne: null, $gte: new Date(Date.now()) },
    };
  else
    query = {
      name: agendaConstDefinition.send_reminder,
      'data.jid': jid,
    };
  return query;
};
