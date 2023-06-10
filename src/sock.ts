import { Boom } from "@hapi/boom";
import makeWASocket, { AuthenticationState, DisconnectReason, useMultiFileAuthState, WASocket } from "@whiskeysockets/baileys";
import handle from "./handle";
import logger from "./logger";

const connect = (auth: { state: AuthenticationState, saveCreds: () => Promise<void> }) => {
    const { state: authState } = auth;
    const socketConnection = makeWASocket({
        printQRInTerminal: true,
        auth: authState,
        connectTimeoutMs: 2000,
        logger: logger,
        version: [2, 2323, 4],
        shouldIgnoreJid: () => false,
    })

    return socketConnection;
}

let sock: WASocket;
(async () => {
    const auth = await useMultiFileAuthState('./auth');
    sock = connect(auth);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection == 'close') {
            const shouldReconnect = (lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            logger.warn('connection closed due to');
            logger.warn(lastDisconnect.error);
            logger.warn('reconnect ? ' + shouldReconnect)
            if (shouldReconnect) {
                sock = connect(auth);
            }
        }
    })
    // sock.ws.on('CB:message', (d: any) => {
    //     console.log("ini data nya ya")
    //     console.log(d)
    // })

    sock.ev.on('creds.update', auth.saveCreds);
    sock.ev.on('messages.upsert', (msgsUpdate) => {
        console.log("ini dia sih asnaoidsnuoasidn\n\n\n");

        logger.info("ini dia msg update", msgsUpdate)
        msgsUpdate && (async () => await handle(msgsUpdate, sock))();
    })
})()

export default sock;