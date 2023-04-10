import Agenda from "agenda";
import sendReminder from "../jobs/sendReminder";
const mongoConnectionString = process.env.AGENDA_MONGO_URI || null;
if (!mongoConnectionString) {
  throw new Error("connection string for agenda not provided");
}

const agenda = new Agenda({
  db: { address: mongoConnectionString },
}).processEvery("3 minutes");

sendReminder(agenda);

export default agenda;
