import { proto } from 'baileys';
import logger from '../../logger';
import { ResolverFunctionCarry, ResolverResult } from '../../types/resolver';
import { addToBlacklist, parseNumbersFromCommand } from '../../utils/blacklist';
import isDeveloper, { isDeveloperSender } from '../../utils/isDeveloper';

export const addBlacklist: ResolverFunctionCarry =
  (matches: RegExpMatchArray) =>
    async (message: proto.IWebMessageInfo, jid: string, isFromGroup: Boolean, participant: string): Promise<ResolverResult> => {
      const senderJid = isFromGroup ? participant : jid;
      if (!isDeveloperSender(senderJid, 'blacklist add')) {
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
      // developers stay able to run blacklist commands even when blacklisted, see handle.ts
      const developerNote = numbers.some(number => isDeveloper(number))
        ? 'Note: developer numbers can still use the blacklist commands'
        : '';

      try {
        const added = await addToBlacklist(numbers, senderJid);
        const addedText = added.length
          ? `Blacklisted:\n${added.map(n => `- ${n}`).join('\n')}`
          : 'All given numbers are already blacklisted';
        const text = [addedText, developerNote].filter(Boolean).join('\n\n');
        return {
          destinationId: jid,
          message: { text },
          options: { quoted: message },
        };
      } catch (error) {
        logger.error(error, 'Failed to add numbers to blacklist');
        return {
          destinationId: jid,
          message: { text: 'Failed to update blacklist, please try again later' },
          options: { quoted: message },
        };
      }
    };
