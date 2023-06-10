import { proto } from '@whiskeysockets/baileys';
import axios from 'axios';
import { ResolverFunction, ResolverResult } from '../types/resolver';
const host = process.env.LOVE_CALCULATOR_RAPID_API_HOST;
const apiKey = process.env.LOVE_CALCULATOR_RAPID_API_KEY;

export const loveMeter =
  (matches: RegExpMatchArray): ResolverFunction =>
    async (message: proto.IWebMessageInfo, jid: string): Promise<ResolverResult> => {

      const { data } = await axios.get('https://love-calculator.p.rapidapi.com/getPercentage', {
        params: {
          fname: matches[1],
          sname: matches[2],
        },
        headers: {
          'x-rapidapi-host': host,
          'x-rapidapi-key': apiKey,
        },
      });

      return {
        destinationId: jid,
        message: {
          text: `Match ${data.percentage}%\n\nMy advice : ${data.result}`,
        },
        options: {
          quoted: message,
        }
      };
    };
