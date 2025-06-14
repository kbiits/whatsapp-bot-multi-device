import { proto } from 'baileys';
import RoleModel from '../../models/Role';
import { ResolverFunction, ResolverFunctionCarry, ResolverResult } from '../../types/resolver';

export const deleteRole: ResolverFunctionCarry =
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

      const roleName = matches[1].replace(/[ @]*/g, '');
      const result = await RoleModel.deleteOne({
        name: roleName,
        groupId: jid,
      }).exec();

      if (result.deletedCount <= 0) {
        return {
          destinationId: jid,
          message: { text: 'Failed to delete role, role not found' },
          options: {
            quoted: message,
          },
        };
      }

      return {
        destinationId: jid,
        message: { text: 'Role deleted' },
        options: {
          quoted: message,
        },
      };
    };
