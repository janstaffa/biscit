// export interface VideoChatProps {}
import { useRef, useState } from 'react';
import { AiOutlineAudioMuted } from 'react-icons/ai';
import { BiVideoOff } from 'react-icons/bi';
import { HiDotsVertical, HiPhoneMissedCall } from 'react-icons/hi';
import { MdScreenShare } from 'react-icons/md';
import { VscMute } from 'react-icons/vsc';
import { useLeaveCallMutation } from '../../../generated/graphql';
import { errorToast } from '../../../utils/toasts';
import Video from './Video';

type VideoChatProps = {
  callId: string;
  setIsInCall: React.Dispatch<React.SetStateAction<boolean>>;
};
const VideoChat: React.FC<VideoChatProps> = ({ callId, setIsInCall }) => {
  const videoContainer = useRef<HTMLDivElement | null>(null);
  const videoContainerPadding = 20;
  const [videos, setVideos] = useState<string[]>(['Test', 'Babel']);
  const { mutate: leaveCall } = useLeaveCallMutation();

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
          <Video />
          <Video />
          <Video />
          <Video />
          <Video />
          <Video />
          <Video />
        </div>
        <div
          className="w-full h-20 bg-dark-200 flex flex-row justify-center items-center relative"
          style={{ minHeight: '80px' }}
        >
          <button
            className="w-12 h-12 bg-transparent border-2 border-light-300 rounded-full flex flex-col justify-center items-center mx-2 text-light-300 hover:bg-light-400 hover:text-black transition-all delay-75"
            title="Volume off"
          >
            <BiVideoOff size={20} />
          </button>
          <button
            className="w-12 h-12 bg-transparent border-2 border-light-300 rounded-full flex flex-col justify-center items-center mx-2 text-light-300 hover:bg-light-400 hover:text-black transition-all delay-75"
            title="Mute your microphone"
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
