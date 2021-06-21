import { useEffect, useRef } from 'react';

interface VideoProps {
  peerId: string;
  stream: MediaStream;
}
const Video: React.FC<VideoProps> = ({ stream, peerId }) => {
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
      <video autoPlay={true} ref={video} className="w-full h-full"></video>
    </div>
  );
};

export default Video;
