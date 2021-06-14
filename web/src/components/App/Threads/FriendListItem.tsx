import { useState } from 'react';
import { User } from '../../../generated/graphql';

export interface FriendListItemProps {
  friend: Pick<User, 'id' | 'createdAt' | 'updatedAt' | 'username' | 'email' | 'status' | 'bio'>;
  onChecked?: (value: boolean) => void;
}

const FriendListItem: React.FC<FriendListItemProps> = ({ friend, onChecked }) => {
  const [checked, setChecked] = useState<boolean>(false);
  return (
    <li
      className="list-none"
      onClick={(e) => {
        onChecked?.(!checked);
        setChecked(!checked);
      }}
    >
      <div className="py-1 rounded-sm flex flex-row items-center hover:bg-dark-100 hover:text-light-hover">
        <div className="w-8 h-full flex flex-col justify-center items-center">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
        </div>
        <div className="w-full h-14 flex flex-row items-center cursor-pointer py-2">
          <div className="w-9 h-full flex flex-col justify-center items-center">
            <div className="w-9 h-9 rounded-full bg-light"></div>
          </div>
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
