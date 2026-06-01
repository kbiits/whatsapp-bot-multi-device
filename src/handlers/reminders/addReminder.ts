import { proto, WAMessage } from 'baileys';
import { Job, JobAttributesData } from 'agenda';
// @ts-ignore
import * as chrono from 'chrono-node';
import { agendaConstDefinition } from '../../constants/agenda';
import { ReminderScheduleData } from '../../types/reminder';
import { ResolverFunctionCarry, ResolverResult } from '../../types/resolver';
import worker from '../../worker';

const sendBlockedRepeatInterval = (message: WAMessage, jid: string): ResolverResult => {
  return {
    destinationId: jid,
    message: { text: 'Doesn\'t support seconds interval for now' },
    options: {
      quoted: message,
    },
  };
};

export const addReminder: ResolverFunctionCarry =
  (matches: RegExpMatchArray) =>
    async (message: proto.IWebMessageInfo, jid: string): Promise<ResolverResult> => {
      const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
      try {
        const isShouldNotRepeat = matches[1].indexOf('repeat') === -1;
        const cleanRepeatAt = matches[1].replace(/repeat/g, ' ').trim();
        const cleanMsg = matches[2];

        if (cleanRepeatAt.match(/seconds?/) && !isShouldNotRepeat) {
          return sendBlockedRepeatInterval(message, jid);
        }

        const scheduleData: ReminderScheduleData = {
          jid,
          msg: cleanMsg,
        };
        mentionedJids && (scheduleData.mentionedJids = mentionedJids);

        chrono.parseDate('An appointment on Sep 12-13');
        const date: Date | null = chrono.parseDate(cleanRepeatAt.replace(/ +interval.+/, '').toLowerCase(), new Date());

        if (!date) {
          return {
            destinationId: jid,
            message: { text: 'Invalid date format' },
            options: {
              quoted: message,
            },
          };
        }

        if (isShouldNotRepeat) {
          await worker.schedule(date, agendaConstDefinition.send_reminder, scheduleData);
        } else {
          let regexRes = cleanRepeatAt.match(/ +interval +(.+)/);
          if (!regexRes) {
            return {
              destinationId: jid,
              message: { text: 'Please specify interval for repeated reminder' },
              options: {
                quoted: message,
              },
            };
          }

          const job: Job<JobAttributesData> = worker.create(agendaConstDefinition.send_reminder, scheduleData);
          job.repeatEvery(regexRes[1], {
            timezone: 'Asia/Jakarta',
            skipImmediate: true,
            // computeNextRunAtImmediately: false,
          });
          job.schedule(date);
          await job.save();
        }
      } catch (err) {
        console.log('error');
        console.log(err);
        return {
          destinationId: message.key.remoteJid as string,
          message: { text: 'Gagal membuat reminder, Periksa kembali format tanggal' },
          options: {
            quoted: message,
          },
        };
      }

      return {
        destinationId: message.key.remoteJid as string,
        message: { text: 'Reminder created' },
        options: {
          quoted: message,
        },
      };
    };
