import RoleModel, { Role } from '../../models/Role';
import { ResolverFunction, ResolverFunctionCarry, ResolverResult } from '../../types/resolver';

export const listRole: ResolverFunctionCarry =
  (): ResolverFunction =>
    async (_, jid, isFromGroup: Boolean): Promise<ResolverResult> => {
      const result: ResolverResult = {
        destinationId: jid,
        options: {
          quoted: _,
        }
      }
      if (!isFromGroup) {
        result.message = {
          text: 'You can only use role features inside group chat',
        }
        return result;
      }

      let roles: Array<Role> = await RoleModel.find({ groupId: jid }).exec();

      if (!roles.length) {
        result.message = {
          text: "There's no roles for this group chat",
        }
        return result;
      }

      let msg: string = '';
      roles.forEach((role: Role, i) => {
        msg += `${i + 1}. ${role.name}\n`;
      });

      result.message = {
        text: msg,
      }
      return result;
    };
