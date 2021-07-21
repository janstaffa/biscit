import React, { useEffect, useRef } from 'react';
import { AiOutlineAudioMuted } from 'react-icons/ai';
import { profilepApiURL } from '../../../constants';
import { ThreadSnippetFragment } from '../../../generated/graphql';
import ProfilePicture from '../ProfilePicture';

interface VideoProps {
  isMe: boolean;
  peerId: string;
  userId: string;
  stream: MediaStream;
  mic: boolean;
  camera: boolean;
  screenShare: boolean;
  volume: number;
  isDeafened: boolean;
  thread: ThreadSnippetFragment;
}
const Video: React.FC<VideoProps> = ({
  stream,
  peerId,
  mic = true,
  camera = true,
  screenShare,
  userId,
  isMe,
  volume,
  isDeafened,
  thread
}) => {
  const video = useRef<HTMLVideoElement | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (video.current) {
      video.current.srcObject = stream;
    }
    if (audio.current) {
      audio.current.srcObject = stream;
      audio.current.volume = volume / 100;
    }
  });

  const thisUser = thread.members.find((member) => member.userId === userId);

  const profilePictureId = thisUser?.user.profile_picture?.id;
  const profilePictureSrc = profilePictureId && profilepApiURL + '/' + profilePictureId;
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
          <ProfilePicture size={120} src={profilePictureSrc} />
        </div>
      )}
      {/* <audio autoPlay={true} ref={audio} muted={isMe || !mic || isDeafened} className="hidden"></audio> */}
      <div className="absolute right-0 bottom-0 bg-dark-100 w-full px-5 py-2 flex flex-row justify-between items-center rounded-b-md">
        <span className="text-light-200 font-bold text-lg">
          {thisUser?.user.username || 'unknown user'}
          {isMe ? ' (you)' : ''}
        </span>
        {!mic ? <AiOutlineAudioMuted size={25} className="text-red-600" /> : null}
      </div>
    </div>
  );
};

export default React.memo(Video);
