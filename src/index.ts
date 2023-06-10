import 'dotenv/config'
import mongoose from 'mongoose';

const DB_URI = process.env.MONGODB_URI || null;
if (!DB_URI) {
    throw Error('DB URI Not Found!');
}

let isDbConnected = false;

(async () => {
    mongoose
        .connect(DB_URI)
        .then(async () => {
            isDbConnected = true;
            console.log("db connected");
               
            // start whatsapp connection
            await require('./sock')    
        })
        .catch((err) => {
            console.log('Failed to connect to db');
            console.log(err);
            throw err;
        });
})().catch((err) => console.log('encountered error : ', err))
