import { DownloadableMessage, downloadContentFromMessage, MediaType } from '@adiwajshing/baileys';

export const downloadMediaIMessageBuffer = async (mContent: DownloadableMessage, contentType: MediaType, type: 'buffer' | 'stream' = 'buffer') => {
    const dowloadMediaMessage = async () => {
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
    const buff = await dowloadMediaMessage();
    return buff;
};
