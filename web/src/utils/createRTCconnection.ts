import Peer, { MediaConnection } from 'peerjs';
import adapter from 'webrtc-adapter';
import { isPhone, serverIP } from '../constants';
import { getEmptyStream } from './fakeStream';
import { errorToast } from './toasts';

export class RTCconnection {
  streaming = false;
  peer: Peer;
  peerId = '';
  callId = '';
  peers: MediaConnection[] = [];
  isScreenSharing = false;
  myStream: MediaStream;
  audioDeviceId: string | undefined;
  videoDeviceId: string | undefined;

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

  getMyStream = async (
    video = true,
    audio = true,
    audioDeviceId: string | undefined,
    videoDeviceId: string | undefined
  ): Promise<MediaStream> => {
    const browser = adapter.browserDetails;

    // video = video && !!videoDeviceId;
    // audio = audio && !!audioDeviceId;

    if (!video && !audio) {
      return new Promise((resolve) => {
        resolve(getEmptyStream());
      });
    }

    if (!navigator.mediaDevices) {
      return new Promise((resolve) => {
        resolve(getEmptyStream());
      });
    }
    const nav = navigator.mediaDevices.getUserMedia;
    // // @ts-ignore
    // navigator.webkitGetUserMedia ||
    // // @ts-ignore
    // navigator.mozGetUserMedia ||
    // // @ts-ignore
    // navigator.msGetUserMedia;

    return new Promise((resolve, reject) => {
      nav({
        video: video
          ? {
              noiseSuppression: true,
              width: { min: 640, ideal: 1280, max: 1920 },
              height: { min: 480, ideal: 720, max: 1080 },
              deviceId: { exact: videoDeviceId }
            }
          : false,
        audio: audio ? { deviceId: { exact: audioDeviceId } } : false
      }).then(
        (stream) => {
          resolve(stream);
        },
        (err: Error) => {
          if (err) {
            if (err.message === 'Could not start video source') {
              errorToast(
                "You can't join two calls with the same input hardware on one device. Please, select new input devices in call options."
              );
              this.getMyStream(false, false, undefined, undefined).then(resolve);
              return;
            }
            reject(err);
          }
        }
      );
    });
  };

  changeStream = (
    audio: boolean,
    video: boolean,
    audioDeviceId: string | undefined,
    videoDeviceId: string | undefined,
    screenShare?: boolean
  ): Promise<MediaStream> | undefined => {
    let media: Promise<any> | undefined;

    if (screenShare && !this.isScreenSharing) {
      if (!isPhone) {
        // @ts-ignore
        media = navigator.mediaDevices?.getDisplayMedia?.();
      }
    } else {
      media = this.getMyStream(video, audio, audioDeviceId, videoDeviceId);
    }

    if (!media) return;
    return new Promise((resolve) => {
      media?.then((newStream: MediaStream) => {
        if (screenShare && !this.isScreenSharing) {
          this.replaceStream(newStream);
          this.isScreenSharing = true;

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
    this.myStream = mediaStream;
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

  close = () => {
    this.peer?.destroy();
    return true;
  };
}
