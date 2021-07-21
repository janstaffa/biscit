import React, { useEffect, useRef, useState } from 'react';
import { InfiniteData } from 'react-query';
import { ClipLoader } from 'react-spinners';
import {
  FileSnippetFragment,
  MessageSnippetFragment,
  ThreadMessagesQuery,
  ThreadMessagesResponse,
  ThreadSnippetFragment,
  useMeQuery,
  useThreadQuery
} from '../../../generated/graphql';
import { IncomingDeleteMessage, IncomingSocketChatMessage, IncomingUpdateMessage } from '../../../types';
import { queryClient } from '../../../utils/createQueryClient';
import { socket } from '../../../utils/createWSconnection';
import { datesAreSameDay } from '../../../utils/datesAreSameDay';
import { usePaginatedMessagesQuery } from '../../../utils/usePaginatedMessagesQuery';
import SplashScreen from '../../SplashScreen';
import ChatMessage from './ChatMessage';

export interface ChatFeedProps {
  threadId: string;
  setModalShow: React.Dispatch<React.SetStateAction<boolean>>;
  setResendMessage: React.Dispatch<React.SetStateAction<MessageSnippetFragment | null>>;
  setReplyMessage: React.Dispatch<React.SetStateAction<MessageSnippetFragment | null>>;
  replyMessage: MessageSnippetFragment | null;
  setGalleryFile: React.Dispatch<React.SetStateAction<FileSnippetFragment | null>>;
}

const ChatFeed: React.FC<ChatFeedProps> = ({
  threadId,
  setModalShow,
  setResendMessage,
  setReplyMessage,
  replyMessage,
  setGalleryFile
}) => {
  const { data: meData } = useMeQuery();
  const { data: threadData } = useThreadQuery({ options: { threadId } });

  const incomingThreadMessagesRef = useRef<InfiniteData<ThreadMessagesQuery> | undefined>();

  const { data: incomingThreadMessages, fetchNextPage, hasNextPage } = usePaginatedMessagesQuery(threadId);
  incomingThreadMessagesRef.current = incomingThreadMessages;

  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [shouldScroll, setShouldScroll] = useState<boolean>(false);

  const scroll = (px = 0) => {
    const feed = document.querySelector('#chat-feed')! as HTMLDivElement;
    if (!feed) return;

    feed.scrollTop = px === 0 ? feed.scrollHeight : px;
  };

  useEffect(() => {
    setShouldScroll(true);
    const ws = socket.connect();
    if (!ws) return;
    setIsLoadingMessages(false);

    const handleMessage = (e) => {
      const { data: m } = e;
      const incoming = JSON.parse(m);

      if (incoming.code === 3000) {
        const { message, threadId: incomingThreadId } = incoming as IncomingSocketChatMessage;

        const pages: InfiniteData<ThreadMessagesQuery> | undefined = queryClient.getQueryData(
          `ThreadMessages-${incomingThreadId}`
        );
        if (pages?.pages) {
          pages.pages[0].messages.data?.push(message);
          setShouldScroll(true);
          queryClient.setQueryData(`ThreadMessages-${incomingThreadId}`, pages);
        }
        if (message.media) {
          queryClient.invalidateQueries(['Thread', { options: { threadId } }]);
        }
      } else if (incoming.code === 3007) {
        const { messageId, threadId: incomingThreadId } = incoming as IncomingDeleteMessage;

        const pages: InfiniteData<ThreadMessagesQuery> | undefined = queryClient.getQueryData(
          `ThreadMessages-${incomingThreadId}`
        );

        if (pages?.pages) {
          const thisPage = pages.pages.find((page) => {
            return page.messages.data?.find((message) => message.id === messageId);
          });
          if (thisPage?.messages.data) {
            const idx = pages.pages.indexOf(thisPage);
            const thisMessage = thisPage.messages.data?.find((message) => {
              return message.id === messageId;
            });
            if (thisMessage) {
              const messageIdx = thisPage.messages.data?.indexOf(thisMessage);
              pages.pages[idx].messages.data?.splice(messageIdx, 1);
              queryClient.setQueryData(`ThreadMessages-${incomingThreadId}`, pages);
            }
          }
        }
      } else if (incoming.code === 3008) {
        const { messageId, threadId: incomingThreadId, newContent } = incoming as IncomingUpdateMessage;
        const pages: InfiniteData<ThreadMessagesQuery> | undefined = queryClient.getQueryData(
          `ThreadMessages-${incomingThreadId}`
        );

        if (pages?.pages) {
          const thisPage = pages.pages.find((page) => {
            return page.messages.data?.find((message) => message.id === messageId);
          });
          if (thisPage?.messages.data) {
            const idx = pages.pages.indexOf(thisPage);
            const thisMessage = thisPage.messages.data?.find((message) => {
              return message.id === messageId;
            });
            if (thisMessage) {
              const messageIdx = thisPage.messages.data?.indexOf(thisMessage);
              pages.pages[idx].messages.data?.splice(messageIdx, 1, {
                ...thisMessage,
                content: newContent,
                edited: true,
                updatedAt: new Date().toISOString()
              });

              queryClient.setQueryData(`ThreadMessages-${incomingThreadId}`, pages);
            }
          }
        }
      }
    };
    const handleOpen = () => {
      const payload = {
        code: 3002,
        threadId
      };
      socket.send(JSON.stringify(payload));
    };
    try {
      scroll(0);
      ws.addEventListener('message', handleMessage);
      ws.addEventListener('open', handleOpen);
      if (ws.readyState === ws.OPEN) {
        handleOpen();
      }
    } catch (err) {
      console.error(err);
    }
    return () => {
      ws.removeEventListener('message', handleMessage);
      ws.removeEventListener('open', handleOpen);
    };
  }, [threadId]);

  useEffect(() => {
    setIsLoadingMessages(true);
    if (!incomingThreadMessages?.pages || !incomingThreadMessages.pages[0]?.messages) return;
    const { data: incomingMessages } = incomingThreadMessages.pages[0].messages as ThreadMessagesResponse;
    if (incomingMessages) {
      setIsLoadingMessages(false);

      const feed = document.querySelector('#chat-feed')! as HTMLDivElement;
      const feedMessages = feed.querySelectorAll('.message');
      const lastMessageEl = feedMessages[incomingMessages.length];

      if (incomingThreadMessages.pages.length === 1 || shouldScroll) {
        scroll(0);
        setShouldScroll(false);
      } else if (lastMessageEl) {
        lastMessageEl.scrollIntoView();
      }
    }
  }, [incomingThreadMessages]);

  useEffect(() => {
    const feed = document.querySelector('#chat-feed')! as HTMLDivElement;
    if (hasNextPage) {
      feed.onscroll = () => {
        if (feed.scrollTop === 0) {
          setIsLoadingMessages(true);
          fetchNextPage();
        }
      };
      return () => {
        feed.onscroll = null;
      };
    }
  }, [hasNextPage]);

  const handleResendCall = (message: MessageSnippetFragment) => {
    setModalShow(true);
    setResendMessage(message);
  };

  const handleReplyCall = (message: MessageSnippetFragment) => {
    setReplyMessage(message);
  };

  const handleMessageReady = () => {
    if (shouldScroll) {
      scroll(0);
      setShouldScroll(false);
    }
  };

  const amIAdmin = !!threadData?.thread.data?.members.find((member) => member.userId === meData?.me?.id);
  const firstPagedata = incomingThreadMessages?.pages[0].messages.data;
  return (
    <>
      <div className="flex-grow px-3 mt-12 overflow-y-scroll overflow-x-hidden relative" id="chat-feed">
        {isLoadingMessages && (
          <div className="w-full h-10 text-center text-light-300 text-lg font-roboto">
            <ClipLoader color="#e09f3e" size={30} />
          </div>
        )}
        {firstPagedata && firstPagedata.length > 0 ? (
          incomingThreadMessages?.pages.map((page, pi) => {
            return page?.messages.data?.map((message, i) => {
              const { id: messageId, userId } = message;

              const sender = threadData?.thread.data?.members.find((member) => member.userId === userId);
              const date = new Date(parseInt(message.createdAt));
              const now = new Date();
              if (datesAreSameDay(date, now)) {
                let prevMessage = page.messages.data && page.messages.data[i - 1];
                if (i === 0) {
                  const prevPage = incomingThreadMessages?.pages[pi - 1];
                  if (prevPage) {
                    prevMessage = prevPage.messages.data && prevPage.messages.data[prevPage.messages.data.length - 1];
                  }
                }
                if (prevMessage) {
                  const prevDate = new Date(parseInt(prevMessage.createdAt));

                  if (!datesAreSameDay(prevDate, now)) {
                    return (
                      <div key={messageId}>
                        <div className="text-center my-4">
                          <hr className="bg-dark-50 h-px border-none" />
                          <div
                            className="text-light-300 font-roboto bg-dark w-20 text-md leading-none mx-auto bg-dark-100"
                            style={{ marginTop: '-10px' }}
                          >
                            today
                          </div>
                        </div>
                        <ChatMessage
                          message={message}
                          sender={sender?.user}
                          myId={meData?.me?.id}
                          resendCall={() => handleResendCall(message)}
                          replyCall={() => handleReplyCall(message)}
                          replyMessage={replyMessage}
                          onReady={() => handleMessageReady()}
                          setGalleryFile={setGalleryFile}
                          thread={threadData?.thread.data as ThreadSnippetFragment}
                          amIAdmin={amIAdmin}
                        />
                      </div>
                    );
                  }
                }
              }
              return (
                <ChatMessage
                  message={message}
                  sender={sender?.user}
                  myId={meData?.me?.id}
                  key={messageId}
                  resendCall={() => handleResendCall(message)}
                  replyCall={() => handleReplyCall(message)}
                  replyMessage={replyMessage}
                  onReady={() => handleMessageReady()}
                  setGalleryFile={setGalleryFile}
                  thread={threadData?.thread.data as ThreadSnippetFragment}
                  amIAdmin={amIAdmin}
                />
              );
            });
          })
        ) : (
          // <div className="w-full h-64 text-center">
          //   <h3 className="text-light-200 text-lg font-opensans">There are no messages yet.</h3>
          // </div>
          <div className="overflow-hidden">
            <SplashScreen
              src="/no_messages_splash.svg"
              alt="No messages splash image"
              caption="There are no messages yet."
            />
          </div>
        )}
      </div>
    </>
  );
};

export default React.memo(ChatFeed);
