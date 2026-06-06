import { TIMEZONE } from '../constants/timezone';

export const formatDate = (date: Date) => {
    const dateFormat = Intl.DateTimeFormat("id-ID", {
        timeZone: TIMEZONE,
        hour12: true,
        dayPeriod: "long",
        month: "long",
        day: "2-digit",
        year: "numeric",
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
    })
    return dateFormat.format(date);
}