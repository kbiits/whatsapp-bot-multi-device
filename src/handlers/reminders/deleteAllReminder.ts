import { proto } from "@adiwajshing/baileys";
import { ResolverResult } from "../../types/resolver";
import agenda from "../../agendas";

export const deleteAllReminders = async (
  query: any,
  jid: string,
  message: proto.IWebMessageInfo
): Promise<ResolverResult> => {
  try {
    const deleted = await agenda.cancel(query);
    return {
      destinationId: jid,
      message: { text: `${deleted} reminders deleted` },
      options: {
        quoted: message,
      },
    };
  } catch (error) {
    console.log(error);
    return {
      destinationId: jid,
      message: { text: `Failed to delete all reminders` },
      options: {
        quoted: message,
      },
    };
  }
};
