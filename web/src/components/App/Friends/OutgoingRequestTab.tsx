import React from 'react';
import { FaRegTimesCircle } from 'react-icons/fa';
import { FriendRequest, User } from '../../../generated/graphql';
export interface OutgoingRequestTabProps {
  requestId: string;
  request: Pick<FriendRequest, 'id' | 'createdAt'> & {
    reciever: Pick<User, 'id' | 'username' | 'email' | 'status' | 'bio'>;
  };
}

const OutgoingRequestTab: React.FC<OutgoingRequestTabProps> = ({
  requestId,
  request: { id, reciever, createdAt },
}) => {
  return (
    <div className="w-full h-16 bg-dark-100 hover:bg-dark-50">
      <div className="w-full h-full flex flex-row items-center cursor-pointer py-2">
        <div className="w-16 h-full flex flex-col justify-center items-center">
          <div className="w-11 h-11 rounded-full bg-light"></div>
        </div>
        <div className="w-full flex-1 px-2">
          <div className="flex flex-row w-full justify-between">
            <div className="flex flex-col justify-center items-start">
              <div className=" text-light font-roboto">{reciever.username}</div>
              <div className="text-light-300 w-full font-roboto text-sm truncate">
                {reciever.bio || reciever.status}
              </div>
            </div>
            <div className="flex flex-row items-center">
              <FaRegTimesCircle
                className="text-red-500 text-3xl mx-2 hover:text-red-400"
                title="Cancel"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutgoingRequestTab;
