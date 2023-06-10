import { MessageType, proto } from '@whiskeysockets/baileys';
import { commands } from '../constants/commands';
import PrefixModel from '../models/Prefix';
import { ResolverFunctionCarry, ResolverResult } from '../types/resolver';

const defaultPrefix = process.env.DEFAULT_PREFIX;

const helps = [
    [
        'help',
        '(Show this message)',
    ],
    [
        'reminders add _{time}_ msg _{msg}_',
        '(Add reminder)'
    ],
    [
        'reminders add _{time}_ interval _{interval}_ repeat msg _{msg}_ ',
        '(Add repeated reminder, don\'t forget to set the interval)'
    ],
    [
        'reminders list',
        '(Get active reminders)'
    ],
    [
        'reminders list with past',
        '(Get active reminders including past schedule / non active shedule)'
    ],
    [
        'reminders delete _{id}_',
        '(Delete reminder, get the id from list command)'
    ],
    [
        'reminders delete with past _{id}_',
        '(Delete reminder including past / non active schedule, get the id from list command with past)'
    ],
    [
        'sticker please',
        '(Convert image to sticker) Use as a caption of your image !!!'
    ],
    [
        'quotes please',
        '(Get random quotes)'
    ],
    [
        'love meter _{name 1}_ and _{name 2}_',
        '(Calculate your Love compatibility & chances of successful love relationship)'
    ],
    [
        'joke pls',
        '(Get random joke)'
    ],
    [
        'meme pls',
        '(Get random meme)'
    ],
    [
        'create role _{role name}_',
        '(Create role with given name)'
    ],
    [
        'delete role _{role name}_',
        '(Delete role)'
    ],
    [
        'roles',
        '(See all roles in this group chat)'
    ],
    [
        'assign _{mentions}_ to role _{name}_',
        '(Assign all mentioned users to a role)'
    ],
    [
        'remove _{mentions}_ from role _{name}_',
        '(Remove all mentioned users from a role)'
    ],
    [
        'users in role _{name}_',
        '(See all users assigned to the role)'
    ],
    [
        'change prefix _{new-prefix}_',
        '(Change bot prefix, only works inside a group chat)'
    ]
];

export const helpReply: ResolverFunctionCarry =
    () =>
        async (message: proto.IWebMessageInfo, jid: string, isFromGroup: Boolean): Promise<ResolverResult> => {
            let prefix: string;
            if (isFromGroup) {
                const prefixModel = await PrefixModel.findOne({
                    jid,
                }).exec();
                prefix = prefixModel ? prefixModel.prefix : defaultPrefix;
            } else {
                prefix = defaultPrefix;
            }
            let msg = `
Your prefix : /${prefix}

Usage : /${prefix} _:command_

Command List :

`;
            helps.forEach((help, i) => {
                msg += `
${i + 1}. ${help[0]}
    ${help[1]}
`
            })
            //             const msg = `

            // 1. help 
            //     (Show this message)

            // 2. reminders add _:time_ msg _:msg_
            //     (Add reminder)

            // 3. reminders add _:time_ interval _:interval_ repeat msg _:msg_ 
            //     (Add repeated reminder, don't forget to set the interval)

            // 4. reminders list 
            //     (Get active reminders)

            // 5. reminders list with past 
            //     (Get all reminders including past schedule / non active shedule)

            // 6. reminders delete _:id_
            //     (Delete reminder, get the id from list command)

            // 7. reminders delete with past _:id_ 
            //     (Delete reminder including non active / past schedule, get the id from list with past command)

            // 8. sticker please 
            //     (Convert image to sticker) Note : Use as a caption of your image

            // 9. quotes please 
            //     (Get random quotes)

            // 10. love meter _:name_ and _:name_
            //     (Calculate your Love compatibility & chances of successful love relationship)

            // 11. joke pls
            //     (Get random joke)

            // 12. dark joke pls
            //     (Get random dark joke)

            // 13. meme pls
            //     (Get random meme)

            // 14. create role _:name_
            //     (Create role with given name)

            // 15. delete role _:name_
            //     (Delete role)

            // 16. roles
            //     (See all roles in this group chat)

            // 17. assign :mentions... to role _:name_
            //     (Assign all mentioned users to a role)

            // 18. remove :mentions... from role _:name_
            //     (Remove all mentioned users from a role)

            // 19. users in role _:name_
            //     (See all users assigned to the role)

            // 20. change prefix _:your-new-prefix_

            //   `;

            return {
                destinationId: jid,
                message: { text: msg },
                options: {
                    quoted: message,
                },
            };
        };
