import { proto, WAMessage } from 'baileys';
import { Job, JobAttributesData } from 'agenda';
// @ts-ignore
import * as chrono from 'chrono-node';
import { agendaConstDefinition } from '../../constants/agenda';
import { TIMEZONE } from '../../constants/timezone';
import { createCalendarEvent } from '../../providers/GoogleCalendar';
import { ReminderScheduleData } from '../../types/reminder';
import { ResolverFunctionCarry, ResolverResult } from '../../types/resolver';
import worker from '../../worker';

const DEFAULT_EVENT_DURATION_MS = 30 * 60 * 1000;

/**
 * Parse a duration string like "1h", "30m", "1h30m", "90m" into milliseconds.
 * Returns null if the format is invalid.
 */
function parseDuration(input: string): number | null {
  const match = input.trim().match(/^(?:(\d+)h)?(?:(\d+)m)?$/i);
  if (!match || (!match[1] && !match[2])) return null;
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  if (hours === 0 && minutes === 0) return null;
  return (hours * 60 + minutes) * 60 * 1000;
}

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
      const gcalFlag = matches[3]?.trim();
      const syncToGcal = !!gcalFlag;
      let gcalDurationMs = DEFAULT_EVENT_DURATION_MS;
      if (gcalFlag) {
        const durationArg = gcalFlag.replace(/^--gcal[= ]?/, '').trim();
        if (durationArg) {
          const parsed = parseDuration(durationArg);
          if (parsed) gcalDurationMs = parsed;
        }
      }
      const scheduleData: ReminderScheduleData = { jid, msg: '' };
      try {
        const isShouldNotRepeat = matches[1].indexOf('repeat') === -1;
        const cleanRepeatAt = matches[1].replace(/repeat/g, ' ').trim();
        const cleanMsg = matches[2].replace(/ *--gcal(?:[= ]\S+)?$/, '').trim();

        if (cleanRepeatAt.match(/seconds?/) && !isShouldNotRepeat) {
          return sendBlockedRepeatInterval(message, jid);
        }

        scheduleData.msg = cleanMsg;
        mentionedJids && (scheduleData.mentionedJids = mentionedJids);

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

        let repeatIntervalStr: string | undefined;

        if (isShouldNotRepeat) {
          if (syncToGcal) {
            const gcalResult = await createCalendarEvent(cleanMsg, date, gcalDurationMs);
            if (gcalResult) {
              scheduleData.gcalEventId = gcalResult.eventId;
              scheduleData.gcalHtmlLink = gcalResult.htmlLink;
            }
          }
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

          repeatIntervalStr = regexRes[1];
          if (syncToGcal) {
            const gcalResult = await createCalendarEvent(cleanMsg, date, gcalDurationMs, repeatIntervalStr);
            if (gcalResult) {
              scheduleData.gcalEventId = gcalResult.eventId;
              scheduleData.gcalHtmlLink = gcalResult.htmlLink;
            }
          }

          const job: Job<JobAttributesData> = worker.create(agendaConstDefinition.send_reminder, scheduleData);
          job.repeatEvery(repeatIntervalStr, {
            timezone: TIMEZONE,
            skipImmediate: true,
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

      const replyText = scheduleData.gcalHtmlLink
        ? `Reminder created\n📅 Google Calendar: ${scheduleData.gcalHtmlLink}`
        : 'Reminder created';

      return {
        destinationId: message.key.remoteJid as string,
        message: { text: replyText },
        options: {
          quoted: message,
        },
      };
    };
