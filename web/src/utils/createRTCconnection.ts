import Peer, { MediaConnection } from 'peerjs';
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
  peer: Peer;
  peerId = '';
  callId = '';
  peers: MediaConnection[] = [];

  constructor(callId) {
    this.callId = callId;
    // if (!this.peer) {
    this.peer = new Peer('', {
      host: serverIP,
      port: 8000,
      path: '/peer',
      secure: false
    });

    // }
    this.peer.on('open', (id) => {
      this.peerId = id;
    });
    // this.peer.on('error', (err) => {
    //   console.error(err);
    //   this.peer?.reconnect();
    // });
  }

  getMyStream = (video = true, audio = true): Promise<MediaStream> => {
    console.log('getMyStream', video, audio);
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
          audio: audio
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

  changeStream = (audio: boolean, video: boolean) => {
    this.getMyStream(true, true).then((newStream) => {
      console.log(this.peers);
      Object.values(this.peers).forEach((peer: MediaConnection) => {
        peer.peerConnection?.getSenders().forEach((sender) => {
          if (sender) {
            if (sender.track?.kind === 'audio') {
              console.log('HERE:', sender.track.enabled, audio);
              sender.track.enabled = audio;
            }
            if (sender.track?.kind === 'video') {
              sender.track.enabled = video;
            }
          }
        });
      });
    });
  };

  replaceStream = (newStream: MediaStream) => {
    console.log('replace stream', this.peers);
    Object.values(this.peers).forEach((peer: MediaConnection) => {
      console.log(peer.peerConnection?.getSenders());
      peer.peerConnection?.getSenders().forEach((sender) => {
        console.log(newStream, sender, sender.track?.kind);
        if (sender) {
          if (sender.track?.kind === 'audio') {
            sender.replaceTrack(null);
            if (newStream.getAudioTracks().length > 0) {
              console.log('REPLACING AUDIO');
              sender.replaceTrack(newStream.getAudioTracks()[0]);
            }
          }
          if (sender.track?.kind === 'video') {
            console.log('REPLACING VIDEO');
            if (newStream.getVideoTracks().length > 0) {
              sender.replaceTrack(newStream.getVideoTracks()[0]);
            }
          }
        }
      });
    });
  };

  close = () => {
    this.peer?.destroy();
    return true;
  };
}
