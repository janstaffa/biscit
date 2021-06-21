import Peer from 'peerjs';
import { serverIP } from '../constants';

interface RTCconnection {
  peer: Peer | undefined;
  streaming: boolean;
  peerId: string;
  callId: string;
  connect: (callId: string) => Peer;
  getMyStream: (video?: boolean, audio?: boolean) => Promise<MediaStream>;
  close: () => boolean;
  // restart: () => ReconnectingWebSocket | undefined;
  // send: (payload: string) => void;
}

export const RTCconnection: RTCconnection = {
  streaming: false,
  peer: undefined,
  peerId: '',
  callId: '',
  connect: (callId) => {
    RTCconnection.callId = callId;
    if (!RTCconnection.peer) {
      RTCconnection.peer = new Peer('', {
        host: serverIP,
        port: 8000,
        path: '/peer',
        secure: false
      });
    }
    RTCconnection.peer.on('open', (id) => {
      RTCconnection.peerId = id;
    });
    RTCconnection.peer.on('error', (err) => {
      console.error(err);
      RTCconnection.peer?.reconnect();
    });
    return RTCconnection.peer;
  },
  getMyStream: (video = true, audio = true) => {
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
  },
  close: () => {
    RTCconnection.peer?.destroy();
    return true;
  }
  // initializePeersEvents = () => {
  //   this.peer.on('open', (id) => {
  //     this.peerId = id;
  //     const callData: CallData = {
  //       userId: id,
  //       callId: this.callId
  //     };
  //     console.log('peers established and joined room', callData);
  //     this.setNavigatorToStream();
  //   });
  //   this.peer.on('error', (err) => {
  //     console.log('peer connection error', err);
  //     this.peer.reconnect();
  //   });
  // };

  // setNavigatorToStream = () => {
  //   this.getVideoAudioStream().then((stream) => {
  //     if (stream) {
  //       this.streaming = true;
  //       // this.createVideo({ id: this.peerId, stream });
  //       // this.setPeersListeners(stream);
  //       // this.newUserConnection(stream);
  //     }
  //   });
  // };
};
