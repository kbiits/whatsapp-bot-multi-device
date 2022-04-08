import { proto } from '@adiwajshing/baileys';
import sharp from 'sharp';
import MimeType from '../constants/mimetype';
import sock from '../sock';
import { ResolverFunction, ResolverFunctionCarry, ResolverResult } from '../types/resolver';
import { downloadMediaIMessageBuffer } from '../utils/downloadMedia';

const allowedMimetype = [MimeType.gif, MimeType.jpeg, MimeType.png];

export const convertToSticker: ResolverFunctionCarry =
    (): ResolverFunction =>
        async (message: proto.IWebMessageInfo, jid: string): Promise<ResolverResult> => {
            let tempMessage: proto.IMessage = message.message;

            if (!tempMessage.imageMessage) {
                tempMessage = tempMessage?.extendedTextMessage?.contextInfo?.quotedMessage ?? null;
                if (!tempMessage || (!tempMessage.imageMessage ?? true))
                    return {
                        destinationId: jid,
                        message: { text: 'Please include an image when sending the command' },
                        options: {
                            quoted: message,
                        },
                    };
            } else {

            }

            if (tempMessage.imageMessage.fileLength > 1000 * 1000 * 4) {
                return {
                    destinationId: jid,
                    message: { text: `Cannot convert image with size greater than 4_000_000 bytes` },
                    options: {
                        quoted: message,
                    },
                };
            }

            let mimeType: MimeType = tempMessage.imageMessage.mimetype as MimeType;

            if (!mimeType) mimeType = message.message.imageMessage.mimetype as MimeType;
            if (!allowedMimetype.includes(mimeType)) {
                return {
                    destinationId: jid,
                    message: { text: 'Not allowed mimetype' },
                    options: {
                        quoted: message,
                    },
                };
            }

            const ratio = tempMessage.imageMessage.width / tempMessage.imageMessage.height;

            const imageMessage: Buffer = (await downloadMediaIMessageBuffer(tempMessage.imageMessage, 'image', 'buffer')) as Buffer;

            await sock.sendMessage(jid, {
                text: 'Wait a minute',
            });
            try {
                const bufferWebp = await sharp(imageMessage, {
                    failOnError: true,
                })
                    .resize(512, 512, {
                        fit: Math.abs(ratio - 1) > 0.1 ? 'contain' : 'cover',
                        background: {
                            r: 0,
                            b: 0,
                            g: 0,
                            alpha: 0,
                        },
                    })
                    .webp()
                    .toBuffer();
                sock.sendMessage(jid, {
                    sticker: bufferWebp,
                });
            } catch (error) {
                console.log('error webp');
                console.log(error);

                sock.sendMessage(jid, {
                    text: `Sorry, I can't convert your image to sticker`
                }, {
                    quoted: message,
                });
            }
        };
