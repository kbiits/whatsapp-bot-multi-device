import { Boom } from "@hapi/boom";
import makeWASocket, { DisconnectReason, fetchLatestBaileysVersion, useMultiFileAuthState, WASocket } from 'baileys';
import QRCode from 'qrcode';
import handle from "./handle";
import logger from "./logger";

class Socket {

    private _sock: WASocket;

    async connect(): Promise<WASocket> {
        const { state: authState, saveCreds } = await useMultiFileAuthState('./auth');
        this._sock = makeWASocket({
            auth: authState,
            connectTimeoutMs: 2000,
            logger: logger,
            version: (await fetchLatestBaileysVersion()).version,
            shouldIgnoreJid: () => false,
        })

        this._sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (connection == 'close') {
                if (connection === 'close' && (lastDisconnect?.error as Boom)?.output?.statusCode === DisconnectReason.restartRequired) {
                    // create a new socket, this socket is now useless
                    logger.info('connection closed due to restart required, reconnecting...');
                    this._sock = null;
                    this.connect();
                    return;
                }

                const shouldReconnect = (lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                logger.warn('connection closed due to');
                logger.warn(lastDisconnect.error);
                logger.warn('reconnect ? ' + shouldReconnect)
                if (shouldReconnect) {
                    this.connect().then((newSocket) => {
                        this._sock = newSocket;
                    });
                }
                return
            } else if (connection === 'open') {
                logger.info('connection opened');
                return;
            }

            if (qr) {
                console.log('New QR Code received, scan it to connect');
                console.log(await QRCode.toString(qr, { type: 'terminal', scale: 1, small: true }));
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