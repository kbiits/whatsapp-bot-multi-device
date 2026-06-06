export type ReminderScheduleData = {
    jid: string;
    msg: string;
    mentionedJids?: string[];
    gcalEventId?: string;
    gcalHtmlLink?: string;
};