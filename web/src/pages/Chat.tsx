import React, { useContext, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FaHashtag } from 'react-icons/fa';
import { HiDotsVertical } from 'react-icons/hi';
import { IoMdCall, IoMdClose } from 'react-icons/io';
import { useHistory, useParams } from 'react-router-dom';
import { Modal } from 'react-tiny-modals';
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
  useAddMembersMutation,
  useMeQuery,
  useThreadQuery,
  useThreadsQuery
} from '../generated/graphql';
import { OutgoingSocketChatMessage } from '../types';
import { socket } from '../utils/createWSconnection';
import { RTCcontext } from '../utils/RTCProvider';
import { errorToast, successToast } from '../utils/toasts';

const Chat: React.FC = () => {
  const history = useHistory();
  const { id: threadId } = useParams<{ id: string }>();
  if (!threadId) {
    history.push('/app/friends/all');
  }

  const { data: threadData, isLoading } = useThreadQuery(
    {
      options: { threadId }
    },
    {
      onSuccess: (d) => {
        if (d.thread.errors.length > 0) {
          console.error(d.thread.errors);
          d.thread.errors.forEach((err) => {
            errorToast(err.details?.message);
          });
          history.replace('/app/friends/all');
        }
      }
    }
  );
  if (!isLoading && !threadData?.thread.data) {
    errorToast('This thread was not found.');
    history.push('/app/friends/all');
  }

  const { data: meData } = useMeQuery();
  const { data: loadedThreads } = useThreadsQuery();

  const { mutate: addMembers } = useAddMembersMutation();

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
    return !threadData?.thread.data?.members.find((member) => member.userId === friend.friend.id);
  });

  const rtcContext = useContext(RTCcontext);

  return (
    <>
      <Helmet>
        <title>Biscit | Chat - {threadData?.thread.data?.name || ''} </title>
      </Helmet>
      <Layout threadId={threadId}>
        <ContentNav>
          <div className="flex flex-row justify-between h-full select-none">
            <div className="flex flex-row items-center">
              <div className="border-r border-light-300 px-4 mr-2">
                <FaHashtag className="text-light-300 text-2xl" />
              </div>
              <div className="text-light-200 text-lg font-bold font-opensans">{threadData?.thread.data?.name}</div>
            </div>
            <div className="flex flex-row items-center justify-center mr-2">
              {threadData?.thread.data?.call?.id ? (
                <IoMdCall
                  size={24}
                  className="cursor-pointer mx-2 text-lime-200"
                  title="Call"
                  onClick={() => {
                    if (!threadData.thread.data?.call?.id) return;
                    rtcContext?.joinCall(threadData.thread.data.call.id, threadId);
                  }}
                />
              ) : (
                <IoMdCall
                  size={24}
                  className="cursor-pointer mx-2 text-light-300 hover:text-light-hover"
                  title="Call"
                  onClick={() => {
                    rtcContext?.createCall(threadId);
                  }}
                />
              )}
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
              thread={threadData}
              threadId={threadId}
              setGalleryFile={setGalleryFile}
              setEditModalShow={setEditModalShow}
              setAddMemberModalShow={setAddMemberModalShow}
              editModalShow={editModalShow}
            />

            {rtcContext?.isInCall &&
              rtcContext?.callDetails &&
              rtcContext.callDetails.threadId === threadId &&
              threadData?.thread.data && (
                <VideoChat callId={rtcContext.callDetails.callId} thread={threadData?.thread.data} />
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
      <EditThreadModal isOpen={editModalShow} setIsOpen={setEditModalShow} thread={threadData?.thread.data} />
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
