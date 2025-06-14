import { proto, WAMessage } from 'baileys';
import { Job, JobAttributesData } from 'agenda';
// @ts-ignore
import dateJs from 'date.js';
import { agendaConstDefinition } from '../../constants/agenda';
import { ReminderScheduleData } from '../../types/reminder';
import { ResolverFunctionCarry, ResolverResult } from '../../types/resolver';
import worker from '../../worker';

const sendBlockedRepeatInterval = (message: WAMessage, jid: string): ResolverResult => {
  return {
    destinationId: jid,
    message: { text: 'Maaf ya, gak bisa seconds ataupun minutes, terlalu memberatkan server :)' },
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

        if (cleanRepeatAt.match(/seconds?|minutes?/) && !isShouldNotRepeat) {
          return sendBlockedRepeatInterval(message, jid);
        }

        const scheduleData: ReminderScheduleData = {
          jid,
          msg: cleanMsg,
        };
        mentionedJids && (scheduleData.mentionedJids = mentionedJids);

        const numberNow = Date.now();
        const date: Date = dateJs(cleanRepeatAt.replace(/ +interval.+/, '').toLowerCase(), numberNow);

        if (numberNow >= date.getTime()) {
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
          destinationId: message.key.remoteJid,
          message: { text: 'Gagal membuat reminder, Periksa kembali format tanggal' },
          options: {
            quoted: message,
          },
        };
      }

      return {
        destinationId: message.key.remoteJid,
        message: { text: 'Reminder created' },
        options: {
          quoted: message,
        },
      };
    };
