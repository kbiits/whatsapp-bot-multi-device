import { proto } from '@adiwajshing/baileys';
import { ResolverFunction, ResolverResult } from '../types/resolver';

export const wrongCommands: ResolverFunction = (message: proto.IWebMessageInfo, jid: string): ResolverResult => {
  const msg = `Huh? what was that ?`;
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
