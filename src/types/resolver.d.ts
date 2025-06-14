import { AnyMessageContent, MessageOptions, MessageType, MiscMessageGenerationOptions, proto, WALocationMessage, WAMediaUpload } from 'baileys';

export type ResolverFunction = (message: proto.IWebMessageInfo, jid: string, isFromGroup: Boolean) => Promise<ResolverResult> | ResolverResult;
export type ResolverFunctionCarry = (matches: RegExpMatchArray) => ResolverFunction;

export interface ResolverResult {
    destinationId: string;
    message?: AnyMessageContent,
    options?: MiscMessageGenerationOptions,
}