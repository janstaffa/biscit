// export interface VideoChatProps {}
import Peer from 'peerjs';
import { useEffect, useRef, useState } from 'react';
import { AiOutlineAudioMuted } from 'react-icons/ai';
import { BiVideoOff } from 'react-icons/bi';
import { HiDotsVertical, HiPhoneMissedCall } from 'react-icons/hi';
import { MdScreenShare } from 'react-icons/md';
import { VscMute } from 'react-icons/vsc';
import { useLeaveCallMutation, UserSnippetFragment } from '../../../generated/graphql';
import { IncomingJoinCallMessage, OutgoingJoinCallMessage } from '../../../types';
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

interface MeanwhileJoinedType {
  peerId: string;
  user?: UserSnippetFragment;
  mic: boolean;
  camera: boolean;
}

type VideoChatProps = {
  callId: string;
  setIsInCall: React.Dispatch<React.SetStateAction<boolean>>;
};
const VideoChat: React.FC<VideoChatProps> = ({ callId, setIsInCall }) => {
  const videoContainer = useRef<HTMLDivElement | null>(null);
  const videoContainerPadding = 20;
  const [videos, setVideos] = useState<VideoType[]>([]);
  const videosRef = useRef<VideoType[]>([]);
  videosRef.current = videos;
  const { mutate: leaveCall } = useLeaveCallMutation();

  const [options, setOptions] = useState<{ mic: boolean; camera: boolean }>({ mic: true, camera: true });

  const createVideo = (
    peerId: string,
    stream: MediaStream,
    camera: boolean,
    mic: boolean,
    user?: UserSnippetFragment
  ) => {
    if (videosRef.current.find((video) => video.peerId === peerId)) return;
    const newVideo: VideoType = {
      peerId,
      stream,
      camera,
      mic,
      user
    };

    setVideos([...videosRef.current, newVideo]);
  };
  const removeVideo = (peerId: string) => {
    const newVideos = [...videosRef.current];
    const thisVideo = newVideos.find((video) => video.peerId === peerId);
    if (!thisVideo) return;
    newVideos.splice(newVideos.indexOf(thisVideo), 1);
    setVideos(newVideos);
  };

  const callUser = (rtc: Peer, peerId: string, stream: MediaStream, user: UserSnippetFragment | undefined) => {
    const call = rtc.call(peerId, stream, { metadata: { id: RTCconnection.peerId } });
    call.on('stream', (userVideoStream) => {
      createVideo(peerId, userVideoStream, true, true, user);
    });
    call.on('close', () => {
      removeVideo(peerId);
    });
    call.on('error', () => {
      removeVideo(peerId);
    });
  };
  useEffect(() => {
    const ws = socket.connect();
    const rtc = RTCconnection.connect(callId);
    const { mic, camera } = options;
    rtc.on('open', (id) => {
      RTCconnection.getMyStream(camera, mic).then((stream) => {
        if (stream) {
          RTCconnection.streaming = true;
          createVideo(RTCconnection.peerId, stream, camera, false);
        }

        rtc.on('call', (call) => {
          if (stream) {
            call.answer(stream);
          }
          call.on('stream', (userVideoStream) => {
            createVideo(call.metadata.id, userVideoStream, true, true);
          });
          call.on('close', () => {
            removeVideo(call.metadata.id);
          });
          call.on('error', () => {
            removeVideo(call.metadata.id);
          });
        });

        const handleMessage = (e) => {
          const { data: m } = e;
          const incoming = JSON.parse(m);

          if (incoming.code === 3012) {
            const { user, peerId } = incoming as IncomingJoinCallMessage;
            callUser(rtc, peerId, stream, user);
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
      return () => {
        RTCconnection.close();
        setVideos([]);
      };
    });
  }, [options]);

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
            // onClick={() => setOptions({ ...options, camera: !options.camera })}
          >
            <BiVideoOff size={20} />
          </button>
          <button
            className="w-12 h-12 bg-transparent border-2 border-light-300 rounded-full flex flex-col justify-center items-center mx-2 text-light-300 hover:bg-light-400 hover:text-black transition-all delay-75"
            title="Mute your microphone"
            // onClick={() => setOptions({ ...options, mic: !options.mic })}
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
