import { useEffect, useRef } from 'react';

interface VideoProps {
  peerId: string;
  stream: MediaStream;
  mic: boolean;
  camera: boolean;
}
const Video: React.FC<VideoProps> = ({ stream, peerId, mic = true, camera }) => {
  const video = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (video.current) {
      video.current.srcObject = stream;
    }
  }, [video.current]);
  return (
    <div
      className="bg-dark-200 m-3"
      style={{
        width: '576px',
        height: '324px'
      }}
      id={peerId}
    >
      {camera ? (
        <video autoPlay={true} ref={video} className="w-full h-full" muted={!mic}></video>
      ) : (
        <div className="w-full h-full flex flex-col justify-center items-center">
          <div className="w-20 h-20 bg-white rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default Video;
