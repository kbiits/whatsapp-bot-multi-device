import { MessageType, proto } from 'baileys';
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

const buildHelpMessage = (prefix: string): string => {
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
    });

    return msg;
};


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

            let msg = buildHelpMessage(prefix);

            return {
                destinationId: jid,
                message: { text: msg },
                options: {
                    quoted: message,
                },
            };
        };
