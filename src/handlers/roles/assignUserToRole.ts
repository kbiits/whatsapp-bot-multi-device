import { proto } from '@whiskeysockets/baileys';
import union from 'lodash.union';
import RoleModel from '../../models/Role';
import { ResolverFunction, ResolverFunctionCarry, ResolverResult } from '../../types/resolver';

export const assignUserToRole: ResolverFunctionCarry =
  (matches: RegExpMatchArray): ResolverFunction =>
    async (message: proto.IWebMessageInfo, jid: string, isFromGroup: Boolean): Promise<ResolverResult> => {
      if (!isFromGroup) {
        return {
          destinationId: jid,
          message: { text: 'You can only use role features inside group chat' },
          options: {
            quoted: message,
          },
        };
      }

      const participants = matches[1].trim();
      const roleName = matches[2].replace(/[ @]*/g, '');
      const role = await RoleModel.findOne({
        name: roleName,
        groupId: jid,
      }).exec();

      if (!role) {
        return {
          destinationId: jid,
          message: { text: 'Role not found' },
          options: {
            quoted: message,
          },
        };
      }

      if (participants.indexOf('@everyone') !== -1) {
        return {
          destinationId: jid,
          message: { text: "You can't use @everyone for this command" },
          options: {
            quoted: message,
          },
        };
      }

      let newJids: Array<string> = [];
      if (participants.indexOf('@me') !== -1) {
        message.participant && newJids.push(message.participant);
      }
      newJids = union(newJids, message.message?.extendedTextMessage?.contextInfo?.mentionedJid ?? [], role.participants);

      if (!newJids.length) {
        return {
          destinationId: jid,
          message: { text: "There's no users can be assigned to the role" },
          options: {
            quoted: message,
          },
        };
      }

      role.participants = newJids;
      await role.save();

      return {
        destinationId: jid,
        message: { text: 'Success' },
        options: {
          quoted: message,
        },
      };
    };
