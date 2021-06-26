import { useEffect, useRef } from 'react';
import { AiOutlineAudioMuted } from 'react-icons/ai';

interface VideoProps {
  isMe: boolean;
  peerId: string;
  stream: MediaStream;
  mic: boolean;
  camera: boolean;
  screenShare: boolean;
  username?: string;
}
const Video: React.FC<VideoProps> = ({ stream, peerId, mic = true, camera = true, screenShare, username, isMe }) => {
  const video = useRef<HTMLVideoElement | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (video.current) {
      video.current.srcObject = stream;
    }
    if (audio.current) {
      audio.current.srcObject = stream;
    }
  });

  return (
    <div
      className="bg-dark-200 m-3 relative rounded-md"
      style={{
        width: '576px',
        height: '280px'
      }}
    >
      {camera || screenShare ? (
        <video id={peerId} autoPlay={true} ref={video} className="w-full h-full" muted={true}></video>
      ) : (
        <div className="w-full h-full flex flex-col justify-center items-center">
          <div className="w-20 h-20 bg-white rounded-full"></div>
        </div>
      )}
      <audio autoPlay={true} ref={audio} muted={isMe || !mic} className="hidden"></audio>
      <div className="absolute right-0 bottom-0 bg-dark-100 w-full px-5 py-2 flex flex-row justify-between items-center rounded-b-md">
        <span className="text-light-200 font-bold text-lg">
          {username || 'unknown user'}
          {isMe ? ' (you)' : ''}
        </span>
        {!mic ? <AiOutlineAudioMuted size={25} className="text-red-600" /> : null}
      </div>
    </div>
  );
};

export default Video;
