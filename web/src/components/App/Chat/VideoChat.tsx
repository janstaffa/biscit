// export interface VideoChatProps {}
import { useEffect, useRef, useState } from 'react';
import { AiOutlineAudioMuted } from 'react-icons/ai';
import { BiVideoOff } from 'react-icons/bi';
import { HiDotsVertical, HiPhoneMissedCall } from 'react-icons/hi';
import { MdScreenShare } from 'react-icons/md';
import { VscMute } from 'react-icons/vsc';
import { useLeaveCallMutation, useMeQuery, UserSnippetFragment } from '../../../generated/graphql';
import {
  IncomingJoinCallMessage,
  IncomingPeerChangeMessage,
  OutgoingJoinCallMessage,
  OutgoingPeerChangeMessage
} from '../../../types';
import { RTCconnection } from '../../../utils/createRTCconnection';
import { socket } from '../../../utils/createWSconnection';
import { errorToast } from '../../../utils/toasts';
import Video from './Video';

interface VideoType {
  peerId: string;
  user?: UserSnippetFragment;
  stream: MediaStream;
  mic: boolean;
  camera: boolean;
}

type VideoChatProps = {
  callId: string;
  setIsInCall: React.Dispatch<React.SetStateAction<boolean>>;
};

interface VideoChatOptions {
  mic: boolean;
  camera: boolean;
}
const VideoChat: React.FC<VideoChatProps> = ({ callId, setIsInCall }) => {
  const videoContainer = useRef<HTMLDivElement | null>(null);
  const videoContainerPadding = 20;
  const [videos, setVideos] = useState<VideoType[]>([]);
  const videosRef = useRef<VideoType[]>([]);
  videosRef.current = videos;
  const { mutate: leaveCall } = useLeaveCallMutation();

  const { data: meData } = useMeQuery();

  const [options, setOptions] = useState<VideoChatOptions>({ mic: true, camera: true });
  const optionsRef = useRef<VideoChatOptions>(options);
  optionsRef.current = options;
  const rtcRef = useRef<RTCconnection>();
  const createVideo = (
    peerId: string,
    stream: MediaStream,
    camera: boolean,
    mic: boolean,
    user?: UserSnippetFragment
  ) => {
    const prevVideos = [...videosRef.current];
    const alreadyExists = videosRef.current.find((video) => video.peerId === peerId);
    if (alreadyExists) {
      prevVideos.splice(prevVideos.indexOf(alreadyExists), 1);
    }
    const newVideo: VideoType = {
      peerId,
      stream,
      camera,
      mic,
      user
    };

    setVideos([...prevVideos, newVideo]);
  };
  const removeVideo = (peerId: string) => {
    const newVideos = [...videosRef.current];
    const thisVideo = newVideos.find((video) => video.peerId === peerId);
    if (!thisVideo) return;
    newVideos.splice(newVideos.indexOf(thisVideo), 1);
    setVideos(newVideos);
  };

  // const callUser = (
  //   rtc: RTCconnection,
  //   peer: Peer,
  //   peerId: string,
  //   stream: MediaStream,
  //   user: UserSnippetFragment | undefined
  // ) => {
  //   const call = peer.call(peerId, stream, { metadata: { id: peer.id } });
  //   call?.on('stream', (userVideoStream) => {
  //     createVideo(peerId, userVideoStream, true, true, user);
  //   });
  //   call?.on('close', () => {
  //     removeVideo(peerId);
  //   });
  //   call?.on('error', () => {
  //     removeVideo(peerId);
  //   });

  //   rtc.peers.push(call);
  // };

  const handleMic = (value: boolean) => {
    if (!rtcRef.current) return;
    rtcRef.current.changeStream(value, optionsRef.current.camera);
    setOptions({ ...optionsRef.current, mic: value });

    const payload: OutgoingPeerChangeMessage = {
      code: 3015,
      peerId: rtcRef.current.peerId,
      callId,
      audio: value,
      camera: optionsRef.current.camera
    };

    socket.send(JSON.stringify(payload));
  };
  const handleCamera = (value: boolean) => {
    if (!rtcRef.current) return;
    rtcRef.current.changeStream(optionsRef.current.mic, value);
    setOptions({ ...optionsRef.current, camera: value });

    const payload: OutgoingPeerChangeMessage = {
      code: 3015,
      peerId: rtcRef.current.peerId,
      callId,
      audio: optionsRef.current.mic,
      camera: value
    };

    socket.send(JSON.stringify(payload));
  };
  useEffect(() => {
    console.log('mount');
    const rtc = new RTCconnection(callId);
    rtcRef.current = rtc;
    const ws = socket.connect();

    const { mic, camera } = options;
    const onOpen = (id) => {
      rtc.getMyStream(camera, mic).then((stream) => {
        console.log('getMyStream');
        if (stream) {
          rtc.streaming = true;
          createVideo(id, stream, camera, false, meData?.me as UserSnippetFragment);
        }

        rtc.peer.on('call', (call) => {
          call.answer(stream);
          call.on('stream', (userVideoStream) => {
            createVideo(call.metadata.id, userVideoStream, true, true, call.metadata.username);
          });
          call.on('close', () => {
            removeVideo(call.metadata.id);
          });
          call.on('error', () => {
            removeVideo(call.metadata.id);
          });

          rtc.peers.push(call);
        });

        const handleMessage = (e) => {
          const { data: m } = e;
          const incoming = JSON.parse(m);

          if (incoming.code === 3012) {
            const { user, peerId } = incoming as IncomingJoinCallMessage;
            const call = rtc.peer.call(peerId, stream, { metadata: { id: rtc.peer.id, username: user.username } });

            call?.on('stream', (userVideoStream) => {
              const hasAudio = userVideoStream.getAudioTracks().find((track) => track.enabled);
              const hasVideo = userVideoStream.getVideoTracks().find((track) => track.enabled);

              createVideo(peerId, userVideoStream, !!hasAudio, !!hasVideo, user);
            });
            call?.on('close', () => {
              removeVideo(peerId);
            });
            call?.on('error', () => {
              removeVideo(peerId);
            });

            rtc.peers.push(call);
          } else if (incoming.code === 3013) {
            setIsInCall(false);
            rtc.close();
          } else if (incoming.code === 3015) {
            console.log('reached');
            const { peerId, userId, camera: cam, audio } = incoming as IncomingPeerChangeMessage;
            const oldVideos = [...videosRef.current];
            let thisVideo = oldVideos.find((video) => video.peerId === peerId && video.user?.id === userId);
            if (!thisVideo) return;
            thisVideo = {
              ...thisVideo,
              camera: cam,
              mic: audio
            };
            oldVideos.splice(oldVideos.indexOf(thisVideo), 1);
            setVideos([...oldVideos, thisVideo]);
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
      console.log('unmount');
      setVideos([]);
      rtc.peer.off('open', onOpen);
      rtc.close();
    };
  }, []);

  return (
    <div
      className="w-full bg-dark-300 absolute top-0 left-0 border-b-2 border-dark-50 pt-12"
      style={{ height: '550px' }}
    >
      <div className="w-full h-full flex flex-col">
        <div
          className="w-full flex-grow flex flex-row flex-wrap justify-center overflow-auto"
          ref={videoContainer}
          style={{ padding: videoContainerPadding + 'px' }}
        >
          {videos.map((video) => {
            return (
              <Video
                key={video.peerId}
                stream={video.stream}
                peerId={video.peerId}
                camera={video.camera}
                mic={video.mic}
                user={video.user}
              />
            );
          })}
        </div>
        <div
          className="w-full h-20 bg-dark-200 flex flex-row justify-center items-center relative"
          style={{ minHeight: '80px' }}
        >
          <button
            className="w-12 h-12 bg-transparent border-2 border-light-300 rounded-full flex flex-col justify-center items-center mx-2 text-light-300 hover:bg-light-400 hover:text-black transition-all delay-75"
            title="Turn off your camera"
            onClick={() => handleCamera(!options.camera)}
          >
            <BiVideoOff size={20} />
          </button>
          <button
            className="w-12 h-12 bg-transparent border-2 border-light-300 rounded-full flex flex-col justify-center items-center mx-2 text-light-300 hover:bg-light-400 hover:text-black transition-all delay-75"
            title="Mute your microphone"
            onClick={() => {
              handleMic(!options.mic);
            }}
          >
            <AiOutlineAudioMuted size={20} />
          </button>
          <button
            className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex flex-col justify-center items-center mx-2"
            title="Leave call"
            onClick={() => {
              leaveCall(
                { options: { callId } },
                {
                  onSuccess: (d) => {
                    if (d.LeaveCall.errors.length > 0) {
                      d.LeaveCall.errors.forEach((err) => {
                        errorToast(err.details?.message);
                      });
                    }
                    setIsInCall(false);
                  }
                }
              );
            }}
          >
            <HiPhoneMissedCall size={20} />
          </button>
          <button
            className="w-12 h-12 bg-transparent border-2 border-light-300 rounded-full flex flex-col justify-center items-center mx-2 text-light-300 hover:bg-light-400 hover:text-black transition-all delay-75"
            title="Volume off"
          >
            <VscMute size={20} />
          </button>
          <button
            className="w-12 h-12 bg-transparent border-2 border-light-300 rounded-full flex flex-col justify-center items-center mx-2 text-light-300 hover:bg-light-400 hover:text-black transition-all delay-75"
            title="Share your screen"
          >
            <MdScreenShare size={20} />
          </button>

          <div className="absolute right-0 w-20 h-full flex flex-col justify-center items-center">
            <HiDotsVertical className="text-light-300 text-2xl hover:text-light-200 cursor-pointer" title="Settings" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoChat;