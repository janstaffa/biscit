import { Dispatch, SetStateAction, useState } from 'react';
import { profilepApiURL } from '../../../constants';
import { UserSnippetFragment } from '../../../generated/graphql';
import ProfilePicture from '../ProfilePicture';

export interface FriendListItemProps {
  friend: UserSnippetFragment;
  onChecked?: (value: boolean, setChecked: Dispatch<SetStateAction<boolean>>) => void;
}

const FriendListItem: React.FC<FriendListItemProps> = ({ friend, onChecked }) => {
  const [checked, setChecked] = useState<boolean>(false);

  const profilePictureId = friend.profile_picture?.id;
  const profilePictureSrc = profilePictureId && profilepApiURL + '/' + profilePictureId;
  return (
    <li
      className="list-none"
      onClick={(e) => {
        onChecked?.(!checked, setChecked);
        setChecked(!checked);
      }}
    >
      <div className="py-1 rounded-sm flex flex-row items-center hover:bg-dark-100 hover:text-light-hover">
        <div className="w-8 h-full flex flex-col justify-center items-center">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
        </div>
        <div className="w-full h-14 flex flex-row items-center cursor-pointer py-2">
          <ProfilePicture src={profilePictureSrc} size={35} />
          <div className="w-full flex-1 px-2">
            <div className="flex flex-col">
              <div className="flex flex-row justify-between items-center">
                <div className=" text-light font-roboto">{friend.username}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

export default FriendListItem;
