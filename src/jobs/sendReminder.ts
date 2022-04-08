import { isJidGroup } from '@adiwajshing/baileys';
import Agenda, { Job } from 'agenda';
import uniq from 'lodash.uniq';
import { agendaConstDefinition } from '../constants/agenda';
import logger from '../logger';
import sock from '../sock';
import { ReminderScheduleData } from '../types/reminder';
import { getMentionsFromRoles } from '../utils/sendRoleMention';

export default (agenda: Agenda) => {
    agenda.define(agendaConstDefinition.send_reminder, { concurrency: 3, priority: 10 }, async (job: Job) => {
        try {
            const data: ReminderScheduleData = job.attrs.data! as ReminderScheduleData;
            if (!isJidGroup(data.jid)) {
                await sock.sendMessage(data.jid, {
                    text: data.msg,
                    mentions: data.mentionedJids,
                });
                return;
            }

            if (data.msg.indexOf('@everyone') !== -1) {
                // if there's @everyone text in msg
                const participants = (await sock.groupMetadata(data.jid)).participants;
                const participantsJids = participants.map((p) => p.id);

                await sock.sendMessage(data.jid, {
                    text: data.msg,
                    mentions: participantsJids,
                });
                return;
            }

            let matches = data.msg.trim().match(/@[A-Za-z]+.*/g); // role can only start with alphabet
            if (matches && matches.length) {
                const mentionedJids = await getMentionsFromRoles(matches, data.jid);
                (await sock.sendMessage(data.jid, {
                    text: data.msg,
                    mentions: uniq([...mentionedJids, ...data.mentionedJids]),
                }));
                return;
            }

            await sock.sendMessage(data.jid, {
                mentions: data.mentionedJids,
                text: data.msg,
            });
        } catch (err) {
            logger.error('Failed to send reminder job');
            logger.error(err)
            logger.error('error job : ');
            logger.error(JSON.stringify(job.toJSON(), null, 4));
            return;
        }
    });
};
