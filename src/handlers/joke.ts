import { proto } from '@whiskeysockets/baileys';
import InvalidOptionError from '../exceptions/InvalidOptionError';
import logger from '../logger';
import { getRandomJokeProvider } from '../providers/Jokes/Joke';
import { JokeModel } from '../providers/Jokes/JokeModel';
import sock from '../sock';
import { ResolverFunction, ResolverFunctionCarry, ResolverResult } from '../types/resolver';

export const joke: ResolverFunctionCarry =
    (matches: RegExpMatchArray): ResolverFunction =>
        async (message: proto.IWebMessageInfo, jid: string): Promise<ResolverResult> => {
            let isDark = false;
            if (matches.length && matches[1]) {
                isDark = true;
            }

            const JokeProvider = getRandomJokeProvider();
            const result: ResolverResult = {
                destinationId: jid,
                options: {
                    quoted: message,
                }
            }
            let joke: JokeModel;
            try {
                const jokeGenerator = matches[2] ? JokeProvider.getRandomJoke(matches[2].trim()) : JokeProvider.getRandomJoke();
                for await (const j of jokeGenerator) {
                    if (j.loading) {
                        await sock.sendMessage(jid, {
                            text: 'Wait a minute',
                        });
                    } else {
                        joke = j as JokeModel;
                        break;
                    }
                }
            } catch (error) {
                if (error instanceof InvalidOptionError) {
                    result.message = { text: error.message };
                    return result;
                }
                logger.error(error);
                result.message = { text: 'Failed to fetch joke, please try again' };
                return result;
            }

            if (joke.mediaType === 'text' || !joke.media) {
                result.message = { text: joke.text };
                return result;
            }

            switch (joke.mediaType) {
                case 'image':
                    result.message = {
                        image: joke.media,
                        caption: joke.text,
                        mimetype: joke.mimeType,
                    }
                    break;
                default: // video
                    result.message = {
                        video: joke.media,
                        caption: joke.text,
                        mimetype: joke.mimeType,
                    }
                    break;
            }
            return result;
        };
