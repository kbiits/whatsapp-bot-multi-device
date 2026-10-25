import mongoose from 'mongoose';

export interface Blacklist {
  number: string;
  lid?: string; // LID digits resolved when added, since WhatsApp may send messages as <lid>@lid
  addedBy?: string;
  createdAt?: Date;
}

const BlacklistSchema = new mongoose.Schema<Blacklist>({
  number: { type: String, required: true, unique: true },
  lid: { type: String, index: true },
  addedBy: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const BlacklistModel = mongoose.model('Blacklist', BlacklistSchema);

export default BlacklistModel;
