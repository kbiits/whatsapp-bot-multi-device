import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  MessageUpsertType,
  proto,
  useMultiFileAuthState,
  WASocket,
} from "@adiwajshing/baileys";
import { Boom } from "@hapi/boom";
import handle from "./handle";
import logger from "./logger";
import EventEmitter from "events";

export type WAMessageUpsert = {
  messages: proto.IWebMessageInfo[];
  type: MessageUpsertType;
};

const connect = async () => {
  const { state: authState, saveCreds } = await useMultiFileAuthState(
    "./auth_info_baileys"
  );

  const { version } = await fetchLatestBaileysVersion();

  const socketConnection = makeWASocket({
    printQRInTerminal: true,
    auth: authState,
    connectTimeoutMs: 20000,
    logger: logger,
    version,
  });

  socketConnection.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    socketConnectionEv.emit("connection_update", connection);

    if (connection == "close") {
      const shouldReconnect =
        (lastDisconnect.error as Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;
      logger.warn("connection closed due to");
      logger.warn(lastDisconnect.error);
      logger.warn("reconnect ? " + shouldReconnect);
      if (shouldReconnect) {
        (async () => {
          socket = await connect();
        })();
      }
    }
  });
  socketConnection.ev.on("creds.update", saveCreds);
  socketConnection.ev.on("messages.upsert", (msgsUpdate) => {
    msgsUpdate && handle(msgsUpdate);
  });

  // auto reject call
  socketConnection.ev.on("call", (calls) => {
    calls.forEach((call) => {
      socket.rejectCall(call.id, call.from);
    });
  });

  return socketConnection;
};

let socket: WASocket;
let socketConnectionEv: EventEmitter = new EventEmitter();

(async () => {
  socket = await connect();
})();

export { socket, socketConnectionEv };
