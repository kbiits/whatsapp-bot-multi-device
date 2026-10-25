import { proto } from 'baileys';
import logger from '../../logger';
import { ResolverFunctionCarry, ResolverResult } from '../../types/resolver';
import { parseNumbersFromCommand, removeFromBlacklist } from '../../utils/blacklist';
import { isDeveloperSender } from '../../utils/isDeveloper';

export const removeBlacklist: ResolverFunctionCarry =
  (matches: RegExpMatchArray) =>
    async (message: proto.IWebMessageInfo, jid: string, isFromGroup: Boolean, participant: string): Promise<ResolverResult> => {
      if (!isDeveloperSender(isFromGroup ? participant : jid, 'blacklist remove')) {
        return {
          destinationId: jid,
          message: { text: 'Only the bot developer can manage the blacklist' },
          options: { quoted: message },
        };
      }

      const numbers = parseNumbersFromCommand(matches[1], message);
      if (!numbers.length) {
        return {
          destinationId: jid,
          message: { text: 'Please provide valid number(s) with country code (e.g. 6281234567890) or mention the users' },
          options: { quoted: message },
        };
      }

      try {
        const removed = await removeFromBlacklist(numbers);
        const text = removed.length
          ? `Removed from blacklist:\n${removed.map(n => `- ${n}`).join('\n')}`
          : 'None of the given numbers are blacklisted';
        return {
          destinationId: jid,
          message: { text },
          options: { quoted: message },
        };
      } catch (error) {
        logger.error(error, 'Failed to remove numbers from blacklist');
        return {
          destinationId: jid,
          message: { text: 'Failed to update blacklist, please try again later' },
          options: { quoted: message },
        };
      }
    };
