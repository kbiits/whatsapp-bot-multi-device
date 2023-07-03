import { Boom } from "@hapi/boom";
import makeWASocket, { AuthenticationState, DisconnectReason, useMultiFileAuthState, WASocket } from "@whiskeysockets/baileys";
import handle from "./handle";
import logger from "./logger";

class Socket {

    private _sock: WASocket;

    async connect(): Promise<WASocket> {
        const { state: authState, saveCreds } = await useMultiFileAuthState('./auth');
        this._sock = makeWASocket({
            printQRInTerminal: true,
            auth: authState,
            connectTimeoutMs: 2000,
            logger: logger,
            version: [2, 2323, 4],
            shouldIgnoreJid: () => false,
        })

        this._sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection == 'close') {
                const shouldReconnect = (lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                logger.warn('connection closed due to');
                logger.warn(lastDisconnect.error);
                logger.warn('reconnect ? ' + shouldReconnect)
                if (shouldReconnect) {
                    this.connect().then((newSocket) => {
                        this._sock = newSocket;
                    });
                }
            }
        })

        this._sock.ev.on('creds.update', saveCreds);
        this._sock.ev.on('messages.upsert', (msgsUpdate) => {
            msgsUpdate && (async () => await handle(msgsUpdate, this._sock))();
        })

        return this._sock;
    }

    get socket() {
        return this._sock;
    }
}

export default new Socket();