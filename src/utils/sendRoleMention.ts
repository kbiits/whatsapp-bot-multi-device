import RoleModel, { Role } from '../models/Role';
import { ResolverResult } from '../types/resolver';

export const sendRoleMention = async (roles: Array<string>, jid: string): Promise<ResolverResult> => {
  const mentionedJids = await getMentionsFromRoles(roles, jid);

  if (!mentionedJids || !mentionedJids.length) {
    return null;
  }

  return {
    destinationId: jid,
    message: {
      text: '.',
      mentions: mentionedJids,
    },
  };
};

export const getMentionsFromRoles = async (roles: Array<string>, groupId: string): Promise<Array<string>> => {
  roles = roles.map((role) => role.replace('@', ''));

  const rolesFound = await RoleModel.find({
    groupId,
    name: {
      $in: roles,
    },
  }).exec();

  if (!rolesFound.length) {
    return null;
  }

  let mentionedJids: Array<string> = [];

  rolesFound.forEach((role: Role) => {
    role.participants && (mentionedJids = mentionedJids.concat(role.participants));
  });

  if (!mentionedJids.length) return null;

  return mentionedJids;
};
