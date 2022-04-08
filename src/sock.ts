import makeWASocket, { DisconnectReason, MessageUpdateType, proto, useSingleFileAuthState, WASocket } from "@adiwajshing/baileys";
import { Boom } from "@hapi/boom";
import handle from "./handle";
import logger from "./logger";

export type WAMessageUpsert = {
    messages: proto.IWebMessageInfo[],
    type: MessageUpdateType,
}

const connect = () => {
    const { state: authState, saveState } = useSingleFileAuthState('./auth_info_md.json');

    const socketConnection = makeWASocket({
        printQRInTerminal: true,
        auth: authState,
        connectTimeoutMs: 2000,
        logger: logger,
    })

    socketConnection.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection == 'close') {
            const shouldReconnect = (lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            logger.warn('connection closed due to');
            logger.warn(lastDisconnect.error);
            logger.warn('reconnect ? ' + shouldReconnect)
            if (shouldReconnect) {
                sock = connect();
            }
        }
    })
    socketConnection.ev.on('creds.update', saveState);
    socketConnection.ev.on('messages.upsert', (msgsUpdate) => {
        msgsUpdate && (async () => await handle(msgsUpdate))();
    })

    return socketConnection;
}
let sock: WASocket = connect();

logger.info("executed here");

export default sock;