import { proto } from "@adiwajshing/baileys";
import InvalidOptionError from "../exceptions/InvalidOptionError";
import { MemeNotFound } from "../exceptions/MemeNotFound";
import { getRandomMemeProvider } from "../providers/Memes/Meme";
import MemeModel from "../providers/Memes/MemeModel";
import { socket } from "../whatsapp_socket";
import {
  ResolverFunction,
  ResolverFunctionCarry,
  ResolverResult,
} from "../types/resolver";

export const meme: ResolverFunctionCarry =
  (matches: RegExpMatchArray): ResolverFunction =>
  async (
    message: proto.IWebMessageInfo,
    jid: string
  ): Promise<ResolverResult> => {
    try {
      const MemeProvider = getRandomMemeProvider();
      const memeGenerator = matches[1]
        ? MemeProvider.getRandomMeme(matches[1].trim())
        : MemeProvider.getRandomMeme();
      for await (const m of memeGenerator) {
        if (m.loading) {
          await socket.sendMessage(jid, {
            text: "Wait a minute",
          });
        } else {
          const meme: MemeModel = m as MemeModel;
          if (!meme.content) {
            console.log(meme);
            throw new Error("meme content null");
          }

          const result: ResolverResult = {
            destinationId: jid,
          };

          switch (meme.mediaType) {
            case "image":
              result.message = {
                image: meme.content,
                caption: meme.caption,
                mimetype: meme.mimeType,
              };
              break;
            default:
              result.message = {
                video: meme.content,
                caption: meme.caption,
                mimetype: meme.mimeType,
              };
              break;
          }

          return result;
        }
      }
    } catch (error) {
      let obj: any = {
        destinationId: jid,
        type: "extendedTextMessage",
        options: {
          quoted: message,
        },
      };
      if (
        error instanceof InvalidOptionError ||
        error instanceof MemeNotFound
      ) {
        obj.message = error.message;
      } else {
        console.log(error);
        obj.message = "Failed to fetch meme, please try again";
      }
      return obj as ResolverResult;
    }
  };
