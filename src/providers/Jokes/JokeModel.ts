import { WAMediaUpload } from '@adiwajshing/baileys';
import MimeType from '../../constants/mimetype';

export interface JokeModel {
  media?: WAMediaUpload;
  text: string;
  mediaType?: 'video' | 'image' | 'text';
  loading: boolean;
  mimeType?: MimeType;
}
