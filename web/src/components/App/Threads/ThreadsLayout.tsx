import { useRouter } from 'next/router';
import React, { ReactNode, useEffect, useState } from 'react';
import { FaUserFriends } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';
import { Modal } from 'react-tiny-modals';
import { currentUrl, genericErrorMessage } from '../../../constants';
import { useCreateThreadMutation, useMeQuery, User } from '../../../generated/graphql';
import { queryClient } from '../../../utils/createQueryClient';
import { errorToast, successToast } from '../../../utils/toasts';
import NavLink from '../../Buttons/NavLink';
import SubmitButton from '../../Buttons/SubmitButton';
import ContentNav from '../ContentNav';
import Layout from '../Layout';
import FriendListItem from './FriendListItem';
export interface ThreadsLayoutProps {
  children: ReactNode;
}

const ThreadsLayout: React.FC<ThreadsLayoutProps> = ({ children }) => {
  const router = useRouter();
  const [currentPath, setCurrentPath] = useState<string>();

  const { mutate: createThread } = useCreateThreadMutation({
    onError: (err) => {
      console.error(err);
      errorToast(genericErrorMessage);
    }
  });
  useEffect(() => {
    setCurrentPath(currentUrl()?.pathname);
  }, [currentUrl()]);

  const { data: meData, isLoading } = useMeQuery();
  const friends = meData?.me?.friends;

  const [showModal, setShowModal] = useState<boolean>(false);
  const [newThreadMembers, setNewThreadMembers] = useState<string[]>([]);

  const [newThreadName, setNewThreadName] = useState<string>('');
  return (
    <>
      <Layout>
        <ContentNav>
          <div className="flex flex-row items-center h-full select-none">
            <div className="border-r border-light-300 px-4 mr-2">
              <FaUserFriends className="text-light-300 text-2xl" />
            </div>
            <NavLink href="/app/threads/all" active={currentPath === '/app/threads/all'}>
              All
            </NavLink>
            <NavLink href="/app/threads/my" active={currentPath === '/app/threads/my'}>
              My
            </NavLink>
            <div
              className="border-lime-300 border-2 text-lime-200 font-bold mx-2 px-3 rounded-full cursor-pointer ml-5"
              onClick={() => {
                setShowModal(true);
              }}
            >
              Create a thread
            </div>
          </div>
        </ContentNav>
        <div className="w-full h-full overflow-hidden relative">{children} </div>
      </Layout>
      <Modal isOpen={showModal} backOpacity={0.5}>
        <div className="bg-dark-200 p-5 rounded-xl w-96">
          <div className="w-full h-10 flex flex-row justify-between">
            <div className="text-light-300 text-lg font-roboto">Create a thread</div>
            <div>
              <IoMdClose
                className="text-2xl text-light-300 hover:text-light cursor-pointer"
                onClick={() => setShowModal(false)}
              />
            </div>
          </div>
          <div className="w-full flex-grow">
            <div className="my-2">
              <p className="text-light-300 font-opensans text-md mb-3">Thread name</p>
              <input
                type="text"
                className="w-full h-9 rounded-md bg-dark-100 focus:bg-dark-50 outline-none px-3 text-light-200"
                placeholder="my first thread"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                maxLength={100}
                value={newThreadName}
                onChange={(e) => setNewThreadName(e.target.value)}
              />
            </div>
            <div className="mt-4">
              <p className="text-light-300 font-opensans text-md mb-3">Choose members</p>
              <ul className="w-full max-h-72 overflow-auto overflow-x-hidden">
                {!isLoading && friends && friends.length > 0 ? (
                  friends.map((friendship) => {
                    const { friend } = friendship;

                    return (
                      <FriendListItem
                        friend={friend as User}
                        key={friendship.id}
                        onChecked={(checked) => {
                          if (checked) {
                            setNewThreadMembers([...newThreadMembers, friend.id]);
                            return;
                          }
                          const currentResendThreads = [...newThreadMembers];
                          const newResendThreads = currentResendThreads.filter((resendThread) => {
                            if (resendThread === friend.id) return false;
                            return true;
                          });
                          setNewThreadMembers(newResendThreads);
                        }}
                      />
                    );
                  })
                ) : (
                  <div></div>
                )}
              </ul>
            </div>

            <div className="w-full flex flex-row justify-end mt-6">
              <button
                className="px-6 py-1.5 bg-transparent text-light-200 hover:text-light-300  rounded-md font-bold mt-2"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <SubmitButton
                onClick={async () => {
                  if (!newThreadName) {
                    errorToast('Please provide a name for the thread.');
                    return;
                  }
                  await createThread(
                    { options: { threadName: newThreadName, members: newThreadMembers } },
                    {
                      onSuccess: (data) => {
                        if (data.CreateThread.data) {
                          successToast(`New thread ${newThreadName} was created successfully.`);
                          queryClient.refetchQueries({ queryKey: 'Threads' });
                          router.push(`/app/chat/${data.CreateThread.data}`);
                        } else {
                          errorToast(genericErrorMessage);
                        }
                        setShowModal(false);
                      }
                    }
                  );
                }}
              >
                Create
              </SubmitButton>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ThreadsLayout;
