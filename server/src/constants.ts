export const __prod__ = process.env.NODE_ENV === 'production';
export const COOKIE_NAME = 'uid';
export const EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
export const SALT_ROUNDS = 10;
export const browserOrigin = __prod__ ? '' : 'http://localhost:3000';
export const fallbackTokenSecret = 'ADHDhdhdsiaoDOdhdnhasadnbN';
export const tokenExpiration = '7d';

export const validProfilePictureUploadRegExp = /jpeg|png|webp|avif|tiff|svg/;

export const peerIdEndpoint = 'http://localhost:8000/peer/peerjs/id';
export const maxPeoplePerThread = 20;
