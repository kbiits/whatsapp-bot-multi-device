import { proto } from '@whiskeysockets/baileys';
import { default as Role, default as RoleModel } from '../../models/Role';
import { ResolverFunction, ResolverFunctionCarry, ResolverResult } from '../../types/resolver';

export const addRole: ResolverFunctionCarry =
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

      const role = matches[1].replace(/[ @]*/g, '');

      if (!role.match(/^[A-Za-z]+/)) { // role can only start with alphabet
        return {
          destinationId: jid,
          message: { text: 'Role hanya boleh berawalan huruf alphabet' },
          options: {
            quoted: message,
          },
        };
      }

      const roleFound = await RoleModel.findOne({
        name: role,
        groupId: jid,
      }).exec();

      if (roleFound) {
        return {
          destinationId: jid,
          message: { text: 'Failed, Duplicate role name' },
          options: {
            quoted: message,
          },
        };
      }

      const model = new Role({
        name: role,
        groupId: jid,
      });

      try {
        await model.save();
      } catch (error) {
        console.log('Failed to add role, err : ');
        console.log(error);

        return {
          destinationId: jid,
          message: { text: 'Failed to add role' },
          options: {
            quoted: message,
          },
        };
      }

      return {
        destinationId: jid,
        message: { text: 'Role created' },
        options: {
          quoted: message,
        },
      };
    };
