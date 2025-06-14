import { AnyMessageContent, MessageOptions, MessageType, MiscMessageGenerationOptions, proto, WALocationMessage, WAMediaUpload } from 'baileys';

export type ResolverFunction = {
    (message: proto.IWebMessageInfo, jid: string, isFromGroup: Boolean): Promise<ResolverResult> | ResolverResult;
    (message: proto.IWebMessageInfo, jid: string, isFromGroup: Boolean, participant: string): Promise<ResolverResult> | ResolverResult;
}

export type ResolverFunctionCarry = (matches: RegExpMatchArray) => ResolverFunction[0];

export interface ResolverResult {
    destinationId: string;
    message?: AnyMessageContent,
    options?: MiscMessageGenerationOptions,
}