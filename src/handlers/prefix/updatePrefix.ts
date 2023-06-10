import { MessageType, proto } from "@whiskeysockets/baileys";
import PrefixModel from "../../models/Prefix";
import { ResolverFunction, ResolverFunctionCarry, ResolverResult } from "../../types/resolver";


export const updatePrefix: ResolverFunctionCarry = (matches: RegExpMatchArray): ResolverFunction => async (message: proto.IWebMessageInfo, jid: string, isFromGroup: Boolean): Promise<ResolverResult> => {

    if (!isFromGroup) {
        return {
            destinationId: jid,
            message: { text: 'You can only use this feature inside group chat' },
            options: {
                quoted: message,
            },
        };
    }

    const newPrefix = matches[1].replace(/^ *\//, '');
    if (!newPrefix.length) {
        return {
            destinationId: jid,
            message: { text: "Cannot use empty string for prefix" },
            options: {
                quoted: message,
            }
        };
    }

    try {
        await PrefixModel.updateOne({
            jid,
        }, {
            prefix: newPrefix,
            jid,
        }, { upsert: true }).exec();
        return {
            destinationId: jid,
            message: { text: `Success, the prefix has been changed to _/${newPrefix}_` },
            options: {
                quoted: message,
            }
        }
    } catch (error) {
        console.log('Failed to update prefix');
        console.log("jid : ", jid);
        console.log("newPrefix : ", newPrefix);
        console.log(error);

        return {
            destinationId: jid,
            message: { text: "Failed to update prefix, please try again later" },
            options: {
                quoted: message,
            }
        }
    }
}