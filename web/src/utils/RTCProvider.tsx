import React, { ReactNode, useEffect, useRef, useState } from 'react';
import {
  ThreadSnippetFragment,
  useCancelCallMutation,
  useCreateCallMutation,
  useJoinCallMutation,
  useMeQuery,
  UserSnippetFragment
} from '../generated/graphql';
import {
  IncomingCreateCallMessage,
  IncomingJoinCallMessage,
  IncomingPeerChangeMessage,
  OutgoingJoinCallMessage,
  OutgoingPeerChangeMessage
} from '../types';
import { RTCconnection } from './createRTCconnection';
import { socket } from './createWSconnection';
import { errorToast } from './toasts';

export interface RTCwrapProps {
  children: ReactNode;
}

interface StreamType {
  peerId: string;
  username?: string;
  stream: MediaStream;
  mic: boolean;
  camera: boolean;
  screenShare: boolean;
  isMe: boolean;
  volume: number;
}
interface CallDetails {
  callId: string;
  threadId: string;
  callMembers: [];
  streams: StreamType[];
}

interface RingingDetails {
  callId: string;
  user: UserSnippetFragment;
  thread: ThreadSnippetFragment;
}
interface RTCcontextType {
  isInCall: boolean;
  callDetails: CallDetails | undefined;
  isRinging: boolean;
  ringingDetails: RingingDetails | undefined;
  joinCall: () => void;
}
interface PeerOptions {
  mic: boolean;
  camera: boolean;
  screenShare: boolean;
  isDeafened: boolean;
  volume: number;
  videoDevice: MediaDeviceInfo | undefined;
  audioDevice: MediaDeviceInfo | undefined;
}

const defaultVolume = 100;

export const RTCcontext = React.createContext<RTCcontextType | null>(null);
const RTCProvider: React.FC<RTCwrapProps> = ({ children }) => {
  // STATES
  const [isInCall, setIsInCall] = useState<boolean>(false);
  const [callDetails, setCallDetails] = useState<CallDetails | undefined>();
  const callDetailsRef = useRef<CallDetails | undefined>(callDetails);
  callDetailsRef.current = callDetails;

  const [ringingDetails, setRingingDetails] = useState<RingingDetails | undefined>();
  const ringingDetailsRef = useRef<RingingDetails | undefined>(ringingDetails);
  ringingDetailsRef.current = ringingDetails;

  const [volume, setVolume] = useState<number>(defaultVolume);

  const [options, setOptions] = useState<PeerOptions>({
    mic: true,
    camera: true,
    screenShare: false,
    isDeafened: false,
    volume: defaultVolume,
    videoDevice: undefined,
    audioDevice: undefined
  });
  const optionsRef = useRef<PeerOptions>(options);
  optionsRef.current = options;

  const rtcRef = useRef<RTCconnection>();

  const [isRinging, setIsRinging] = useState<boolean>(false);

  const ringtone = useRef<HTMLAudioElement>();

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  // QUERIES / MUTATIONS
  const { data: meData, isLoading } = useMeQuery();
  const { mutate: joinCallMutation } = useJoinCallMutation({
    onSuccess: (d) => {
      if (!d.JoinCall.data && d.JoinCall.errors.length > 0) {
        d.JoinCall.errors.forEach((err) => {
          errorToast(err.details?.message);
        });
      }
    }
  });
  const { mutate: cancelCallMutation } = useCancelCallMutation();
  const { mutate: createCallMutation } = useCreateCallMutation();

  // EFFECTS
  useEffect(() => {
    if (!isRinging) {
      setRingingDetails(undefined);
      if (!ringtone.current) return;
      ringtone.current.pause();
      ringtone.current.currentTime = 0;
      return;
    }
    const callingUser = ringingDetailsRef.current?.user;
    if (!ringtone.current || !callingUser) return;
    if (isRinging) {
      if (callingUser.id !== meData?.me?.id) {
        ringtone.current.play().catch((e) => console.error(e));
      }
    }
  }, [isRinging]);

  useEffect(() => {
    ringtone.current = new Audio('/ringtone.mp3');
    ringtone.current.loop = true;

    navigator.mediaDevices.enumerateDevices().then((d) => {
      const bestVideoDevice = d.find((device) => device.kind === 'videoinput');
      const bestAudioDevice = d.find((device) => device.kind === 'audioinput');

      setOptions({ ...optionsRef.current, videoDevice: bestVideoDevice, audioDevice: bestAudioDevice });
      setDevices(d);
    });

    const ws = socket.connect();
    const handleMessage = (e) => {
      const { data: m } = e;
      const incoming = JSON.parse(m);

      if (incoming.code === 3010) {
        if (isInCall) return;
        const { user, thread, callId: cId } = incoming as IncomingCreateCallMessage;
        setIsRinging(true);
        setRingingDetails({ ...ringingDetailsRef.current, user, thread, callId: cId });
      } else if (incoming.code === 3014) {
        setIsInCall(true);
        setIsRinging(false);
      }
    };
    ws?.addEventListener('message', handleMessage);
  }, []);

  const createStream = (
    peerId: string,
    stream: MediaStream,
    camera: boolean,
    mic: boolean,
    screenShare: boolean,
    isMe: boolean,
    username?: string
  ) => {
    if (!callDetailsRef.current) return;
    const prevStreams = [...callDetailsRef.current.streams];
    const alreadyExists = callDetailsRef.current.streams.find((s) => s.peerId === peerId);
    if (alreadyExists) {
      prevStreams.splice(prevStreams.indexOf(alreadyExists), 1);
    }
    const newStream: StreamType = {
      peerId,
      stream,
      camera,
      screenShare,
      mic,
      username,
      isMe,
      volume
    };

    setCallDetails({ ...callDetailsRef.current, streams: [...prevStreams, newStream] });
  };
  const removeStream = (peerId: string) => {
    if (!callDetailsRef.current) return;
    const prevStreams = [...callDetailsRef.current.streams];
    const thisStream = prevStreams.find((s) => s.peerId === peerId);
    if (!thisStream) return;
    prevStreams.splice(prevStreams.indexOf(thisStream), 1);
    const newStreams = prevStreams;

    setCallDetails({ ...callDetailsRef.current, streams: newStreams });
  };

  useEffect(() => {
    if (!callDetailsRef.current) return;

    if (!isInCall) {
      setCallDetails(undefined);
      return;
    }
    const { callId } = callDetailsRef.current;

    const ws = socket.connect();

    const rtc = new RTCconnection(callId);
    rtcRef.current = rtc;

    const { mic, camera } = options;

    const onOpen = (id) => {
      rtc.getMyStream(camera, mic, undefined, undefined)?.then((stream) => {
        if (stream) {
          rtc.streaming = true;
          rtc.myStream = stream;
          createStream(id, stream, camera, true, false, true, meData?.me?.username);
        }

        rtc.peer.on('call', (call) => {
          call.answer(stream);
          call.on('stream', (userVideoStream) => {
            createStream(call.metadata.id, userVideoStream, true, true, false, false, call.metadata.username);
          });
          call.on('close', () => {
            removeStream(call.metadata.id);
          });
          call.on('error', () => {
            removeStream(call.metadata.id);
          });

          rtc.peers.push(call);
        });

        const handleMessage = (e) => {
          if (!callDetailsRef.current) return;
          const { data: m } = e;
          const incoming = JSON.parse(m);

          if (incoming.code === 3012) {
            const { user, peerId } = incoming as IncomingJoinCallMessage;
            const call = rtc.peer.call(peerId, stream, {
              metadata: { id: rtc.peer.id, username: meData?.me?.username }
            });

            call?.on('stream', (userVideoStream) => {
              const hasAudio = userVideoStream.getAudioTracks().find((track) => track.enabled);
              const hasVideo = userVideoStream.getVideoTracks().find((track) => track.enabled);

              createStream(peerId, userVideoStream, !!hasAudio, !!hasVideo, false, false, user.username);
            });
            call?.on('close', () => {
              removeStream(peerId);
            });
            call?.on('error', () => {
              removeStream(peerId);
            });

            rtc.peers.push(call);
          } else if (incoming.code === 3013) {
            setIsInCall(false);
            rtc.close();
          } else if (incoming.code === 3015) {
            const { peerId, userId, camera: cam, audio, screenShare } = incoming as IncomingPeerChangeMessage;
            const oldStreams = [...callDetailsRef.current.streams];
            let thisStream = oldStreams.find((video) => video.peerId === peerId);
            if (!thisStream) return;
            thisStream = {
              ...thisStream,
              camera: cam,
              mic: audio,
              screenShare
            };
            oldStreams.splice(oldStreams.indexOf(thisStream), 1, thisStream);
            const newStreams = oldStreams;

            setCallDetails({ ...callDetailsRef.current, streams: newStreams });
          }
        };
        ws.addEventListener('message', handleMessage);

        const payload: OutgoingJoinCallMessage = {
          code: 3012,
          callId,
          peerId: id
        };
        socket.send(JSON.stringify(payload));
      });
    };
    rtc.peer.on('open', onOpen);

    return () => {
      setIsInCall(false);
      rtc.peer.off('open', onOpen);
      rtc.close();
    };
  }, [isInCall]);
  // FUNCTIONS
  const joinCall = () => {
    const callId = ringingDetailsRef.current?.callId;
    if (!callId) return;
    setIsRinging(false);
    setIsInCall(true);
    joinCallMutation({ options: { callId } });
  };
  const cancelCall = () => {
    const callId = ringingDetailsRef.current?.callId;
    if (!callId) return;
    cancelCallMutation(
      { options: { callId } },
      {
        onSuccess: (d) => {
          if (!d.CancelCall.data && d.CancelCall.errors.length > 0) {
            d.CancelCall.errors.forEach((err) => {
              errorToast(err.details?.message);
            });
          }
        }
      }
    );
    setIsRinging(false);
  };

  const handleStreamChange = (audio: boolean, video: boolean, screenShare?: boolean) => {
    if (!callDetailsRef.current) return;
    const { callId } = callDetailsRef.current;
    const realScreenShare = screenShare && !optionsRef.current.screenShare;

    const { mic, screenShare: optionsScreenShare, audioDevice, videoDevice } = optionsRef.current;
    if (audio === mic && optionsScreenShare) return;

    rtcRef.current
      ?.changeStream(audio, video, audioDevice?.deviceId, videoDevice?.deviceId, screenShare)
      ?.then((newStream) => {
        if (!rtcRef.current || !callDetailsRef.current) return;

        setOptions({ ...optionsRef.current, mic: audio, camera: video });

        const oldStreams = [...callDetailsRef.current.streams];
        const myStream = oldStreams.find((s) => s.peerId === rtcRef.current?.peerId);

        if (myStream) {
          const updatedStream = {
            ...myStream,
            mic: audio,
            camera: video,
            screenShare: screenShare !== undefined ? screenShare : optionsRef.current.screenShare
          };
          if (screenShare && rtcRef.current.isScreenSharing) {
            setOptions({ ...optionsRef.current, screenShare: true });
            updatedStream.stream = newStream;
            if (!newStream.getVideoTracks()[0]) return;
            newStream.getVideoTracks()[0].onended = () => {
              setOptions({ ...optionsRef.current, screenShare: false });
              if (!rtcRef.current) return;
              rtcRef.current.isScreenSharing = false;
              rtcRef.current.getMyStream(video, audio, audioDevice?.deviceId, videoDevice?.deviceId)?.then((stream) => {
                if (!callDetailsRef.current) return;
                rtcRef.current?.replaceStream(stream);
                if (rtcRef.current) {
                  rtcRef.current.myStream = stream;
                }

                const newOldStreams = [...callDetailsRef.current.streams];
                const myNewStream = newOldStreams.find((s) => s.peerId === rtcRef.current?.peerId);
                if (myNewStream) {
                  newOldStreams.splice(newOldStreams.indexOf(myNewStream), 1, {
                    ...myNewStream,
                    stream,
                    screenShare: false
                  });
                  const newStreams = newOldStreams;

                  setCallDetails({ ...callDetailsRef.current, streams: newStreams });
                }
              });
            };
          }
          oldStreams.splice(oldStreams.indexOf(myStream), 1, updatedStream);
          const newStreams = oldStreams;

          setCallDetails({ ...callDetailsRef.current, streams: newStreams });
        }
        const payload: OutgoingPeerChangeMessage = {
          code: 3015,
          peerId: rtcRef.current.peerId,
          callId,
          audio,
          camera: video,
          screenShare: screenShare !== undefined ? screenShare : optionsRef.current.screenShare
        };

        socket.send(JSON.stringify(payload));
      });
  };

  const handleScreenShare = () => {
    if (!callDetailsRef.current) return;
    if (!optionsRef.current.screenShare) {
      handleStreamChange(options.mic, options.camera, !options.screenShare);
    } else {
      setOptions({ ...optionsRef.current, screenShare: false });
      const tracks = rtcRef.current?.myStream.getTracks();
      tracks?.forEach((track) => track.stop());

      const { camera, mic, audioDevice, videoDevice } = optionsRef.current;
      rtcRef.current?.getMyStream(camera, mic, audioDevice?.deviceId, videoDevice?.deviceId)?.then((stream) => {
        if (!callDetailsRef.current) return;
        rtcRef.current?.replaceStream(stream);
        if (rtcRef.current) {
          rtcRef.current.myStream = stream;
        }

        const newOldStreams = [...callDetailsRef.current.streams];
        const myNewStream = newOldStreams.find((vid) => vid.peerId === rtcRef.current?.peerId);
        if (myNewStream) {
          newOldStreams.splice(newOldStreams.indexOf(myNewStream), 1, { ...myNewStream, stream, screenShare: false });
          const newStreams = newOldStreams;

          setCallDetails({ ...callDetailsRef.current, streams: newStreams });
        }
      });
    }
  };

  const handleDeviceSwitch = (deviceId: string) => {
    if (!callDetailsRef.current) return;
    const { mic, camera } = optionsRef.current;

    const thisDevice = devices.find((device) => device.deviceId === deviceId);

    if (!thisDevice) return;

    const key = thisDevice.kind === 'audioinput' ? 'audioDevice' : 'videoDevice';
    const newOptions = { ...options, [key]: thisDevice };
    setOptions(newOptions);
    rtcRef.current
      ?.getMyStream(camera, mic, newOptions.audioDevice?.deviceId, newOptions.videoDevice?.deviceId)
      ?.then((newStream) => {
        if (!callDetailsRef.current) return;
        rtcRef.current?.replaceStream(newStream);
        const oldStreams = [...callDetailsRef.current.streams];
        const myStream = oldStreams.find((s) => s.peerId === rtcRef.current?.peerId);
        if (!myStream) return;
        myStream.stream = newStream;
        oldStreams.splice(oldStreams.indexOf(myStream), 1, myStream);
        const newStreams = oldStreams;

        setCallDetails({ ...callDetailsRef.current, streams: newStreams });
      });
  };

  const createCall = (threadId: string) => {
    createCallMutation(
      { options: { threadId } },
      {
        onSuccess: (d) => {
          if (d.CreateCall.errors.length > 0) {
            d.CreateCall.errors.forEach((err) => {
              errorToast(err.details?.message);
            });
          } else {
            if (!d.CreateCall.data) return;

            // CONTINUE HERE ================================================================================================
            // setRingingDetails({ callId: d.CreateCall.data,  });
          }
        }
      }
    );
  };
  return (
    <>
      <RTCcontext.Provider value={{ isInCall, callDetails, isRinging, ringingDetails, joinCall }}>
        {children}
      </RTCcontext.Provider>
    </>
  );
};

export default RTCProvider;
