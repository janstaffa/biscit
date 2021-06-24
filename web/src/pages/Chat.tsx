import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FaHashtag, FaVideo } from 'react-icons/fa';
import { HiDotsVertical } from 'react-icons/hi';
import { IoMdCall, IoMdClose } from 'react-icons/io';
import { useHistory, useParams } from 'react-router-dom';
import { Modal } from 'react-tiny-modals';
import CallingDialog from '../components/App/Chat/CallingDialog';
import ChatBottomBar from '../components/App/Chat/ChatBottomBar';
import ChatFeed from '../components/App/Chat/ChatFeed';
import ChatInfoBar from '../components/App/Chat/ChatInfoBar';
import ImageGallery from '../components/App/Chat/ImageGallery';
import ThreadListItem from '../components/App/Chat/ThreadListItem';
import VideoChat from '../components/App/Chat/VideoChat';
import ContentNav from '../components/App/ContentNav';
import Layout from '../components/App/Layout';
import FriendListItem from '../components/App/Threads/FriendListItem';
import SubmitButton from '../components/Buttons/SubmitButton';
import EditThreadModal from '../components/Modals/EditThreadModal';
import {
  FileSnippetFragment,
  MessageSnippetFragment,
  ThreadSnippetFragment,
  useAddMembersMutation,
  useCancelCallMutation,
  useCreateCallMutation,
  useJoinCallMutation,
  useMeQuery,
  UserSnippetFragment,
  useThreadQuery,
  useThreadsQuery
} from '../generated/graphql';
import { IncomingCreateCallMessage, OutgoingSocketChatMessage } from '../types';
import { socket } from '../utils/createWSconnection';
import { errorToast, successToast } from '../utils/toasts';

const Chat: React.FC = () => {
  const history = useHistory();
  const { id: threadId } = useParams<{ id: string }>();
  if (!threadId) {
    return null;
  }

  const { data } = useThreadQuery(
    {
      options: { threadId }
    },
    {
      onSuccess: (d) => {
        if (d.thread.errors.length > 0) {
          console.error(d.thread.errors);
          history.replace('/app/friends/all');
        }
      }
    }
  );
  const { mutate: joinCall } = useJoinCallMutation({
    onSuccess: (d) => {
      if (!d.JoinCall.data && d.JoinCall.errors.length > 0) {
        d.JoinCall.errors.forEach((err) => {
          errorToast('bbbbbbbbbbbbbbb' + err.details?.message);
        });
      }
    }
  });
  const { data: meData, isLoading } = useMeQuery();
  const { data: loadedThreads } = useThreadsQuery();

  const { mutate: addMembers } = useAddMembersMutation();
  const { mutate: cancelCallMutate } = useCancelCallMutation();

  const [resendModalShow, setResendModalShow] = useState<boolean>(false);
  const [editModalShow, setEditModalShow] = useState<boolean>(false);
  const [addMemberModalShow, setAddMemberModalShow] = useState<boolean>(false);
  const [toAddMembers, setToAddMembers] = useState<string[]>([]);

  const [resendMessage, setResendMessage] = useState<MessageSnippetFragment | null>(null);
  const [resendThreads, setResendThreads] = useState<string[]>([]);
  const [replyMessage, setReplyMessage] = useState<MessageSnippetFragment | null>(null);

  const handleResend = () => {
    const ws = socket.connect();
    if (resendMessage && ws) {
      if (resendMessage.media?.length === 0 && (!resendMessage.content || !/\S/.test(resendMessage.content))) {
        return;
      }

      resendThreads.forEach((resendThread) => {
        const payload = {
          code: 3000,
          threadId: resendThread,
          content: resendMessage.content,
          media: resendMessage.media?.map((file) => file.id),
          resendId: resendMessage.id
        } as OutgoingSocketChatMessage;
        socket.send(JSON.stringify(payload));
      });
      setResendModalShow(false);
      setResendMessage(null);
      setResendThreads([]);
    }
  };

  useEffect(() => {
    setReplyMessage(null);
  }, [threadId]);

  const [galleryFile, setGalleryFile] = useState<FileSnippetFragment | null>(null);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (galleryFile) {
          setGalleryFile(null);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [galleryFile]);

  const [showChatInfo, setShowChatInfo] = useState<boolean>(false);

  const availableNewThreadMembers = meData?.me?.friends?.filter((friend) => {
    return !data?.thread.data?.members.find((member) => member.userId === friend.friend.id);
  });

  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [callingUser, setCallingUser] = useState<UserSnippetFragment | null>(null);
  const [callingThread, setCallingThread] = useState<ThreadSnippetFragment | null>(null);
  const [callId, setCallId] = useState<string | undefined | null>(null);
  const [isInCall, setIsInCall] = useState<boolean>(false);

  useEffect(() => {
    if (!meData?.me) return;
    const ws = socket.connect();
    const handleMessage = (e) => {
      const { data: m } = e;
      const incoming = JSON.parse(m);

      if (incoming.code === 3010) {
        const { user, thread, callId: cId } = incoming as IncomingCreateCallMessage;
        setIsCalling(true);
        setCallingUser(user);
        setCallingThread(thread);
        setCallId(cId);
      } else if (incoming.code === 3014) {
        setIsInCall(true);
        setIsCalling(false);
      }
    };
    ws?.addEventListener('message', handleMessage);
  }, [meData?.me]);

  const { mutate: createCall } = useCreateCallMutation();

  const ringtone = useRef<HTMLAudioElement>();
  useEffect(() => {
    ringtone.current = new Audio('/ringtone.mp3');
    ringtone.current.loop = true;
  }, []);
  useEffect(() => {
    if (!ringtone.current || !callingUser) return;
    if (isCalling) {
      if (callingUser.id !== meData?.me?.id) {
        ringtone.current.play().catch((e) => console.error(e));
      }
    } else {
      ringtone.current.pause();
      ringtone.current.currentTime = 0;
      setCallingUser(null);
      setCallingThread(null);
    }
  }, [isCalling, callingUser]);

  const startCall = () => {
    if (!callId) return;
    setIsCalling(false);
    setIsInCall(true);
    joinCall({ options: { callId } });
  };

  const cancelCall = () => {
    if (!callId) return;
    cancelCallMutate(
      { options: { callId } },
      {
        onSuccess: (d) => {
          if (!d.CancelCall.data && d.CancelCall.errors.length > 0) {
            d.CancelCall.errors.forEach((err) => {
              errorToast(err.details?.message);
            });
          }
        }
      }
    );
    setIsCalling(false);
  };

  return (
    <>
      <Helmet>
        <title>Biscit | Chat - {data?.thread.data?.name || ''} </title>
      </Helmet>
      <Layout threadId={threadId}>
        <ContentNav>
          <div className="flex flex-row justify-between h-full select-none">
            <div className="flex flex-row items-center">
              <div className="border-r border-light-300 px-4 mr-2">
                <FaHashtag className="text-light-300 text-2xl" />
              </div>
              <div className="text-light-200 text-lg font-bold font-opensans">{data?.thread.data?.name}</div>
            </div>
            <div className="flex flex-row items-center justify-center mr-2">
              <FaVideo
                size={24}
                className="text-light-300 hover:text-light-hover cursor-pointer mx-2"
                title="Video call"
              />
              <IoMdCall
                size={24}
                className="text-light-300 hover:text-light-hover cursor-pointer mx-2"
                title="Call"
                onClick={() =>
                  createCall(
                    { options: { threadId } },
                    {
                      onSuccess: (d) => {
                        if (d.CreateCall.errors.length > 0) {
                          d.CreateCall.errors.forEach((err) => {
                            errorToast(err.details?.message);
                          });
                        } else {
                          setCallId(d.CreateCall.data);
                        }
                      }
                    }
                  )
                }
              />
              <HiDotsVertical
                size={26}
                className="text-light-200 hover:text-light-hover cursor-pointer mx-1"
                title="Open info tab"
                onClick={() => setShowChatInfo(!showChatInfo)}
              />
            </div>
          </div>
        </ContentNav>

        <div className="w-full h-full overflow-hidden flex flex-col relative">
          <div className="flex flex-row flex-grow overflow-y-auto overflow-x-hidden relative">
            <ChatFeed
              threadId={threadId}
              setResendMessage={setResendMessage}
              replyMessage={replyMessage}
              setReplyMessage={setReplyMessage}
              setModalShow={setResendModalShow}
              setGalleryFile={setGalleryFile}
            />
            <ChatInfoBar
              show={showChatInfo}
              thread={data}
              threadId={threadId}
              setGalleryFile={setGalleryFile}
              setEditModalShow={setEditModalShow}
              setAddMemberModalShow={setAddMemberModalShow}
              editModalShow={editModalShow}
            />
            {!!callId && (
              <>
                {isCalling && (
                  <CallingDialog
                    callId={callId}
                    user={callingUser}
                    thread={callingThread}
                    myId={meData?.me?.id}
                    startCall={startCall}
                    cancelCall={cancelCall}
                  />
                )}
                {isInCall && <VideoChat callId={callId} setIsInCall={setIsInCall} />}
              </>
            )}
          </div>
          <ChatBottomBar replyMessage={replyMessage} setReplyMessage={setReplyMessage} threadId={threadId} />
        </div>
      </Layout>
      {galleryFile && <ImageGallery file={galleryFile} setGalleryFile={setGalleryFile} />}
      <Modal isOpen={resendModalShow} backOpacity={0.5}>
        <div className="bg-dark-200 p-5 rounded-xl w-96">
          <div className="w-full h-10 flex flex-row justify-between">
            <div className="text-light-300 text-lg font-roboto">Resend message</div>
            <div>
              <IoMdClose
                className="text-2xl text-light-300 hover:text-light cursor-pointer"
                onClick={() => {
                  setResendModalShow(false);
                  setResendThreads([]);
                  setResendMessage(null);
                }}
              />
            </div>
          </div>
          <div className="w-full flex-grow relative">
            <textarea
              className="text-light-200 font-opensans text-sm mb-3 bg-dark-50 outline-none p-1 w-full resize-none"
              value={resendMessage?.content}
              rows={3}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              onChange={(e) =>
                setResendMessage({ ...resendMessage, content: e.target.value } as MessageSnippetFragment)
              }
            ></textarea>
            <p className="text-light-300 font-opensans text-md mb-3">Select all threads to send this message to.</p>
            <ul className="w-full max-h-72 overflow-auto overflow-x-hidden">
              {loadedThreads?.threads.map(({ thread }, i) => {
                return (
                  <ThreadListItem
                    thread={thread}
                    key={thread.id}
                    onChecked={(checked) => {
                      if (checked) {
                        setResendThreads([...resendThreads, thread.id]);
                        return;
                      }
                      const currentResendThreads = [...resendThreads];
                      const newResendThreads = currentResendThreads.filter((resendThread) => {
                        if (resendThread === thread.id) return false;
                        return true;
                      });
                      setResendThreads(newResendThreads);
                    }}
                  />
                );
              })}
            </ul>

            <div className="w-full flex flex-row justify-end mt-6">
              <button
                className="px-6 py-1.5 bg-transparent text-light-200 hover:text-light-300  rounded-md font-bold mt-2"
                onClick={() => {
                  setResendModalShow(false);
                  setResendThreads([]);
                  setResendMessage(null);
                }}
              >
                Cancel
              </button>
              <SubmitButton onClick={() => handleResend()}>Send</SubmitButton>
            </div>
          </div>
        </div>
      </Modal>
      <EditThreadModal isOpen={editModalShow} setIsOpen={setEditModalShow} thread={data?.thread.data} />
      <Modal isOpen={addMemberModalShow} backOpacity={0.5} onClose={() => setToAddMembers([])}>
        <div className="bg-dark-200 p-5 rounded-xl w-96">
          <div className="w-full h-10 flex flex-row justify-between">
            <div className="text-light-300 text-lg font-roboto">Add members</div>
            <div>
              <IoMdClose
                className="text-2xl text-light-300 hover:text-light cursor-pointer"
                onClick={() => setAddMemberModalShow(false)}
              />
            </div>
          </div>
          <div className="w-full flex-grow">
            <div>
              {availableNewThreadMembers && availableNewThreadMembers.length > 0 && (
                <p className="text-light-300 font-opensans text-md mb-1">Choose members (they must be your friends)</p>
              )}
              <ul className="w-full max-h-72 overflow-auto overflow-x-hidden">
                {availableNewThreadMembers && availableNewThreadMembers.length > 0 ? (
                  availableNewThreadMembers.map((friendship) => {
                    const { friend } = friendship;
                    return (
                      <FriendListItem
                        friend={friend}
                        key={friendship.id}
                        onChecked={(checked) => {
                          if (checked) {
                            setToAddMembers([...toAddMembers, friend.id]);
                            return;
                          }
                          const currentToAddMembers = [...toAddMembers];
                          const newToAddMembers = currentToAddMembers.filter((resendThread) => {
                            if (resendThread === friend.id) return false;
                            return true;
                          });
                          setToAddMembers(newToAddMembers);
                        }}
                      />
                    );
                  })
                ) : (
                  <div className="text-light-400 text-sm">No friends that you can add found.</div>
                )}
              </ul>
            </div>

            <div className="w-full flex flex-row justify-end mt-6">
              <button
                className="px-6 py-1.5 bg-transparent text-light-200 hover:text-light-300  rounded-md font-bold mt-2"
                onClick={() => setAddMemberModalShow(false)}
              >
                Cancel
              </button>
              <SubmitButton
                onClick={async () => {
                  if (toAddMembers.length === 0) return;
                  await addMembers(
                    { options: { threadId, newMembers: toAddMembers } },
                    {
                      onSuccess: (d) => {
                        if (d.AddMembers.data) {
                          successToast(
                            `${toAddMembers.length} new member${
                              toAddMembers.length > 1 ? 's were' : ' was'
                            } added to this thread.`
                          );
                          setAddMemberModalShow(false);
                          setToAddMembers([]);
                        }
                        if (d.AddMembers.errors.length > 0) {
                          for (const error of d.AddMembers.errors) {
                            errorToast(error.details?.message);
                          }
                        }
                      }
                    }
                  );
                }}
              >
                Add
              </SubmitButton>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Chat;