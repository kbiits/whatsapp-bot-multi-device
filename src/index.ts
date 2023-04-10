import "dotenv/config";
import mongoose from "mongoose";
import agenda from "./agendas";
import EventEmitter from "events";
import { WAConnectionState } from "@adiwajshing/baileys";

const DB_URI = process.env.MONGODB_URI || null;
if (!DB_URI) {
  throw Error("DB URI Not Found!");
}

let isDbConnected = false;

(async () => {
  mongoose
    .connect(DB_URI)
    .then(() => {
      isDbConnected = true;
      console.log("db connected");

      // start whatsapp connection
      const {
        socketConnectionEv,
      }: { socketConnectionEv: EventEmitter } = require("./whatsapp_socket");

      let alreadyConnectToAgenda = false;

      socketConnectionEv.on("connection_update", (res: WAConnectionState) => {
        if (res === "open") {
          console.log("Success connect whatsapp socket");
          if (!alreadyConnectToAgenda) {
            console.log("starting agenda worker");
            agenda.start();
          }

          alreadyConnectToAgenda = true;
        } else {
          console.log("Whatsapp Socket connection changed, state : ", res);
        }
      });
    })
    .catch((err) => {
      console.log("Failed to connect to db");
      console.log(err);
      throw err;
    });
})().catch((err) => console.log("encountered error : ", err));
