import Peer, { MediaConnection } from 'peerjs';
import adapter from 'webrtc-adapter';
import { serverIP } from '../constants';

export class RTCconnection {
  streaming = false;
  peer: Peer;
  peerId = '';
  callId = '';
  peers: MediaConnection[] = [];
  isScreenSharing = false;
  myStream: MediaStream;

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

  getMyStream = (video = true, audio = true): Promise<MediaStream> | undefined => {
    const browser = adapter.browserDetails;

    if (!video && !audio) return;
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

  changeStream = (audio: boolean, video: boolean, screenShare?: boolean): Promise<MediaStream> | undefined => {
    const media: Promise<any> = screenShare
      ? // @ts-ignore
        navigator.mediaDevices?.getDisplayMedia()
      : this.getMyStream(audio, video);

    if (!media) return;
    return new Promise((resolve) => {
      media?.then((newStream: MediaStream) => {
        if (screenShare) {
          this.replaceStream(newStream);
          this.myStream = newStream;

          resolve(newStream);
          return;
        }
        Object.values(this.peers).forEach((peer: MediaConnection) => {
          peer.peerConnection?.getSenders().forEach((sender) => {
            if (sender) {
              if (sender.track?.kind === 'audio') {
                sender.track.enabled = audio;
              }
              if (sender.track?.kind === 'video') {
                sender.track.enabled = video;
              }
            }
          });
        });
        resolve(newStream);
      });
    });
  };

  replaceStream = (mediaStream: MediaStream) => {
    Object.values(this.peers).forEach((peer: MediaConnection) => {
      peer.peerConnection?.getSenders().forEach((sender) => {
        if (sender) {
          if (sender.track?.kind === 'audio') {
            if (mediaStream.getAudioTracks().length > 0) {
              sender.replaceTrack(mediaStream.getAudioTracks()[0]);
            }
          }
          if (sender.track?.kind === 'video') {
            if (mediaStream.getVideoTracks().length > 0) {
              sender.replaceTrack(mediaStream.getVideoTracks()[0]);
            }
          }
        }
      });
    });
  };
  // replaceStream = (newStream: MediaStream) => {
  //   console.log('replace stream', this.peers);
  //   Object.values(this.peers).forEach((peer: MediaConnection) => {
  //     console.log(peer.peerConnection?.getSenders());
  //     peer.peerConnection?.getSenders().forEach((sender) => {
  //       console.log(newStream, sender, sender.track?.kind);
  //       if (sender) {
  //         if (sender.track?.kind === 'audio') {
  //           sender.replaceTrack(null);
  //           if (newStream.getAudioTracks().length > 0) {
  //             console.log('REPLACING AUDIO');
  //             sender.replaceTrack(newStream.getAudioTracks()[0]);
  //           }
  //         }
  //         if (sender.track?.kind === 'video') {
  //           console.log('REPLACING VIDEO');
  //           if (newStream.getVideoTracks().length > 0) {
  //             sender.replaceTrack(newStream.getVideoTracks()[0]);
  //           }
  //         }
  //       }
  //     });
  //   });
  // };

  close = () => {
    this.peer?.destroy();
    return true;
  };
}
