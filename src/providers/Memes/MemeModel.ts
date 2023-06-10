import { WAMediaUpload } from '@whiskeysockets/baileys';
import MimeType from '../../constants/mimetype';

export default interface MemeModel {
  content: WAMediaUpload;
  caption: string;
  loading: boolean;
  mediaType: 'video' | 'image';
  mimeType?: MimeType;
}
