import { DownloadableMessage, downloadContentFromMessage, MediaType } from '@whiskeysockets/baileys';
import { Transform } from 'stream';

export async function downloadMediaIMessageBuffer(mContent: DownloadableMessage, contentType: MediaType, type: 'buffer'): Promise<Buffer>;
export async function downloadMediaIMessageBuffer(mContent: DownloadableMessage, contentType: MediaType, type: 'stream'): Promise<Transform>;

export async function downloadMediaIMessageBuffer(mContent: DownloadableMessage, contentType: MediaType, type: 'buffer' | 'stream' = 'buffer') {
    const stream = await downloadContentFromMessage(mContent, contentType);
    if (type === 'buffer') {
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    }
    return stream;
};
