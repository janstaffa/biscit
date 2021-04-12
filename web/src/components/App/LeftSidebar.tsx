import router from 'next/router';
import { useEffect, useState } from 'react';
import { FaSearch, FaUserFriends } from 'react-icons/fa';
import { GoSignOut } from 'react-icons/go';
import { HiUserGroup } from 'react-icons/hi';
import { MdSettings } from 'react-icons/md';
import { currentUrl } from '../../constants';
import { useLogoutMutation, useMeQuery } from '../../generated/graphql';
import { useAuthStore } from '../../stores/useAuthStore';
import { errorToast } from '../../utils/toasts';
import TabButton from './Sidebar/TabButton';
import ThreadButton from './Sidebar/ThreadButton';
export interface LeftSidebarProps {}

const LeftSidebar: React.FC<LeftSidebarProps> = () => {
  const [currentPath, setCurrentPath] = useState<string>();

  useEffect(() => {
    setCurrentPath(currentUrl()?.pathname);
  }, [currentUrl()]);

  const { mutate: logout } = useLogoutMutation({
    onError: (err) => {
      console.error(err);
      errorToast('Something went wrong, please try again later.');
    },
  });
  const { data: meData } = useMeQuery();

  return (
    <div className="h-full w-96 bg-dark-200 border-r-2 border-dark-50 relative flex flex-col">
      <div className="flex-col w-full h-auto border-b-2 border-dark-50 px-10 py-5">
        <TabButton active={currentPath === '/app/friends'} href="/app/friends">
          <FaUserFriends className="mr-4" />
          Friends
        </TabButton>
        <TabButton active={currentPath === '/app/threads'} href="/app/threads">
          <HiUserGroup className="mr-4" />
          Threads
        </TabButton>
      </div>

      <div className="h-20 w-full px-5 flex flex-col justify-center border-b border-dark-50">
        <div className="w-full h-9 flex flex-row">
          <input
            type="text"
            id="thread-search"
            className="w-full bg-dark-50 outline-none text-light-200 rounded-tl-xl rounded-bl-xl px-3"
          />
          <div
            className="w-10 flex flex-col justify-center items-center bg-dark-50 text-light-200 rounded-tr-xl rounded-br-xl"
            onClick={() => document.getElementById('thread-search')?.focus()}
          >
            <FaSearch />
          </div>
        </div>
      </div>
      <div className="h-full flex flex-col">
        <div className="flex-1 flex flex-col relative">
          <div
            className="flex-1 h-full w-full overflow-y-scroll absolute"
            style={{
              maxHeight: 'calc(100% - 96px)',
            }}
          >
            <ThreadButton
              username="janstaffa"
              time="10:00"
              latestMessage="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
              undread={true}
            />
            <ThreadButton
              username="janstaffa"
              time="10:00"
              latestMessage="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
              undread={true}
            />
            <ThreadButton
              username="janstaffa"
              time="10:00"
              latestMessage="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
              undread={true}
            />
            <ThreadButton
              username="janstaffa"
              time="10:00"
              latestMessage="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
              undread={true}
            />
            <ThreadButton
              username="janstaffa"
              time="10:00"
              latestMessage="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
              undread={true}
            />
            <ThreadButton
              username="janstaffa"
              time="10:00"
              latestMessage="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
              undread={true}
            />
            <ThreadButton
              username="janstaffa"
              time="10:00"
              latestMessage="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
              undread={true}
            />
            <ThreadButton
              username="janstaffa"
              time="10:00"
              latestMessage="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
              undread={true}
            />
            <ThreadButton
              username="janstaffa"
              time="10:00"
              latestMessage="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
              undread={true}
            />
            <ThreadButton
              username="janstaffa"
              time="10:00"
              latestMessage="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
              undread={true}
            />
            <ThreadButton
              username="janstaffa"
              time="10:00"
              latestMessage="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
              undread={true}
            />
          </div>
        </div>
        <div className="absolute w-full h-24 bg-dark-300 bottom-0">
          <div className="w-full h-full flex flex-row items-center">
            <div className="w-16 h-full flex flex-col justify-center items-center">
              <div className="w-12 h-12 rounded-full bg-light"></div>
            </div>
            <div className="w-full flex-1 px-2">
              <div className="flex flex-row justify-between items-center">
                <div className="flex flex-col">
                  <div className=" text-light font-roboto">
                    {meData?.me?.username}
                  </div>
                  <div className="text-light-300 w-48 font-roboto text-sm truncate">
                    {meData?.me?.bio || 'add a status'}
                  </div>
                </div>
                <div className="flex flex-row text-light-300 text-2xl px-2 cursor-pointer ">
                  <GoSignOut
                    className="hover:text-light-200 mx-1"
                    onClick={() => {
                      const { setAuthenticated } = useAuthStore.getState();
                      setAuthenticated(false);
                      logout(
                        {},
                        {
                          onSuccess: (data) => {
                            if (data.UserLogout) {
                              router.replace('/');
                            } else {
                              errorToast(
                                'Something went wrong, please try again later.'
                              );
                            }
                          },
                        }
                      );
                    }}
                  />
                  <MdSettings className="hover:text-light-200 mx-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar;
