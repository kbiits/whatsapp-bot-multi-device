import { proto } from '@adiwajshing/baileys';
import MimeType from '../constants/mimetype';
import logger from '../logger';
import sock from '../sock';
import { ResolverFunction, ResolverFunctionCarry, ResolverResult } from '../types/resolver';
import { downloadMediaIMessageBuffer } from '../utils/downloadMedia';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';

const allowedMimetype = [MimeType.gif, MimeType.jpeg, MimeType.png, MimeType.mp4];
const isVideo = (mime: MimeType) => mime === MimeType.gif || mime === MimeType.mp4;

export const convertToSticker: ResolverFunctionCarry =
    (): ResolverFunction =>
        async (message: proto.IWebMessageInfo, jid: string): Promise<ResolverResult> => {
            let mediaMessage: proto.IMessage = message.message;

            if (!mediaMessage.imageMessage && !mediaMessage.videoMessage) {
                mediaMessage = mediaMessage?.extendedTextMessage?.contextInfo?.quotedMessage;
                if (!mediaMessage || (!mediaMessage.imageMessage && !mediaMessage.videoMessage))
                    return {
                        destinationId: jid,
                        message: { text: 'Please include the image/video when sending this command' },
                        options: {
                            quoted: message,
                        },
                    };
            }

            let mime: MimeType;
            let sizeInBytes: number | Long.Long
            if (mediaMessage.imageMessage) {
                mime = mediaMessage.imageMessage.mimetype as MimeType;
                sizeInBytes = mediaMessage.imageMessage.fileLength;
            } else {
                mime = mediaMessage.videoMessage.mimetype as MimeType;
                sizeInBytes = mediaMessage.videoMessage.fileLength
            }

            if (sizeInBytes > 1024 * 1024 * 2) {
                return {
                    destinationId: jid,
                    message: { text: `Cannot convert image with size greater than 2MB` },
                    options: {
                        quoted: message,
                    },
                };
            }

            if (!allowedMimetype.includes(mime)) {
                return {
                    destinationId: jid,
                    message: { text: 'Not allowed mimetype' },
                    options: {
                        quoted: message,
                    },
                };
            }

            let buffMedia: Buffer;
            if (isVideo(mime)) {
                if (mediaMessage?.videoMessage?.seconds > 3) {
                    return {
                        destinationId: jid,
                        message: {
                            text: "Can't convert video more than 3 seconds",
                        }
                    }
                }

                buffMedia = await downloadMediaIMessageBuffer(mediaMessage.videoMessage, 'video', 'buffer');
                sock.sendMessage(jid, {
                    text: 'Wait...',
                })
            } else {
                buffMedia = await downloadMediaIMessageBuffer(mediaMessage.imageMessage, 'image', 'buffer')
            }

            try {
                const sticker: Sticker = new Sticker(buffMedia, {
                    author: 'Geeks Bot',
                    categories: ['♥', '❣️', '❣'],
                    pack: 'Geeks Generated Sticker',
                    type: StickerTypes.FULL,
                }, {
                    quality: 100,
                    effort: 6,
                    nearLossless: true,
                });
                await sock.sendMessage(jid, await sticker.toMessage());
            } catch (error) {
                logger.error('error converting to sticker');
                logger.error(error);
                sock.sendMessage(jid, {
                    text: `Sorry, I can't convert your image to sticker`
                }, {
                    quoted: message,
                });
            }
        };
