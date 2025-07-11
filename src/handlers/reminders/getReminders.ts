import { proto } from 'baileys';
import { Job } from 'agenda';
import { agendaConstDefinition } from '../../constants/agenda';
import { ResolverFunction, ResolverFunctionCarry, ResolverResult } from '../../types/resolver';
import worker from '../../worker';

export const getReminders: ResolverFunctionCarry =
  (matches: RegExpMatchArray): ResolverFunction =>
    async (message: proto.IWebMessageInfo, jid: string): Promise<ResolverResult> => {
      const queryJid = jid;
      let query = {};
      if (!matches[1])
        query = {
          name: agendaConstDefinition.send_reminder,
          'data.jid': queryJid,
          nextRunAt: { $exists: true, $ne: null, $gte: new Date(Date.now()) },
        };
      else
        query = {
          name: agendaConstDefinition.send_reminder,
          'data.jid': queryJid,
        };

      const jobs = await worker.jobs(query, {
        _id: 1,
      });

      if (!jobs.length) {
        return {
          destinationId: jid,
          message: { text: 'Belum ada reminders disini' },
          options: {
            quoted: message,
          },
        };
      }

      let sendMessage = 'List Reminders\n';
      const formatDateOption: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Jakarta',
        hour12: true,
        weekday: 'long',
        month: 'long',
        year: 'numeric',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      };

      jobs.forEach((job: Job, i: number) => {
        sendMessage += `\n${i + 1}. Message : ${job.attrs?.data?.msg ?? '(Tidak ada message)'}\n    Next Run At : ${job.attrs.nextRunAt?.toLocaleString('id-ID', formatDateOption) || '(Nothing)'
          }${job.attrs.repeatInterval ? `\n    Repeat every : ${job.attrs.repeatInterval}` : ''}`;
      });

      return {
        destinationId: jid,
        message: { text: sendMessage },
        options: {
          quoted: message,
        },
      };
    };
