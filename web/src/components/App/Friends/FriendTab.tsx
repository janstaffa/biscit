import { useRouter } from 'next/router';
import React from 'react';
import { BiMessageAltDetail } from 'react-icons/bi';
import { BsFillPersonDashFill } from 'react-icons/bs';
import { HiDotsVertical } from 'react-icons/hi';
import { IoMdCall } from 'react-icons/io';
import { Popup } from 'react-tiny-modals';
import { genericErrorMessage } from '../../../constants';
import { User, useRemoveFriendMutation } from '../../../generated/graphql';
import { queryClient } from '../../../utils/createQueryClient';
import { errorToast } from '../../../utils/toasts';
export interface FriendTabProps {
  friendId: string;
  friend: Pick<User, 'id' | 'username' | 'email' | 'status' | 'bio'>;
  threadId: string;
}

const FriendTab: React.FC<FriendTabProps> = ({ friendId, friend: { username, bio, status }, threadId }) => {
  const router = useRouter();
  const { mutate: removeFriend } = useRemoveFriendMutation({
    onSuccess: (data) => {
      if (!data.FriendRemove.data) {
        errorToast(genericErrorMessage);
      }
      queryClient.invalidateQueries('Me');
    },
    onError: (err) => {
      console.error(err);
      errorToast(genericErrorMessage);
    }
  });

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
              <div className="text-light-300 w-full font-roboto text-sm truncate">{bio || status}</div>
            </div>
            <div className="flex flex-row items-center">
              <BiMessageAltDetail
                className="text-light-300 text-2xl mx-2 hover:text-light-200"
                title="Message"
                onClick={() => router.push(`/app/chat/${threadId}`)}
              />
              <IoMdCall className="text-light-300 text-2xl mx-2 hover:text-light-200" title="Call" />
              <Popup
                position={['left', 'bottom', 'top', 'right']}
                onClickOutside={({ setShow }) => setShow(false)}
                content={() => (
                  <div className="w-auto h-auto bg-dark-300 cursor-default select-none rounded-md p-3">
                    <div className="w-44">
                      <ul>
                        <li
                          className="text-red-600 font-opensans text-center p-2 hover:bg-dark-200 cursor-pointer flex flex-row items-center"
                          onClick={() => {
                            removeFriend({ options: { friendId } });
                          }}
                        >
                          <BsFillPersonDashFill size={20} style={{ marginRight: '5px' }} />
                          Remove friend
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              >
                {({ show, setShow }) => (
                  <div>
                    <HiDotsVertical
                      className="text-light-300 text-2xl mx-2 hover:text-light-200"
                      title="Options"
                      onClick={() => setShow(!show)}
                    />
                  </div>
                )}
              </Popup>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendTab;
