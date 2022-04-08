import RoleModel from '../../models/Role';
import { ResolverFunction, ResolverFunctionCarry, ResolverResult } from '../../types/resolver';

export const getUsersForRole: ResolverFunctionCarry =
  (matches: RegExpMatchArray): ResolverFunction =>
    async (message, jid, isFromGroup: Boolean): Promise<ResolverResult> => {
      const result: ResolverResult = {
        destinationId: jid,
        message: {
          text: '',
        },
        options: {
          quoted: message,
        },
      }
      if (!isFromGroup) {
        result.message = {
          text: 'You can only use role features inside group chat'
        };
        return result;
      }

      const roleName = matches[1].replace(/[ @]*/g, '');
      const role = await RoleModel.findOne({
        name: roleName,
        groupId: jid,
      }).exec();

      if (!role) {
        result.message = {
          text: 'Role not found'
        };
        return result;
      }

      if (!role.participants?.length) {
        result.message = {
          text: "There's no users for this role"
        };
        return result;
      }

      let msg = '';

      role.participants?.forEach((jid) => {
        msg += `@${jid.replace(/(?:-.+)?@.+/, '')} `;
      });

      result.message = {
        text: msg,
        mentions: role.participants.map((p) => p.replace(/-.+/, '@s.whatsapp.net')),
      }
      return result;
    };
