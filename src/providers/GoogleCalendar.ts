import { google, calendar_v3 } from 'googleapis';
import { TIMEZONE } from '../constants/timezone';
import logger from '../logger';
import GcalConfigModel, { GcalConfig } from '../models/GcalConfig';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const developerNumbers: string[] = JSON.parse(process.env.DEVELOPER_WHATSAPP_NUMBER || '[]');

export interface GcalCredentials {
  clientEmail: string;
  privateKey: string;
  calendarId: string;
}

function getEnvCredentials(): GcalCredentials | null {
  if (
    process.env.GOOGLE_CALENDAR_CLIENT_EMAIL &&
    process.env.GOOGLE_CALENDAR_PRIVATE_KEY &&
    process.env.GOOGLE_CALENDAR_ID
  ) {
    return {
      clientEmail: process.env.GOOGLE_CALENDAR_CLIENT_EMAIL,
      privateKey: process.env.GOOGLE_CALENDAR_PRIVATE_KEY,
      calendarId: process.env.GOOGLE_CALENDAR_ID,
    };
  }
  return null;
}

function isDeveloper(senderJid: string): boolean {
  return developerNumbers.includes(senderJid);
}

/**
 * Resolve credentials for a sender:
 * - Developer numbers use .env credentials
 * - Other users use their own credentials stored in MongoDB
 */
export async function resolveCredentials(senderJid: string): Promise<GcalCredentials | null> {
  if (isDeveloper(senderJid)) {
    return getEnvCredentials();
  }

  const config = await GcalConfigModel.findOne({ jid: senderJid }).lean<GcalConfig>();
  if (!config) return null;

  return {
    clientEmail: config.clientEmail,
    privateKey: config.privateKey,
    calendarId: config.calendarId,
  };
}

function buildClient(creds: GcalCredentials): calendar_v3.Calendar {
  const auth = new google.auth.JWT({
    email: creds.clientEmail,
    key: creds.privateKey.replace(/\\n/g, '\n'),
    scopes: SCOPES,
  });
  return google.calendar({ version: 'v3', auth });
}

export async function createCalendarEvent(
  creds: GcalCredentials,
  summary: string,
  startDate: Date,
  durationMs: number = 30 * 60 * 1000,
  repeatInterval?: string,
): Promise<{ eventId: string; htmlLink: string } | null> {
  try {
    const calendar = buildClient(creds);
    const endDate = new Date(startDate.getTime() + durationMs);

    const event: calendar_v3.Schema$Event = {
      summary,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: TIMEZONE,
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: TIMEZONE,
      },
      description: 'WhatsApp Bot Reminder',
    };

    if (repeatInterval) {
      const rrule = intervalToRRule(repeatInterval);
      if (rrule) {
        event.recurrence = [rrule];
      }
    }

    const res = await calendar.events.insert({
      calendarId: creds.calendarId,
      requestBody: event,
    });

    logger.info(`Google Calendar event created: ${res.data.id}`);
    return {
      eventId: res.data.id!,
      htmlLink: res.data.htmlLink!,
    };
  } catch (err) {
    logger.error('Failed to create Google Calendar event');
    logger.error(err);
    return null;
  }
}

export async function deleteCalendarEvent(
  creds: GcalCredentials,
  eventId: string,
): Promise<boolean> {
  try {
    const calendar = buildClient(creds);
    await calendar.events.delete({
      calendarId: creds.calendarId,
      eventId,
    });
    logger.info(`Google Calendar event deleted: ${eventId}`);
    return true;
  } catch (err) {
    logger.error(`Failed to delete Google Calendar event: ${eventId}`);
    logger.error(err);
    return false;
  }
}

export async function deleteCalendarEvents(
  creds: GcalCredentials,
  eventIds: string[],
): Promise<number> {
  let deleted = 0;
  for (const eventId of eventIds) {
    if (await deleteCalendarEvent(creds, eventId)) {
      deleted++;
    }
  }
  return deleted;
}

function intervalToRRule(interval: string): string | null {
  const match = interval.trim().match(/^(\d+)\s*(second|minute|hour|day|week|month|year)s?$/i);
  if (!match) return null;

  const count = parseInt(match[1]);
  const unit = match[2].toUpperCase();

  const unitMap: Record<string, string> = {
    SECOND: 'SECONDLY',
    MINUTE: 'MINUTELY',
    HOUR: 'HOURLY',
    DAY: 'DAILY',
    WEEK: 'WEEKLY',
    MONTH: 'MONTHLY',
    YEAR: 'YEARLY',
  };

  const freq = unitMap[unit];
  if (!freq) return null;

  return `RRULE:FREQ=${freq};INTERVAL=${count}`;
}
