import React, { ReactNode, useEffect, useRef, useState } from 'react';
import {
  MeQuery,
  ThreadSnippetFragment,
  useCancelCallMutation,
  useCreateCallMutation,
  useJoinCallMutation,
  useLeaveCallMutation,
  useMeQuery,
  UserSnippetFragment,
  useThreadsQuery
} from '../generated/graphql';
import {
  IncomingCancelCallMessage,
  IncomingCreateCallMessage,
  IncomingJoinCallMessage,
  IncomingKillCallMessage,
  IncomingLeaveCallMessage,
  IncomingPeerChangeMessage,
  IncomingStartCallMessage,
  OutgoingJoinCallMessage,
  OutgoingPeerChangeMessage
} from '../types';
import { queryClient } from './createQueryClient';
import { RTCconnection } from './createRTCconnection';
import { socket } from './createWSconnection';
import { errorToast } from './toasts';

export interface RTCwrapProps {
  children: ReactNode;
}

interface StreamType {
  peerId: string;
  userId: string;
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

interface PeerOptions {
  mic: boolean;
  camera: boolean;
  screenShare: boolean;
  isDeafened: boolean;
  volume: number;
  videoDevice: MediaDeviceInfo | undefined;
  audioDevice: MediaDeviceInfo | undefined;
}
interface RTCcontextType {
  isInCall: boolean;
  callDetails: CallDetails | undefined;
  isRinging: boolean;
  ringingDetails: RingingDetails | undefined;
  options: PeerOptions;
  devices: MediaDeviceInfo[];
  joinCall: (callId: string, threadId: string) => void;
  cancelCall: (callId: string) => void;
  handleStreamChange: (audio: boolean, video: boolean, screenShare?: boolean) => void;
  handleScreenShare: () => void;
  handleDeviceSwitch: (deviceId: string) => void;
  createCall: (threadId: string) => void;
  leaveCall: () => void;
  handleDeafen: (value: boolean) => void;
  changeVolume: (newVolume: number) => void;
}

interface CallMetadata {
  peerId: string;
  userId: string;
}
const defaultVolume = 100;

interface AudioPlayerProps {
  stream: MediaStream;
  volume: number;
  isMe: boolean;
  mic: boolean;
  isDeafened: boolean;
}
const AudioPlayer: React.FC<AudioPlayerProps> = ({ isMe, mic, isDeafened, volume, stream }) => {
  const audioElement = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (audioElement.current) {
      audioElement.current.srcObject = stream;
      audioElement.current.volume = volume / 100;
    }
  });
  return <audio autoPlay={true} ref={audioElement} muted={isMe || !mic || isDeafened} className="hidden"></audio>;
};

export const RTCcontext = React.createContext<RTCcontextType | null>(null);
const RTCProvider: React.FC<RTCwrapProps> = ({ children }) => {
  // STATES
  const [isInCall, setIsInCall] = useState<boolean>(false);
  const isInCallRef = useRef<boolean>(isInCall);
  isInCallRef.current = isInCall;
  const [callDetails, setCallDetails] = useState<CallDetails | undefined>();
  const callDetailsRef = useRef<CallDetails | undefined>(callDetails);
  callDetailsRef.current = callDetails;

  const [isRinging, setIsRinging] = useState<boolean>(false);
  const isRingingRef = useRef<boolean>(isRinging);
  isRingingRef.current = isRinging;
  const [ringingDetails, setRingingDetails] = useState<RingingDetails | undefined>();
  const ringingDetailsRef = useRef<RingingDetails | undefined>(ringingDetails);
  ringingDetailsRef.current = ringingDetails;

  const defaultOptions = {
    mic: true,
    camera: true,
    screenShare: false,
    isDeafened: false,
    volume: defaultVolume,
    videoDevice: undefined,
    audioDevice: undefined
  };
  const [options, setOptions] = useState<PeerOptions>(defaultOptions);
  const optionsRef = useRef<PeerOptions>(options);
  optionsRef.current = options;

  const rtcRef = useRef<RTCconnection>();

  const ringtone = useRef<HTMLAudioElement>();

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  // QUERIES / MUTATIONS
  const { data: meData, isLoading } = useMeQuery();
  const { data: loadedThreads } = useThreadsQuery();
  const meRef = useRef<MeQuery>();
  meRef.current = meData;

  const { mutate: joinCallMutation } = useJoinCallMutation();
  const { mutate: cancelCallMutation } = useCancelCallMutation();
  const { mutate: createCallMutation } = useCreateCallMutation();
  const { mutate: leaveCallMutation } = useLeaveCallMutation();

  const createStream = (
    peerId: string,
    userId: string | undefined,
    stream: MediaStream,
    camera: boolean,
    mic: boolean,
    screenShare: boolean,
    isMe: boolean
  ) => {
    if (!callDetailsRef.current || !userId) return;
    // const thisThread = loadedThreads?.threads.find((thread) => thread.threadId === callDetailsRef.current?.threadId);
    // if (!thisThread) return;
    // const thisUser = thisThread.thread.members.find((member) => member.userId === userId);
    // if (!thisUser) return;
    // console.log('creating a stream for', thisUser.user, 'with id', userId);

    const prevStreams = [...callDetailsRef.current.streams];
    const alreadyExists = callDetailsRef.current.streams.find((s) => s.peerId === peerId || s.userId === userId);
    if (alreadyExists) {
      prevStreams.splice(prevStreams.indexOf(alreadyExists), 1);
    }
    const newStream: StreamType = {
      peerId,
      userId,
      stream,
      camera,
      screenShare,
      mic,
      isMe,
      volume: optionsRef.current.volume
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

  const connection = useRef<RTCconnection | null>(null);

  const initializeCall = (callId: string, threadId: string) => {
    console.log('aaa');
    setIsRinging(false);
    setIsInCall(true);
    setCallDetails({ callId, threadId, callMembers: [], streams: [] });

    const ws = socket.connect();
    if (!connection.current) {
      connection.current = new RTCconnection(callId);
    }
    const rtc = connection.current;
    rtcRef.current = rtc;

    const { mic, camera } = options;

    const onOpen = (id) => {
      rtc.getMyStream(camera, mic, undefined, undefined)?.then((stream) => {
        navigator.mediaDevices
          .enumerateDevices()
          .then((d) => {
            setDevices(d);
          })
          .catch((e) => {
            console.error(e);
          });

        if (stream) {
          rtc.streaming = true;
          rtc.myStream = stream;
          createStream(id, meRef.current?.me?.id, stream, camera, true, false, true);
        }

        rtc.peer.on('call', (call) => {
          call.answer(stream);

          const { peerId, userId } = call.metadata as CallMetadata;
          call.on('stream', (userVideoStream) => {
            createStream(peerId, userId, userVideoStream, true, true, false, false);
          });
          call.on('close', () => {
            removeStream(peerId);
            rtc.peers?.splice(rtc.peers.indexOf(call), 1);
          });
          call.on('error', () => {
            removeStream(peerId);
            rtc.peers?.splice(rtc.peers.indexOf(call), 1);
          });

          rtc.peers.push(call);
        });

        const handleMessage = (e) => {
          if (!callDetailsRef.current) return;
          const { data: m } = e;
          const incoming = JSON.parse(m);

          if (incoming.code === 3012) {
            const { user, peerId } = incoming as IncomingJoinCallMessage;
            if (!meRef.current?.me) return;
            const call = rtc.peer.call(peerId, stream, {
              metadata: {
                peerId: rtc.peer.id,
                userId: meRef.current.me.id
              } as CallMetadata
            });

            call?.on('stream', (userVideoStream) => {
              const hasAudio = userVideoStream.getAudioTracks().find((track) => track.enabled);
              const hasVideo = userVideoStream.getVideoTracks().find((track) => track.enabled);

              createStream(peerId, user.id, userVideoStream, !!hasAudio, !!hasVideo, false, false);
            });
            call?.on('close', () => {
              removeStream(peerId);
              rtc.peers?.splice(rtc.peers.indexOf(call), 1);
            });
            call?.on('error', () => {
              removeStream(peerId);
              rtc.peers?.splice(rtc.peers.indexOf(call), 1);
            });

            rtc.peers.push(call);
          } else if (incoming.code === 3013) {
            setIsInCall(false);
            rtc.close();
          } else if (incoming.code === 3015) {
            const { peerId, userId, camera: cam, audio, screenShare } = incoming as IncomingPeerChangeMessage;
            const oldStreams = [...callDetailsRef.current.streams];
            let thisStream = oldStreams.find((video) => video.peerId === peerId && video.userId);
            if (!thisStream) return;
            oldStreams.splice(oldStreams.indexOf(thisStream), 1);
            thisStream = {
              ...thisStream,
              camera: cam,
              mic: audio,
              screenShare
            };
            oldStreams.push(thisStream);
            const newStreams = oldStreams;

            setCallDetails({ ...callDetailsRef.current, streams: newStreams });
          } else if (incoming.code === 3016) {
            const { callId: cId, userId } = incoming as IncomingLeaveCallMessage;
            if (callDetailsRef.current.callId !== cId) return;

            const oldStreams = [...callDetailsRef.current.streams];
            const thisStream = oldStreams.find((s) => s.userId === userId);
            if (!thisStream) return;
            oldStreams.splice(oldStreams.indexOf(thisStream), 1);
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

    // return () => {
    //   setIsInCall(false);
    //   rtc.peer.off('open', onOpen);
    //   rtc.close();
    // };
  };

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
      if (callingUser.id !== meRef.current?.me?.id) {
        ringtone.current.play().catch((e) => console.error(e));
      }
    }
  }, [isRinging]);

  useEffect(() => {
    if (!isInCall) {
      setCallDetails(undefined);
    }
  }, [isInCall]);
  useEffect(() => {
    ringtone.current = new Audio('/ringtone.mp3');
    ringtone.current.loop = true;

    const ws = socket.connect();
    const handleMessage = (e) => {
      const { data: m } = e;
      const incoming = JSON.parse(m);

      if (incoming.code === 3010) {
        if (isInCallRef.current) return;
        const { user, thread, callId: cId } = incoming as IncomingCreateCallMessage;
        setRingingDetails({ ...ringingDetailsRef.current, user, thread, callId: cId });
        setIsRinging(true);
      } else if (incoming.code === 3011) {
        const { callId } = incoming as IncomingCancelCallMessage;
        if (!isRingingRef.current) return;
        if (ringingDetailsRef.current?.callId === callId) {
          setIsRinging(false);
        }
      } else if (incoming.code === 3014) {
        const { user, thread, callId: cId } = incoming as IncomingStartCallMessage;
        if (isInCallRef.current) return;

        console.log('here');
        initializeCall(cId, thread.id);
      } else if (incoming.code === 3013) {
        const { threadId } = incoming as IncomingKillCallMessage;
        queryClient.invalidateQueries(['Thread', { options: { threadId } }]);
        connection.current?.myStream.getTracks().forEach((track) => track.stop());
        connection.current = null;
        rtcRef.current?.myStream.getTracks().forEach((track) => track.stop());
        rtcRef.current = undefined;

        setIsInCall(false);
        setOptions(defaultOptions);
        setCallDetails(undefined);
      }
    };
    ws?.addEventListener('message', handleMessage);
  }, []);

  // FUNCTIONS

  const joinCall = (callId, threadId) => {
    if (isInCallRef.current || callDetailsRef.current) {
      errorToast('You are already in a call.');
      return;
    }
    joinCallMutation(
      {
        options: { callId }
      },
      {
        onSuccess: (d) => {
          if (!d.JoinCall.data && d.JoinCall.errors.length > 0) {
            d.JoinCall.errors.forEach((err) => {
              errorToast(err.details?.message);
            });
          }

          initializeCall(callId, threadId);
        }
      }
    );
  };
  const cancelCall = (callId) => {
    const cId = ringingDetailsRef.current?.callId;
    if (!callId || !cId || callId !== cId) return;
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

  const handleStreamChange = (audio, video, screenShare) => {
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

  const handleDeviceSwitch = (deviceId) => {
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

  const leaveCall = () => {
    if (!isInCallRef.current || !callDetailsRef.current) return;
    leaveCallMutation(
      { options: { callId: callDetailsRef.current.callId } },
      {
        onSuccess: (d) => {
          if (d.LeaveCall.errors.length > 0) {
            d.LeaveCall.errors.forEach((err) => {
              errorToast(err.details?.message);
            });
          }
          setIsInCall(false);
          setOptions(defaultOptions);
          setCallDetails(undefined);
          connection.current?.myStream.getTracks().forEach((track) => track.stop());
          connection.current = null;
          rtcRef.current?.myStream.getTracks().forEach((track) => track.stop());
          rtcRef.current = undefined;
        }
      }
    );
  };
  const createCall = (threadId) => {
    if (!threadId) return;

    if (isInCallRef.current || callDetailsRef.current) {
      errorToast('You are already in a call.');
      return;
    }
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
            setRingingDetails({ ...ringingDetailsRef.current, callId: d.CreateCall.data } as RingingDetails);
          }
        }
      }
    );
  };
  const handleDeafen = (value) => {
    if (!isInCallRef.current || !callDetailsRef.current) return;
    setOptions({ ...optionsRef.current, isDeafened: value });
  };
  const changeVolume = (newVolume) => {
    if (!isInCallRef.current || !callDetailsRef.current) return;
    setOptions({ ...optionsRef.current, volume: newVolume });
  };
  return (
    <>
      <RTCcontext.Provider
        value={{
          isInCall,
          callDetails,
          isRinging,
          ringingDetails,
          options,
          devices,
          joinCall,
          cancelCall,
          handleStreamChange,
          handleScreenShare,
          handleDeviceSwitch,
          createCall,
          leaveCall,
          handleDeafen,
          changeVolume
        }}
      >
        {children}
        {callDetails?.streams.map((stream) => (
          <AudioPlayer
            stream={stream.stream}
            volume={stream.volume}
            isMe={stream.isMe}
            isDeafened={options.isDeafened}
            mic={options.mic}
            key={stream.peerId}
          />
        ))}
      </RTCcontext.Provider>
    </>
  );
};

export default RTCProvider;
