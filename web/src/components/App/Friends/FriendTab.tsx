import React from 'react';
import { BiMessageAltDetail } from 'react-icons/bi';
import { HiDotsVertical } from 'react-icons/hi';
import { IoMdCall } from 'react-icons/io';
export interface FriendTabProps {
  username: string;
  bio: string;
}

const FriendTab: React.FC<FriendTabProps> = ({ username, bio }) => {
  return (
    <div className="w-full h-16 bg-dark-100 hover:bg-dark-50">
      <div className="w-full h-full flex flex-row items-center cursor-pointer py-2">
        <div className="w-16 h-full flex flex-col justify-center items-center">
          <div className="w-11 h-11 rounded-full bg-light"></div>
        </div>
        <div className="w-full flex-1 px-2">
          <div className="flex flex-row w-full justify-between">
            <div className="flex flex-col justify-center items-start">
              <div className=" text-light font-roboto">{username}</div>
              <div className="text-light-300 w-full font-roboto text-sm truncate">
                {bio}
              </div>
            </div>
            <div className="flex flex-row items-center">
              <BiMessageAltDetail
                className="text-light-300 text-2xl mx-2 hover:text-light-200"
                title="Message"
              />
              <IoMdCall
                className="text-light-300 text-2xl mx-2 hover:text-light-200"
                title="Call"
              />
              <HiDotsVertical
                className="text-light-300 text-2xl mx-2 hover:text-light-200"
                title="Options"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendTab;
