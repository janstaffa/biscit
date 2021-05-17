import React, { useEffect, useRef, useState } from 'react';
import { InfiniteData } from 'react-query';
import { ClipLoader } from 'react-spinners';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { IncomingDeleteMessage, IncomingSocketChatMessage, IncomingUpdateMessage } from '../../..';
import {
  MessageSnippetFragment,
  ThreadMessagesQuery,
  ThreadMessagesResponse,
  useMeQuery
} from '../../../generated/graphql';
import { queryClient } from '../../../utils/createQueryClient';
import { socket } from '../../../utils/createWSconnection';
import { datesAreSameDay } from '../../../utils/datesAreSameDay';
import { isServer } from '../../../utils/isServer';
import { usePaginatedMessagesQuery } from '../../../utils/usePaginatedMessagesQuery';
import ChatMessage from './ChatMessage';

export interface ChatFeedProps {
  threadId: string;
  setModalShow: React.Dispatch<React.SetStateAction<boolean>>;
  setResendMessage: React.Dispatch<React.SetStateAction<MessageSnippetFragment | null>>;
  setReplyMessage: React.Dispatch<React.SetStateAction<MessageSnippetFragment | null>>;
  replyMessage: MessageSnippetFragment | null;
}

const ChatFeed: React.FC<ChatFeedProps> = ({
  threadId,
  setModalShow,
  setResendMessage,
  setReplyMessage,
  replyMessage
}) => {
  const { data: meData } = useMeQuery();

  const incomingThreadMessagesRef = useRef<InfiniteData<ThreadMessagesQuery> | undefined>();

  const { data: incomingThreadMessages, fetchNextPage, status, dataUpdatedAt, hasNextPage } = usePaginatedMessagesQuery(
    threadId
  );
  incomingThreadMessagesRef.current = incomingThreadMessages;

  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);

  const scroll = (px = 0) => {
    const feed = document.querySelector('#chat-feed')! as HTMLDivElement;
    if (!feed) return;

    feed.scrollTop = px === 0 ? feed.scrollHeight : px;
  };

  const joinRoom = (ws: ReconnectingWebSocket) => {
    const payload = {
      code: 3002,
      threadId
    };
    socket.send(JSON.stringify(payload));
  };

  useEffect(() => {
    const ws = socket.connect();
    if (isServer() || !ws) return;
    setIsLoadingMessages(false);

    if (!queryClient.getQueryData(`ThreadMessages-${threadId}`)) {
      fetchNextPage();
    }

    const handleMessage = (e) => {
      const { data: m } = e;
      const incoming = JSON.parse(m);
      // updating / deleting is broken, sets messages to current page -> removes messages from the feed
      if (incoming.code === 3000) {
        const { message, threadId: incomingThreadId } = incoming as IncomingSocketChatMessage;

        const pages: InfiniteData<ThreadMessagesQuery> | undefined = queryClient.getQueryData(
          `ThreadMessages-${incomingThreadId}`
        );
        if (pages?.pages) {
          pages.pages[0].messages.data?.push(message);
          queryClient.setQueryData(`ThreadMessages-${incomingThreadId}`, pages);
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
      joinRoom(ws);
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
    return function cleanup() {
      setIsLoadingMessages(false);
    };
  }, []);
  useEffect(() => {
    setIsLoadingMessages(true);
    if (!incomingThreadMessages?.pages) return;
    const { data: incomingMessages, nextMessage, errors } = incomingThreadMessages.pages[0]
      .messages as ThreadMessagesResponse;
    if (incomingMessages) {
      setIsLoadingMessages(false);
    }

    // incomingThreadMessages.pages.forEach((page) => {
    //   if (page.messages) {
    //     const { data: incomingMessages, hasMore, errors } = page.messages as ThreadMessagesResponse;
    //     if (errors.length > 0) {
    //       errors.forEach((err) => {
    //         if (err.details?.message) {
    //           errorToast(err.details.message);
    //         }
    //       });
    //       return;
    //     }
    //     if (incomingMessages) {
    //       const tempMessages = messagesRef.current.filter((message) => {
    //         if (incomingMessages.indexOf(message as Message) === -1) return true;
    //         return false;
    //       });
    //       const newMessages = [...incomingMessages, ...tempMessages];
    //       const feed = document.querySelector('#chat-feed')! as HTMLDivElement;
    //       const feedMessages = feed.querySelectorAll('.message');
    //       const lastMessageEl = feedMessages[0];
    //       if (newMessages.length > messagesLimit && lastMessageEl && !(incomingMessages.length > messagesLimit)) {
    //         lastMessageEl.scrollIntoView();
    //       }
    //       setMessages(newMessages);
    //       if (incomingMessages.length > messagesLimit) {
    //         scroll(0);
    //       }
    //       setMoreMessages(hasMore);
    //       setIsLoadingMessages(false);
    //     }
    //   }
    // });
  }, [incomingThreadMessages]);

  useEffect(() => {
    const feed = document.querySelector('#chat-feed')! as HTMLDivElement;
    if (hasNextPage) {
      feed.onscroll = () => {
        if (feed.scrollTop === 0) {
          // const pages: InfiniteData<ThreadMessagesQuery> | undefined = queryClient.getQueryData(
          //   `ThreadMessages-${threadId}`
          // );

          // let cursor: string | null = null;
          // const realPages = pages?.pages.reverse();
          // const lastPage = realPages?.[0];

          // if (lastPage && lastPage.messages.data) {
          //   cursor = lastPage.messages.data[0].createdAt;
          // }

          // if (incomingThreadMessagesRef.current?.pageParams.find((p) => p === cursor)) {
          //   incomingThreadMessagesRef.current.pages.splice(
          //     incomingThreadMessagesRef.current.pageParams.indexOf(cursor),
          //     1
          //   );
          //   incomingThreadMessagesRef.current.pageParams.splice(
          //     incomingThreadMessagesRef.current.pageParams.indexOf(cursor),
          //     1
          //   );
          //   const newData = {
          //     pages: incomingThreadMessagesRef.current.pages,
          //     pageParams: incomingThreadMessagesRef.current.pageParams
          //   };
          //   queryClient.setQueryData(`ThreadMessages-${threadId}`, newData);
          // }

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

  return (
    <div className="flex-grow px-3 mb-7 mt-12 overflow-y-scroll relative" id="chat-feed">
      {isLoadingMessages && (
        <div className="w-full h-10 text-center text-light-300 text-lg font-roboto">
          <ClipLoader color="#e09f3e" size={30} />
        </div>
      )}
      {incomingThreadMessages?.pages?.map((page, pi) => {
        return page.messages.data?.map((message, i) => {
          const { id: messageId } = message;
          const date = new Date(parseInt(message.createdAt));
          const now = new Date();

          if (datesAreSameDay(date, now)) {
            let prevMessage = page.messages.data && page.messages.data[i - 1];
            if (i === 0) {
              const prevPage = incomingThreadMessages.pages[pi - 1];
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
                      myId={meData?.me?.id}
                      resendCall={() => handleResendCall(message)}
                      replyCall={() => handleReplyCall(message)}
                      replyMessage={replyMessage}
                    />
                  </div>
                );
              }
            }
          }
          return (
            <ChatMessage
              message={message}
              myId={meData?.me?.id}
              key={messageId}
              resendCall={() => handleResendCall(message)}
              replyCall={() => handleReplyCall(message)}
              replyMessage={replyMessage}
            />
          );
        });
      })}
    </div>
  );
};

export default React.memo(ChatFeed);
