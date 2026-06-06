import { helpReply } from '../handlers/help';
import { convertToSticker } from '../handlers/convert2sticker';
import { joke } from '../handlers/joke';
import { loveMeter } from '../handlers/loveMeter';
import { meme } from '../handlers/meme';
import { updatePrefix } from '../handlers/prefix/updatePrefix';
import { randomQuote } from '../handlers/randomQuote';
import { addReminder } from '../handlers/reminders/addReminder';
import { deleteReminder } from '../handlers/reminders/deleteReminder';
import { getReminders } from '../handlers/reminders/getReminders';
import { addRole } from '../handlers/roles/addRole';
import { assignUserToRole } from '../handlers/roles/assignUserToRole';
import { deleteRole } from '../handlers/roles/deleteRole';
import { getUsersForRole } from '../handlers/roles/getUsersForRole';
import { listRole } from '../handlers/roles/listRole';
import { removeUserFromRole } from '../handlers/roles/removeUserFromRole';
import { gcalRemove } from '../handlers/gcal/remove';
import { gcalSetup } from '../handlers/gcal/setup';
import { gcalStatus } from '../handlers/gcal/status';
import { CommandMap } from '../types/command';
import sendN8nWebhook from '../handlers/n8n/n8n';

export const commands: CommandMap = {
    '^AI (.+)$': sendN8nWebhook,
    '^help$': helpReply,
    '^(?:reminders?|rem) +add +(?:for +time)?(.+) +(?:msg|messages?) ([\\s\\S]+?)( --gcal(?:[ =]\\S+)?)?$': addReminder,
    '^(?:reminders?|rem) list( with past)?$': getReminders,
    '^(?:reminders?|rem) delete?( with past)? ([0-9,\\s]+|all)$': deleteReminder,

    '^stic?ker (?:pls|please)$': convertToSticker,
    // '^gif2stic?ker (?:pls|please)$': gif2Sticker,

    '^quotes? (?:pls|please)$': randomQuote,

    '^love meter ([\\S\\s]+) +(?:and|dan) +([\\S\\s]+)$': loveMeter,

    '^(dark )?jokes? (?:pls|please)[ ]*(?:--)?([a-z0-9 ]+)?$': joke,

    '^memes? (?:pls|please)[ ]*(?:--)?([a-z0-9 ]+)?$': meme,

    '^create roles? ([a-zA-Z0-9-_@]+)$': addRole,
    '^delete role ([a-zA-Z0-9]+)$': deleteRole,
    '^roles?$': listRole,
    '^assign ([@ A-Za-z0-9_ ]+) to roles? ([a-zA-Z0-9-_@]+)$': assignUserToRole,
    '^remove ([@ A-Za-z0-9_ ]+) from roles? ([A-Za-z0-9-_@]+)$': removeUserFromRole,
    '^users? in roles? ([A-Za-z0-9-_@]+)$': getUsersForRole,

    '^change prefix (?:to )?(\\S+)$': updatePrefix,

    '^gcal +setup +(\\S+) +(\\S+) +(\\S+)$': gcalSetup,
    '^gcal +(?:remove|delete)$': gcalRemove,
    '^gcal +status$': gcalStatus,
};
