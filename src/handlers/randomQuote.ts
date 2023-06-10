import { proto } from '@whiskeysockets/baileys';
import { getRandomQuoteProvider } from '../providers/Quote';
import { ResolverFunction, ResolverFunctionCarry, ResolverResult } from '../types/resolver';

export const randomQuote: ResolverFunctionCarry =
  (): ResolverFunction =>
    async (message: proto.IWebMessageInfo, jid: string): Promise<ResolverResult> => {
      const QuoteProvider = getRandomQuoteProvider();

      const msg = await QuoteProvider.getRandomQuote();

      return {
        destinationId: jid,
        message: {
          text: msg,
        },
        options: {
          quoted: message,
        }
      };
    };
