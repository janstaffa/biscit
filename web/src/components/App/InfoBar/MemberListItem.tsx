import React from 'react';
import { BsFillPersonPlusFill } from 'react-icons/bs';
import { HiDotsVertical } from 'react-icons/hi';
import { ImCross } from 'react-icons/im';
import { Popup } from 'react-tiny-modals';
import { MeQuery, ThreadMembers, ThreadQuery, ThreadsQuery } from '../../../generated/graphql';
import { formatTime } from '../../../utils/formatTime';

export interface MemberListItemProps {
  member: ThreadMembers;
  me: MeQuery;
  myThreads: ThreadsQuery | undefined;
  thread: ThreadQuery | undefined;
}

const MemberListItem: React.FC<MemberListItemProps> = ({ member, me, myThreads, thread }) => {
  const { user } = member;
  const friends = me.me?.friends;
  const isFriend = !!friends?.find((friend) => friend.friend.id === user.id);

  const threads = myThreads?.threads;
  const isAdmin = threads?.find((t) => t.threadId === thread?.thread.data?.id)?.isAdmin;

  return (
    <li className="list-none">
      <div className="py-1 px-2 rounded-sm flex flex-row items-center hover:bg-dark-100 hover:text-light-hover">
        <div className="w-full h-14 flex flex-row items-center py-2">
          <div className="w-9 h-full flex flex-col justify-center items-center">
            <div className="w-9 h-9 rounded-full bg-light"></div>
          </div>
          <div className="w-full flex-1 px-2">
            <div className="flex flex-col">
              <div className="flex flex-row justify-between items-center">
                <div className=" text-light font-roboto">{user.username}</div>
                <div className="flex flex-row items-center">
                  <Popup
                    position={['left', 'bottom', 'top', 'right']}
                    onClickOutside={({ setShow }) => setShow(false)}
                    content={() => (
                      <div className="w-auto h-auto bg-dark-200 cursor-default select-none rounded-md p-3">
                        <div className="w-56">
                          <ul>
                            <li className="text-light-300 text-sm font-opensans text-left px-2 py-1 font-bold">
                              {user.username}
                            </li>
                            <li className="text-light-300 text-sm font-opensans text-left px-2 py-1">
                              Member since {formatTime(member.createdAt, { fullDate: true })}
                            </li>
                            {!isFriend && me.me?.id !== user.id && (
                              <li
                                className="text-lime-100 font-opensans p-2 hover:bg-dark-100 cursor-pointer flex flex-row items-center"
                                onClick={() => {}}
                              >
                                <BsFillPersonPlusFill size={20} style={{ marginRight: '5px' }} />
                                Add friend
                              </li>
                            )}
                            {isAdmin && me.me?.id !== user.id && (
                              <li
                                className="text-red-600 font-opensans p-2 hover:bg-dark-100 cursor-pointer flex flex-row items-center"
                                onClick={() => {}}
                              >
                                <ImCross size={18} style={{ marginRight: '5px' }} />
                                Remove from thread
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    )}
                  >
                    {({ show, setShow }) => (
                      <div>
                        <HiDotsVertical
                          className="text-light-300 text-2xl hover:text-light-200 cursor-pointer"
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
      </div>
    </li>
  );
};

export default MemberListItem;
