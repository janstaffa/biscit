import { isServer } from './utils/isServer';

export const __prod__ = process.env.NODE_ENV === 'production';
export const serverURL = 'http://localhost:9000';
export const gqlEndpoint = __prod__ ? '' : serverURL + '/graphql';
export const currentUrl = () => (isServer() ? null : window.location);
export const genericErrorMessage = 'Something went wrong, please try again later.';
export const webSocketURL = 'ws://localhost:9000/socket';
export const attachmentUploadURL = serverURL + '/upload/attachment';
export const profilepUploadURL = serverURL + '/upload/profilep';

export const fileApiURL = serverURL + '/files';
export const profilepApiURL = serverURL + '/files/profilep';

export const imageRegExp = /png|jpe?g|gif|bmp/;
export const documentRegExp = /docx?|odt|pages|html?|txt/;
export const sheetRegExp = /xlsx|xlsm|xlsb|xltx|xls|xlt|ods/;
export const pdfRegExp = /pdf/;
export const videoRegExp = /mkv|flv|ogv|ogg|avi|mov|mp4|wmv|m4v|3gp|3g2|flv|webm/;
export const audioRegExp = /wav|mp3|aac|flac|alac/;

export const urlRegExp = /(https?:\/\/[^\s]+)/g;
