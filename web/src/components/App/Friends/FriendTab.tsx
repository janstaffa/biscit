import React, { useContext } from 'react';
import { BiMessageAltDetail } from 'react-icons/bi';
import { BsFillPersonDashFill } from 'react-icons/bs';
import { HiDotsVertical } from 'react-icons/hi';
import { IoMdCall } from 'react-icons/io';
import { useHistory } from 'react-router-dom';
import { Popup } from 'react-tiny-modals';
import { genericErrorMessage, profilepApiURL } from '../../../constants';
import { Friend, useRemoveFriendMutation } from '../../../generated/graphql';
import { queryClient } from '../../../utils/createQueryClient';
import { formatTime } from '../../../utils/formatTime';
import { RTCcontext } from '../../../utils/RTCProvider';
import { errorToast } from '../../../utils/toasts';
import ProfilePicture from '../ProfilePicture';

export interface FriendTabProps {
  friend: Friend;
}

const FriendTab: React.FC<FriendTabProps> = ({ friend: friendship, friend: { friend } }) => {
  const history = useHistory();

  const { mutate: removeFriend } = useRemoveFriendMutation({
    onSuccess: (data) => {
      if (!data.FriendRemove.data) {
        errorToast(genericErrorMessage);
      }
      queryClient.invalidateQueries('Me');
      queryClient.invalidateQueries('Threads');
    }
  });

  const profilePictureId = friend.profile_picture?.id;
  const profilePictureSrc = profilePictureId && profilepApiURL + '/' + profilePictureId;

  const rtcContext = useContext(RTCcontext);

  return (
    <div
      className="w-full h-16 bg-dark-100 hover:bg-dark-50"
      onClick={() => history.push(`/app/chat/${friendship.threadId}`)}
    >
      <div className="w-full h-full flex flex-row items-center cursor-pointer py-2">
        <div className="w-16 h-full flex flex-col justify-center items-center">
          <ProfilePicture online={friend.status === 'online'} size={44} src={profilePictureSrc} />
        </div>
        <div className="w-full flex-1 px-2">
          <div className="flex flex-row w-full justify-between">
            <div className="flex flex-col justify-center items-start">
              <div className=" text-light font-roboto">
                {friend.username} <span className="text-light-400 text-sm">#{friend.tag}</span>
              </div>
              <div className="text-light-300 w-full font-roboto text-sm truncate">{friend.bio || friend.status}</div>
            </div>
            <div className="flex flex-row items-center">
              <BiMessageAltDetail
                className="text-light-300 text-2xl mx-2 hover:text-light-200"
                title="Message"
                onClick={() => history.push(`/app/chat/${friendship.threadId}`)}
              />
              <IoMdCall
                className="text-light-300 text-2xl mx-2 hover:text-light-200"
                title="Call"
                onClick={() => {
                  rtcContext?.createCall(friendship.threadId);
                }}
              />
              <Popup
                position={['left', 'bottom', 'top', 'right']}
                onClickOutside={({ setShow }) => setShow(false)}
                content={() => (
                  <div className="w-auto h-auto bg-dark-300 cursor-default select-none rounded-md p-3">
                    <div className="w-52">
                      <ul>
                        <li className="text-light-300 text-sm font-opensans text-left px-2 py-1">
                          Friends since {formatTime(friendship.createdAt, { fullDate: true })}
                        </li>
                        <hr className="bg-dark-50 h-px border-none" />

                        <li
                          className="text-red-600 font-opensans text-center p-2 hover:bg-dark-200 cursor-pointer flex flex-row items-center"
                          onClick={() => {
                            removeFriend({ options: { friendId: friendship.key } });
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
