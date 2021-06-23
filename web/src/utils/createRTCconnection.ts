import Peer from 'peerjs';
import { serverIP } from '../constants';

// interface RTCconnection {
//   peer: Peer | undefined;
//   streaming: boolean;
//   peerId: string;
//   callId: string;
//   connect: (callId: string) => Peer;
//   getMyStream: (video?: boolean, audio?: boolean) => Promise<MediaStream>;
//   close: () => boolean;
//   // restart: () => ReconnectingWebSocket | undefined;
//   // send: (payload: string) => void;
// }

export class RTCconnection {
  streaming = false;
  peer;
  peerId = '';
  callId = '';

  constructor(callId) {
    this.callId = callId;
    if (!this.peer) {
      this.peer = new Peer('', {
        host: serverIP,
        port: 8000,
        path: '/peer',
        secure: false
      });
    }
    this.peer.on('open', (id) => {
      this.peerId = id;
    });
    this.peer.on('error', (err) => {
      console.error(err);
      this.peer?.reconnect();
    });
  }

  getMyStream = (video = true, audio = true): Promise<MediaStream> => {
    const nav =
      navigator.getUserMedia ||
      // @ts-ignore
      navigator.webkitGetUserMedia ||
      // @ts-ignore
      navigator.mozGetUserMedia ||
      // @ts-ignore
      navigator.msGetUserMedia;

    return new Promise((resolve, reject) => {
      nav(
        {
          video: video
            ? {
                noiseSuppression: true,
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 480, ideal: 720, max: 1080 }
              }
            : false,
          audio
        },
        (stream) => {
          resolve(stream);
        },
        (err) => {
          if (err) {
            console.error(err);
            reject(err);
          }
        }
      );
    });
  };

  close = () => {
    this.peer?.destroy();
    return true;
  };
}
