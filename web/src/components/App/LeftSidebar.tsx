import router from 'next/router';
import { useEffect, useState } from 'react';
import { FaSearch, FaUserFriends } from 'react-icons/fa';
import { GoSignOut } from 'react-icons/go';
import { HiUserGroup } from 'react-icons/hi';
import { IoMdClose } from 'react-icons/io';
import { MdSettings } from 'react-icons/md';
import { currentUrl, genericErrorMessage } from '../../constants';
import {
  useLogoutMutation,
  useMeQuery,
  useUpdateStatusMutation,
} from '../../generated/graphql';
import { useAuth } from '../../providers/AuthProvider';
import { queryClient } from '../../utils/createQueryClient';
import { formatTime } from '../../utils/formatTime';
import { errorToast, successToast } from '../../utils/toasts';
import SubmitButton from '../Buttons/SubmitButton';
import Modal from '../modals/Modal';
import TabButton from './Sidebar/TabButton';
import ThreadButton from './Sidebar/ThreadButton';

const LeftSidebar: React.FC = () => {
  const { setAuthenticated } = useAuth();
  const [modalShow, setModalShow] = useState<boolean>(false);
  const [statusInput, setStatusInput] = useState<string>('');
  const [currentPath, setCurrentPath] = useState<string>();

  useEffect(() => {
    setCurrentPath(currentUrl()?.pathname);
  }, [currentUrl()]);

  const { mutate: logout } = useLogoutMutation({
    onError: (err) => {
      console.error(err);
      errorToast(genericErrorMessage);
    },
  });

  const { mutate: updateStatus } = useUpdateStatusMutation({
    onError: (err) => {
      console.error(err);
      errorToast(genericErrorMessage);
    },
  });
  const { data: meData, isLoading } = useMeQuery();

  useEffect(() => {
    if (meData?.me?.bio) setStatusInput(meData?.me?.bio);
  }, [meData?.me?.bio]);

  return (
    <>
      <div className="h-full w-96 bg-dark-200 border-r-2 border-dark-50 relative flex flex-col">
        <div className="flex-col w-full h-auto border-b-2 border-dark-50 px-10 py-5">
          <TabButton
            active={currentPath?.includes('/app/friends')}
            href="/app/friends"
          >
            <FaUserFriends className="mr-4" />
            Friends
          </TabButton>
          <TabButton
            active={currentPath?.includes('/app/threads')}
            href="/app/threads"
          >
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
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
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
              {meData?.me?.threads?.map((membership) => (
                <ThreadButton
                  username={membership.thread.name}
                  time={formatTime(membership.thread.lastActivity)}
                  latestMessage="test"
                  undread={membership.unread > 0}
                />
              ))}
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
                    <div
                      className="w-48 font-roboto text-sm truncate cursor-pointer text-light-300 hover:text-light-200"
                      onClick={() => setModalShow(true)}
                    >
                      {meData?.me?.bio || 'add a status'}
                    </div>
                  </div>
                  <div className="flex flex-row text-light-300 text-2xl px-2 cursor-pointer ">
                    <GoSignOut
                      className="hover:text-light-200 mx-1"
                      onClick={() => {
                        logout(
                          {},
                          {
                            onSuccess: (data) => {
                              if (data.UserLogout) {
                                setAuthenticated(false);
                                router.replace('/');
                              } else {
                                errorToast(genericErrorMessage);
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
      <Modal active={modalShow}>
        <div className="w-full h-10 flex flex-row justify-between">
          <div className="text-light-300 text-lg font-roboto">
            Change status
          </div>
          <div>
            <IoMdClose
              className="text-2xl text-light-300 hover:text-light cursor-pointer"
              onClick={() => setModalShow(false)}
            />
          </div>
        </div>
        <div className="w-full flex-grow">
          <input
            type="text"
            className="w-full h-9 rounded-md bg-dark-100 focus:bg-dark-50 outline-none px-3 text-light-200"
            placeholder="tired but happy"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            maxLength={100}
            value={statusInput}
            onChange={(e) => setStatusInput(e.target.value)}
          />
          <p className="text-light-300 mt-1 text-sm">max 100 characters</p>
          <div className="w-full flex flex-row justify-end mt-6">
            <button
              className="px-6 py-1.5 bg-transparent text-light-200 hover:text-light-300  rounded-md font-bold mt-2"
              onClick={() => setModalShow(false)}
            >
              Cancel
            </button>
            <SubmitButton
              onClick={async () => {
                await updateStatus(
                  { options: { status: statusInput } },
                  {
                    onSuccess: (data) => {
                      setModalShow(false);
                      queryClient.invalidateQueries('Me');

                      if (data.UserUpdateStatus) {
                        successToast('Your status was changed.');
                      } else {
                        errorToast(genericErrorMessage);
                      }
                    },
                  }
                );
              }}
            >
              Save
            </SubmitButton>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default LeftSidebar;
