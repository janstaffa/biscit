// export interface VideoChatProps {}
import { useEffect, useRef, useState } from 'react';
import { AiOutlineAudioMuted } from 'react-icons/ai';
import { BiVideoOff } from 'react-icons/bi';
import { HiDotsVertical, HiPhoneMissedCall } from 'react-icons/hi';
import { MdScreenShare } from 'react-icons/md';
import { VscMute } from 'react-icons/vsc';
import { useLeaveCallMutation, useMeQuery } from '../../../generated/graphql';
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
  username?: string;
  stream: MediaStream;
  mic: boolean;
  camera: boolean;
  screenShare: boolean;
  isMe: boolean;
}

type VideoChatProps = {
  callId: string;
  setIsInCall: React.Dispatch<React.SetStateAction<boolean>>;
};

interface VideoChatOptions {
  mic: boolean;
  camera: boolean;
  screenShare: boolean;
}
const VideoChat: React.FC<VideoChatProps> = ({ callId, setIsInCall }) => {
  const videoContainer = useRef<HTMLDivElement | null>(null);
  const videoContainerPadding = 20;
  const [videos, setVideos] = useState<VideoType[]>([]);
  const videosRef = useRef<VideoType[]>([]);
  videosRef.current = videos;
  const { mutate: leaveCall } = useLeaveCallMutation();

  const { data: meData } = useMeQuery();

  const [options, setOptions] = useState<VideoChatOptions>({ mic: true, camera: true, screenShare: false });
  const optionsRef = useRef<VideoChatOptions>(options);
  optionsRef.current = options;
  const rtcRef = useRef<RTCconnection>();
  const createVideo = (
    peerId: string,
    stream: MediaStream,
    camera: boolean,
    mic: boolean,
    screenShare: boolean,
    isMe: boolean,
    username?: string
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
      screenShare,
      mic,
      username,
      isMe
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

  const handleStreamChange = (audio: boolean, video: boolean, screenShare: boolean) => {
    rtcRef.current?.changeStream(audio, video, screenShare)?.then((newStream) => {
      if (!rtcRef.current) return;
      setOptions({ ...optionsRef.current, mic: audio, camera: video, screenShare });

      const oldVideos = [...videosRef.current];
      const myVideo = oldVideos.find((vid) => vid.peerId === rtcRef.current?.peerId);
      if (myVideo) {
        const updatedVideo = {
          ...myVideo,
          mic: audio,
          camera: video,
          screenShare
        };
        if (screenShare) {
          updatedVideo.stream = newStream;
          newStream.getVideoTracks()[0].onended = () => {
            setOptions({ ...optionsRef.current, screenShare: false });
            rtcRef.current?.getMyStream(audio, video)?.then((stream) => {
              rtcRef.current?.replaceStream(stream);
              if (rtcRef.current) {
                rtcRef.current.myStream = stream;
              }

              const newOldVideos = [...videosRef.current];
              const myNewVideo = newOldVideos.find((vid) => vid.peerId === rtcRef.current?.peerId);
              if (myNewVideo) {
                newOldVideos.splice(newOldVideos.indexOf(myNewVideo), 1, { ...myNewVideo, stream, screenShare: false });
                setVideos(newOldVideos);
              }
            });
          };
        }
        oldVideos.splice(oldVideos.indexOf(myVideo), 1, updatedVideo);

        setVideos(oldVideos);
      }
      const payload: OutgoingPeerChangeMessage = {
        code: 3015,
        peerId: rtcRef.current.peerId,
        callId,
        audio,
        camera: video,
        screenShare
      };

      socket.send(JSON.stringify(payload));
    });
  };
  useEffect(() => {
    const rtc = new RTCconnection(callId);
    rtcRef.current = rtc;

    const ws = socket.connect();

    const { mic, camera } = options;
    const onOpen = (id) => {
      rtc.getMyStream(camera, mic)?.then((stream) => {
        if (stream) {
          rtc.streaming = true;
          rtc.myStream = stream;
          createVideo(id, stream, camera, true, false, true, meData?.me?.username);
        }

        rtc.peer.on('call', (call) => {
          call.answer(stream);
          call.on('stream', (userVideoStream) => {
            createVideo(call.metadata.id, userVideoStream, true, true, false, false, call.metadata.username);
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
            const call = rtc.peer.call(peerId, stream, {
              metadata: { id: rtc.peer.id, username: meData?.me?.username }
            });

            call?.on('stream', (userVideoStream) => {
              const hasAudio = userVideoStream.getAudioTracks().find((track) => track.enabled);
              const hasVideo = userVideoStream.getVideoTracks().find((track) => track.enabled);

              createVideo(peerId, userVideoStream, !!hasAudio, !!hasVideo, false, false, user.username);
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
            const { peerId, userId, camera: cam, audio, screenShare } = incoming as IncomingPeerChangeMessage;
            const oldVideos = [...videosRef.current];
            let thisVideo = oldVideos.find((video) => video.peerId === peerId);
            if (!thisVideo) return;
            thisVideo = {
              ...thisVideo,
              camera: cam,
              mic: audio,
              screenShare
            };
            oldVideos.splice(oldVideos.indexOf(thisVideo), 1, thisVideo);
            setVideos(oldVideos);
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
                isMe={video.isMe}
                key={video.peerId}
                stream={video.stream}
                peerId={video.peerId}
                camera={video.camera}
                mic={video.mic}
                screenShare={video.screenShare}
                username={video.username}
              />
            );
          })}
        </div>
        <div
          className="w-full h-20 bg-dark-200 flex flex-row justify-center items-center relative"
          style={{ minHeight: '80px' }}
        >
          <button
            className={
              'w-12 h-12 bg-transparent border-2 border-light-300 rounded-full flex flex-col justify-center items-center mx-2 hover:text-black transition-all delay-75' +
              (options.camera ? ' text-light-300 hover:bg-light-400' : ' text-black bg-red-500 border-none')
            }
            title="Turn off your camera"
            onClick={() => handleStreamChange(options.mic, !options.camera, options.screenShare)}
          >
            <BiVideoOff size={20} />
          </button>
          <button
            className={
              'w-12 h-12 bg-transparent border-2 border-light-300 rounded-full flex flex-col justify-center items-center mx-2 hover:text-black transition-all delay-75' +
              (options.mic ? ' text-light-300 hover:bg-light-400' : ' text-black bg-red-500 border-none')
            }
            title="Mute your microphone"
            onClick={() => handleStreamChange(!options.mic, options.camera, options.screenShare)}
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
            onClick={() => handleStreamChange(options.mic, options.camera, !options.screenShare)}
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
