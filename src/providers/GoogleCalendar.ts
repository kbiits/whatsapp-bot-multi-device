import { google, calendar_v3 } from 'googleapis';
import { TIMEZONE } from '../constants/timezone';
import logger from '../logger';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

let calendarClient: calendar_v3.Calendar | null = null;

function isConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CALENDAR_CLIENT_EMAIL &&
    process.env.GOOGLE_CALENDAR_PRIVATE_KEY &&
    process.env.GOOGLE_CALENDAR_ID
  );
}

function getClient(): calendar_v3.Calendar {
  if (calendarClient) return calendarClient;

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CALENDAR_CLIENT_EMAIL,
    key: process.env.GOOGLE_CALENDAR_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    scopes: SCOPES,
  });

  calendarClient = google.calendar({ version: 'v3', auth });
  return calendarClient;
}

function getCalendarId(): string {
  return process.env.GOOGLE_CALENDAR_ID!;
}

export async function createCalendarEvent(
  summary: string,
  startDate: Date,
  durationMs: number = 30 * 60 * 1000,
  repeatInterval?: string,
): Promise<{ eventId: string; htmlLink: string } | null> {
  if (!isConfigured()) return null;

  try {
    const calendar = getClient();
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
      description: `WhatsApp Bot Reminder`,
    };

    if (repeatInterval) {
      const rrule = intervalToRRule(repeatInterval);
      if (rrule) {
        event.recurrence = [rrule];
      }
    }

    const res = await calendar.events.insert({
      calendarId: getCalendarId(),
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

export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  if (!isConfigured()) return false;

  try {
    const calendar = getClient();
    await calendar.events.delete({
      calendarId: getCalendarId(),
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

export async function deleteCalendarEvents(eventIds: string[]): Promise<number> {
  if (!isConfigured()) return 0;

  let deleted = 0;
  for (const eventId of eventIds) {
    if (await deleteCalendarEvent(eventId)) {
      deleted++;
    }
  }
  return deleted;
}

/**
 * Convert human-readable interval strings (used by Agenda's repeatEvery)
 * into RFC 5545 RRULE format for Google Calendar.
 *
 * Supports: "1 day", "2 hours", "3 weeks", "1 month", "30 minutes", etc.
 */
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
