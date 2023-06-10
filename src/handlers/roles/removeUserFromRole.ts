import { proto } from '@whiskeysockets/baileys';
import diff from 'lodash.difference';
import union from 'lodash.union';
import RoleModel from '../../models/Role';
import { ResolverFunction, ResolverFunctionCarry, ResolverResult } from '../../types/resolver';

export const removeUserFromRole: ResolverFunctionCarry =
  (matches: RegExpMatchArray): ResolverFunction =>
    async (message: proto.IWebMessageInfo, jid: string): Promise<ResolverResult> => {
      const users = matches[1].trim();
      const roleName = matches[2].replace(/[ @]*/g, '');

      const role = await RoleModel.findOne({
        name: roleName,
        groupId: jid,
      }).exec();

      const result: ResolverResult = {
        destinationId: jid,
        options: {
          quoted: message,
        }
      }

      if (!role) {
        result.message = { text: 'Role not found' };
        return result;
      }

      if (users.indexOf('@everyone') !== -1) {
        role.participants = [];
        await role.save();
        result.message = { text: 'Success' };
        return result;
      }

      let removedJids: Array<string> = [];
      if (users.indexOf('@me') !== -1) {
        message.participant && removedJids.push(message.participant);
      }

      removedJids = union(removedJids, message.message?.extendedTextMessage?.contextInfo?.mentionedJid ?? []);
      if (!removedJids.length) {
        result.message = { text: "There's no user to remove" };
        return result;
      }

      role.participants = diff(role.participants ?? [], removedJids);
      await role.save();

      result.message = { text: 'Success' };
      return result;
    };
