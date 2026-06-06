import mongoose from 'mongoose';

export interface GcalConfig {
  jid: string;
  clientEmail: string;
  privateKey: string;
  calendarId: string;
}

const GcalConfigSchema = new mongoose.Schema<GcalConfig>({
  jid: { type: String, required: true, unique: true },
  clientEmail: { type: String, required: true },
  privateKey: { type: String, required: true },
  calendarId: { type: String, required: true },
});

const GcalConfigModel = mongoose.model('GcalConfig', GcalConfigSchema);

export default GcalConfigModel;
