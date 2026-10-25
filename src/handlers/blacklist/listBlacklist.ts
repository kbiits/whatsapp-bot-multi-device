import { proto } from 'baileys';
import { ResolverFunctionCarry, ResolverResult } from '../../types/resolver';
import { getBlacklist } from '../../utils/blacklist';
import { isDeveloperSender } from '../../utils/isDeveloper';

export const listBlacklist: ResolverFunctionCarry =
  () =>
    async (message: proto.IWebMessageInfo, jid: string, isFromGroup: Boolean, participant: string): Promise<ResolverResult> => {
      if (!isDeveloperSender(isFromGroup ? participant : jid, 'blacklist list')) {
        return {
          destinationId: jid,
          message: { text: 'Only the bot developer can manage the blacklist' },
          options: { quoted: message },
        };
      }

      const numbers = getBlacklist();
      const text = numbers.length
        ? `Blacklisted numbers (${numbers.length}):\n${numbers.map((n, i) => `${i + 1}. ${n}`).join('\n')}`
        : 'Blacklist is empty';

      return {
        destinationId: jid,
        message: { text },
        options: { quoted: message },
      };
    };
