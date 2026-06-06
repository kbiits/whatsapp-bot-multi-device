import { proto } from 'baileys';
import { agendaConstDefinition } from '../../constants/agenda';
import { deleteCalendarEvent, deleteCalendarEvents, resolveCredentials } from '../../providers/GoogleCalendar';
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
        const gcalOwnerJid = job.attrs?.data?.gcalOwnerJid;
        if (gcalEventId && gcalOwnerJid) {
          const creds = await resolveCredentials(gcalOwnerJid);
          if (creds) await deleteCalendarEvent(creds, gcalEventId);
        }
        await job.remove();
        count = 1;
      } else {
        const jids = [];
        const gcalJobs: Array<{ eventId: string; ownerJid: string }> = [];
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
          const gcalEventId = jobs[position].attrs?.data?.gcalEventId;
          const gcalOwnerJid = jobs[position].attrs?.data?.gcalOwnerJid;
          if (gcalEventId && gcalOwnerJid) {
            gcalJobs.push({ eventId: gcalEventId, ownerJid: gcalOwnerJid });
          }
        }
        try {
          const byOwner = new Map<string, string[]>();
          for (const { eventId, ownerJid } of gcalJobs) {
            const list = byOwner.get(ownerJid) || [];
            list.push(eventId);
            byOwner.set(ownerJid, list);
          }
          for (const [ownerJid, eventIds] of byOwner) {
            const creds = await resolveCredentials(ownerJid);
            if (creds) await deleteCalendarEvents(creds, eventIds);
          }

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
