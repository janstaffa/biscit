import { useEffect, useRef } from 'react';
import { AiOutlineAudioMuted } from 'react-icons/ai';
import { UserSnippetFragment } from '../../../generated/graphql';

interface VideoProps {
  peerId: string;
  stream: MediaStream;
  mic: boolean;
  camera: boolean;
  user?: UserSnippetFragment;
}
const Video: React.FC<VideoProps> = ({ stream, peerId, mic = true, camera = true, user }) => {
  const video = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (video.current) {
      video.current.srcObject = stream;
    }
  }, [video.current]);

  useEffect(() => {
    console.log('any change');
  });

  return (
    <div
      className="bg-dark-200 m-3 relative"
      style={{
        width: '576px',
        height: '280px'
      }}
      id={peerId}
    >
      {camera ? (
        <video id={peerId} autoPlay={true} ref={video} className="w-full h-full" muted={!mic}></video>
      ) : (
        <div className="w-full h-full flex flex-col justify-center items-center">
          <div className="w-20 h-20 bg-white rounded-full"></div>
        </div>
      )}

      <div className="absolute right-0 bottom-0 w-full p-5 flex flex-row justify-between items-center">
        <span className="text-light-200 font-bold text-lg">{user?.username || 'unknown user'}</span>
        {!mic ? <AiOutlineAudioMuted size={25} className="text-red-600" /> : null}
      </div>
    </div>
  );
};

export default Video;
