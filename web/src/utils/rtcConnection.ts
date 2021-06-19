import { peerServerURL } from '../constants';
import { socket } from './createWSconnection';

interface CallData {
  userId: string;
  callId: string;
}
const initializePeerConnection = async (Peer) => {
  return new Peer('', {
    host: peerServerURL,
    secure: true
  });
};

export default class RTCConnection {
  streaming = false;
  peer;
  peerId = '';
  callId: string;
  constructor(callId: string, Peer) {
    this.callId = callId;
    this.peer = initializePeerConnection(Peer);
    console.log('here', this.peer);
    this.initializePeersEvents();
  }

  initializePeersEvents = () => {
    this.peer.on('open', (id) => {
      this.peerId = id;
      const callData: CallData = {
        userId: id,
        callId: this.callId
      };
      console.log('peers established and joined room', callData);
      this.setNavigatorToStream();
    });
    this.peer.on('error', (err) => {
      console.log('peer connection error', err);
      this.peer.reconnect();
    });
  };

  setNavigatorToStream = () => {
    this.getVideoAudioStream().then((stream) => {
      if (stream) {
        this.streaming = true;
        // this.createVideo({ id: this.peerId, stream });
        // this.setPeersListeners(stream);
        // this.newUserConnection(stream);
      }
    });
  };

  getVideoAudioStream = (video = true, audio = true) => {
    // console.log('================================', window.navigator, navigator);
    // const nav = window.navigator.mediaDevices.getUserMedia;
    // return nav({
    //   video: video
    //     ? {
    //         noiseSuppression: true,
    //         width: { min: 640, ideal: 1280, max: 1920 },
    //         height: { min: 480, ideal: 720, max: 1080 }
    //       }
    //     : false,
    //   audio
    // });
    return new Promise((resolve) => resolve(true));
  };

  createVideo = (videoElement: HTMLVideoElement, videoData: { id: any; stream: MediaStream }) => {
    videoElement.id = videoData.id;
    videoElement.autoplay = true;
    videoElement.controls = false;
    if (this.peerId === videoData.id) videoElement.muted = true;
    return videoElement;
  };

  setPeersListeners = (stream) => {
    this.peer.on('call', (call) => {
      call.answer(stream);
      call.on('stream', (userVideoStream) => {
        console.log('user stream data', userVideoStream);
        // this.createVideo({ id: call.metadata.id, stream: userVideoStream });
      });
      call.on('close', () => {
        console.log('closing peers listeners', call.metadata.id);
        this.removeVideo(call.metadata.id);
      });
      call.on('error', () => {
        console.log('peer error ------');
        this.removeVideo(call.metadata.id);
      });
      //   peers[call.metadata.id] = call;
    });
  };

  newUserConnection = (stream: MediaStream) => {
    socket.ws?.addEventListener('message', (e) => {
      //   console.log('New User Connected', userData);
      //   this.connectToNewUser(userData, stream);
    });
  };

  connectToNewUser(userData: CallData, stream: MediaStream) {
    const { userId } = userData;
    const call = this.peer.call(userId, stream, { metadata: { id: this.peerId } });
    call.on('stream', (userVideoStream) => {
      //   this.createVideo({ id: userId, stream: userVideoStream, userData });
    });
    call.on('close', () => {
      console.log('closing new user', userId);
      this.removeVideo(userId);
    });
    call.on('error', () => {
      console.log('peer error ------');
      this.removeVideo(userId);
    });
    // peers[userId] = call;
  }

  removeVideo = (id) => {
    // delete this.videoContainer[id];
    const video = document.getElementById(id);
    if (video) video.remove();
  };

  destoryConnection = () => {
    // const myMediaTracks = this.videoContainer[this.peerId]?.stream.getTracks();
    // myMediaTracks?.forEach((track: any) => {
    //   track.stop();
    // });
    this.peer.destroy();
  };
}
