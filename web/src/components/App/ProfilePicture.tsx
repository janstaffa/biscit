import { MouseEvent } from 'react';
import { FaUser } from 'react-icons/fa';
export interface ProfilePictureProps {
  size: number;
  src?: string;
  online?: boolean;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  className?: string;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({ src, size, online, onClick, className }) => {
  return (
    <div
      className={
        'rounded-full bg-light-400 flex flex-col justify-center items-center relative' + (' ' + className || '')
      }
      style={{ width: size + 'px', height: size + 'px' }}
      onClick={(e) => onClick?.(e)}
    >
      {online !== null && online !== undefined && (
        <div
          className="w-3 h-3 absolute bottom-0 right-0 rounded-full"
          style={{ backgroundColor: online ? '#61e632' : '#ea830c' }}
        ></div>
      )}
      {src ? (
        <img src={src || ''} className="w-full h-full rounded-full" />
      ) : (
        <FaUser size={(size / 100) * 50} className="text-dark-300" />
      )}
    </div>
  );
};

export default ProfilePicture;
