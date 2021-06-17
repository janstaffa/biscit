import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { FaSearch, FaUserFriends } from 'react-icons/fa';
import { GoSignOut } from 'react-icons/go';
import { HiUserGroup } from 'react-icons/hi';
import { IoMdClose } from 'react-icons/io';
import { MdSettings } from 'react-icons/md';
import { VscSearchStop } from 'react-icons/vsc';
import ClipLoader from 'react-spinners/ClipLoader';
import { Modal } from 'react-tiny-modals';
import { IncomingDeleteMessage, IncomingSocketChatMessage, IncomingUpdateMessage, SocketThreadMessage } from '../..';
import { currentUrl, genericErrorMessage, profilepApiURL } from '../../constants';
import {
  MeQuery,
  Message,
  ThreadMembers,
  ThreadSnippetFragment,
  useLogoutMutation,
  useMeQuery,
  useReadMessagesMutation,
  useThreadsQuery,
  useUpdateStatusMutation
} from '../../generated/graphql';
import { useAuth } from '../../providers/AuthProvider';
import { useTokenStore } from '../../stores/useTokenStore';
import { queryClient } from '../../utils/createQueryClient';
import { socket } from '../../utils/createWSconnection';
import { isServer } from '../../utils/isServer';
import { errorToast, successToast } from '../../utils/toasts';
import SubmitButton from '../Buttons/SubmitButton';
import ProfilePicture from './ProfilePicture';
import TabButton from './Sidebar/TabButton';
import ThreadButton from './Sidebar/ThreadButton';

const LeftSidebar: React.FC = () => {
  const router = useRouter();
  const threadId = typeof router.query.id === 'object' ? router.query.id[0] : router.query.id || '';

  const { setAuthenticated } = useAuth();
  const { setToken } = useTokenStore();
  const [modalShow, setModalShow] = useState<boolean>(false);
  const [statusInput, setStatusInput] = useState<string>('');
  const [currentPath, setCurrentPath] = useState<string>();
  const [threadList, setThreadList] = useState<
    Array<
      {
        __typename?: 'ThreadMembers';
      } & Pick<ThreadMembers, 'isAdmin' | 'threadId' | 'unread'> & {
          thread: {
            __typename?: 'Thread';
          } & ThreadSnippetFragment;
        }
    >
  >([]);

  const threadListRef = useRef<typeof threadList>([]);
  threadListRef.current = threadList;

  useEffect(() => {
    setCurrentPath(currentUrl()?.pathname);
  }, [currentUrl()]);

  const { mutate: logout } = useLogoutMutation();

  const { mutate: updateStatus } = useUpdateStatusMutation();

  const { mutate: readMessages } = useReadMessagesMutation();
  const { data: meData } = useMeQuery();
  const meDataRef = useRef<MeQuery | undefined>();
  meDataRef.current = meData;
  const { data: loadedThreads, isFetched, isLoading, isFetching } = useThreadsQuery();
  const [threadSearchQuery, setThreadSearchQuery] = useState<string | null>(null);

  useEffect(() => {
    if (loadedThreads) {
      if (threadSearchQuery) {
        const oldThreadList = [...loadedThreads.threads];
        const newThreadList = oldThreadList.filter((thread) => {
          return thread.thread.name?.toLowerCase().includes(threadSearchQuery.toLowerCase());
        });

        setThreadList(newThreadList);
      } else {
        setThreadList(loadedThreads.threads);
      }
    }
  }, [threadSearchQuery]);
  useEffect(() => {
    const ws = socket.connect();
    const handleMessage = (e) => {
      const { data: m } = e;
      const incoming = JSON.parse(m);
      if (incoming.code === 3000) {
        const { message } = incoming as IncomingSocketChatMessage;

        const threads = [...threadListRef.current];
        const thisThread = threads.find((thread) => {
          if (thread.threadId === (message as Message).threadId) return true;
          return false;
        });
        if (thisThread) {
          threads.splice(threads.indexOf(thisThread), 1);
          if (
            thisThread.threadId !== threadId &&
            (message as Message).userId !== meDataRef.current?.me?.id &&
            meDataRef.current?.me?.setAsUnread
          ) {
            thisThread.unread++;
          }
          thisThread.thread.lastMessage = message as Message;
          thisThread.thread.lastActivity = (message as Message).createdAt;
          threads.unshift(thisThread);
          setThreadList(threads);
        }
        if ((message as Message).userId === meData?.me?.id) {
          readMessages({ options: { threadId: threadId } });
        }
      } else if (incoming.code === 3007) {
        const { messageId, threadId: incomingThreadId } = incoming as IncomingDeleteMessage;
        threadListRef.current.forEach((thread) => {
          if (thread.thread.lastMessage?.id === messageId) {
            queryClient.invalidateQueries('Threads');
          }
        });
      } else if (incoming.code === 3008) {
        const { messageId, threadId: incomingThreadId, newContent } = incoming as IncomingUpdateMessage;
        const newThreadList = threadListRef.current.map((thread) => {
          if (thread.thread.lastMessage?.id === messageId) {
            return {
              ...thread,
              thread: {
                ...thread.thread,
                lastMessage: {
                  ...thread.thread.lastMessage,
                  content: newContent
                }
              }
            };
          }
          return thread;
        });
        setThreadList(newThreadList);
      }
    };

    if (!isServer() && ws) {
      try {
        ws.addEventListener('message', handleMessage);
      } catch (err) {
        console.error(err);
      }

      return () => {
        ws.removeEventListener('message', handleMessage);
      };
    }
  }, [threadId]);

  useEffect(() => {
    const ws = socket.connect();
    if (isServer() || !ws) return;

    const handleMessage = async (e) => {
      const { data: m } = e;
      const incoming = JSON.parse(m);

      if (incoming.code === 3009) {
        queryClient.invalidateQueries('Threads');
        queryClient.invalidateQueries([
          'Thread',
          { options: { threadId: (incoming as SocketThreadMessage).threadId } }
        ]);
      }
    };
    ws.addEventListener('message', handleMessage as (e) => void);
    return () => {
      ws.removeEventListener('message', handleMessage as (e) => void);
    };
  }, [isFetched]);

  useEffect(() => {
    if (!isLoading && meData && meData?.me) {
      if (loadedThreads) setThreadList(loadedThreads.threads);
      if (meData?.me?.bio) setStatusInput(meData?.me?.bio);
    }
  }, [isLoading, meData, loadedThreads]);

  const profilePictureId = meData?.me?.profile_picture?.id;
  const profilePictureSrc = profilePictureId && profilepApiURL + '/' + profilePictureId;
  return (
    <>
      <div className="h-full w-96 bg-dark-200 border-r-2 border-dark-50 relative flex flex-col">
        <div className="flex-col w-full h-auto border-b-2 border-dark-50 px-10 py-5">
          <TabButton active={currentPath?.includes('/app/friends')} href="/app/friends">
            <FaUserFriends className="mr-4" />
            Friends
          </TabButton>
          <TabButton active={currentPath?.includes('/app/threads')} href="/app/threads">
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
              onChange={(e) => setThreadSearchQuery(e.target.value)}
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
                maxHeight: 'calc(100% - 96px)'
              }}
            >
              {isLoading || isFetching ? (
                <div className="flex flex-col items-center w-full h-full pt-5">
                  <ClipLoader color="#e09f3e" size={25} />
                </div>
              ) : threadList.length > 0 ? (
                threadList.map((membership, i) => {
                  if (router.query.id === membership.threadId) {
                    threadList[i].unread = 0;
                  }
                  return (
                    <ThreadButton
                      thread={membership.thread}
                      threadId={membership.threadId}
                      unread={membership.unread > 0}
                      active={membership.threadId === threadId}
                      key={membership.threadId}
                    />
                  );
                })
              ) : threadSearchQuery ? (
                <div className="text-light-300 flex flex-col items-center pt-10 text-center">
                  <VscSearchStop size={40} />
                  <div className="mt-1">No threads match your search.</div>
                </div>
              ) : (
                <div className="text-light-300 flex flex-col items-center pt-10 text-center">
                  <VscSearchStop size={40} />
                  <div className="mt-1">
                    You arent a member of any threads, create a thread or add a friend to start chatting.
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="absolute w-full h-24 bg-dark-300 bottom-0">
            <div className="w-full h-full flex flex-row items-center">
              <div className="w-16 h-full flex flex-col justify-center items-center">
                <ProfilePicture
                  online={meData?.me?.status === 'online'}
                  size="48px"
                  src={profilePictureSrc}
                  className="cursor-pointer"
                  onClick={() => router.push('/app/settings')}
                />
              </div>
              <div className="w-full flex-1 px-2">
                <div className="flex flex-row justify-between items-center">
                  <div className="flex flex-col">
                    <div className=" text-light font-roboto">
                      {meData?.me?.username}
                      <span className="text-light-400 ml-1 text-sm">#{meData?.me?.tag}</span>
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
                      title="Sign out."
                      onClick={() => {
                        logout(
                          {},
                          {
                            onSuccess: (data) => {
                              if (data.UserLogout) {
                                setAuthenticated(false);
                                queryClient.removeQueries();
                                socket.close();
                                setToken(null);
                                router.replace('/');
                              } else {
                                errorToast(genericErrorMessage);
                              }
                            }
                          }
                        );
                      }}
                    />
                    <Link href="/app/settings">
                      <>
                        <MdSettings className="hover:text-light-200 mx-1" title="Settings" />
                      </>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal isOpen={modalShow} backOpacity={0.5} onOpen={() => setStatusInput(meData?.me?.bio || '')}>
        <div className="bg-dark-200 p-5 rounded-xl w-96">
          <div className="w-full h-10 flex flex-row justify-between">
            <div className="text-light-300 text-lg font-roboto">Change status</div>
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
                      }
                    }
                  );
                }}
              >
                Save
              </SubmitButton>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default React.memo(LeftSidebar);
