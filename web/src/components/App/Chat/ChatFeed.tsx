import React, { useEffect, useRef, useState } from 'react';
import { InfiniteData } from 'react-query';
import { ClipLoader } from 'react-spinners';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { IncomingDeleteMessage, IncomingSocketChatMessage, IncomingUpdateMessage } from '../../..';
import {
  Message,
  MessageSnippetFragment,
  ThreadMessagesQuery,
  ThreadMessagesResponse,
  useMeQuery
} from '../../../generated/graphql';
import { queryClient } from '../../../utils/createQueryClient';
import { socket } from '../../../utils/createWSconnection';
import { datesAreSameDay } from '../../../utils/datesAreSameDay';
import { isServer } from '../../../utils/isServer';
import { errorToast } from '../../../utils/toasts';
import { messagesLimit, usePaginatedMessagesQuery } from '../../../utils/usePaginatedMessagesQuery';
import ChatMessage from './ChatMessage';

export interface ChatFeedProps {
  threadId: string;
  setModalShow: React.Dispatch<React.SetStateAction<boolean>>;
  setResendMessage: React.Dispatch<React.SetStateAction<MessageSnippetFragment | null>>;
}

const ChatFeed: React.FC<ChatFeedProps> = ({ threadId, setModalShow, setResendMessage }) => {
  const { data: meData } = useMeQuery();

  const incomingThreadMessagesRef = useRef<InfiniteData<ThreadMessagesQuery> | undefined>();

  const { data: incomingThreadMessages, fetchNextPage, status } = usePaginatedMessagesQuery(threadId);
  incomingThreadMessagesRef.current = incomingThreadMessages;

  const [messages, setMessages] = useState<MessageSnippetFragment[]>([]);
  const messagesRef = useRef<MessageSnippetFragment[]>([]);
  messagesRef.current = messages;

  const [moreMessages, setMoreMessages] = useState<boolean>(false);
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
    ws.send(JSON.stringify(payload));
  };

  useEffect(() => {
    const ws = socket.connect();
    if (isServer() || !ws) return;

    setMessages([]);
    messagesRef.current = [];
    setMoreMessages(false);
    setIsLoadingMessages(false);

    if (!queryClient.getQueryData(`ThreadMessages-${threadId}`)) {
      fetchNextPage({ pageParam: null });
    }

    const handleMessage = (e) => {
      const { data: m } = e;
      const incoming = JSON.parse(m);
      if (incoming.code === 3000) {
        const { message, threadId: incomingThreadId } = incoming as IncomingSocketChatMessage;
        if (incomingThreadId !== threadId) return;

        const currentMessages = [...messagesRef.current];
        currentMessages.push(message as MessageSnippetFragment);

        const pages: InfiniteData<ThreadMessagesQuery> | undefined = queryClient.getQueryData(
          `ThreadMessages-${threadId}`
        );
        if (pages?.pages) {
          pages.pages[0].messages.data?.push(message);
          queryClient.setQueryData(`ThreadMessages-${threadId}`, pages);
        }
        setMessages(currentMessages);
        scroll(0);
      } else if (incoming.code === 3007) {
        const { messageId, threadId: incomingThreadId } = incoming as IncomingDeleteMessage;
        if (incomingThreadId !== threadId) return;

        const currentMessages = [...messagesRef.current];
        const thisMessage = currentMessages.find((message) => {
          if (message.id === messageId) return true;
          return false;
        });

        if (thisMessage && currentMessages.includes(thisMessage)) {
          currentMessages.splice(currentMessages.indexOf(thisMessage), 1);
          setMessages(currentMessages);
        }
      } else if (incoming.code === 3008) {
        const { messageId, threadId: incomingThreadId, newContent } = incoming as IncomingUpdateMessage;
        if (incomingThreadId !== threadId) return;

        const currentMessages = [...messagesRef.current];
        const thisMessage = currentMessages.find((message) => {
          if (message.id === messageId) return true;
          return false;
        });

        if (thisMessage && currentMessages.includes(thisMessage)) {
          const idx = currentMessages.indexOf(thisMessage);
          currentMessages.splice(idx, 1, {
            ...thisMessage,
            content: newContent,
            edited: true,
            updatedAt: new Date().toISOString()
          });

          setMessages(currentMessages);
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
      setMoreMessages(false);
      setIsLoadingMessages(false);
      setMessages([]);
      messagesRef.current = [];
    };
  }, []);
  useEffect(() => {
    setIsLoadingMessages(true);
    if (!incomingThreadMessages?.pages) return;
    if (messagesRef.current.length === 0) {
      const { data: incomingMessages, hasMore, errors } = incomingThreadMessages.pages[0]
        .messages as ThreadMessagesResponse;

      if (incomingMessages) {
        setMessages(incomingMessages);
        setMoreMessages(hasMore);
        setIsLoadingMessages(false);
      }
      return;
    }
    incomingThreadMessages.pages.forEach((page) => {
      if (page.messages) {
        const { data: incomingMessages, hasMore, errors } = page.messages as ThreadMessagesResponse;

        if (errors.length > 0) {
          errors.forEach((err) => {
            if (err.details?.message) {
              errorToast(err.details.message);
            }
          });
          return;
        }
        if (incomingMessages) {
          const tempMessages = messagesRef.current.filter((message) => {
            if (incomingMessages.indexOf(message as Message) === -1) return true;
            return false;
          });
          const newMessages = [...incomingMessages, ...tempMessages];
          const feed = document.querySelector('#chat-feed')! as HTMLDivElement;
          const feedMessages = feed.querySelectorAll('.message');
          const lastMessageEl = feedMessages[0];

          if (newMessages.length > messagesLimit && lastMessageEl && !(incomingMessages.length > messagesLimit)) {
            lastMessageEl.scrollIntoView();
          }

          setMessages(newMessages);

          if (incomingMessages.length > messagesLimit) {
            scroll(0);
          }

          setMoreMessages(hasMore);
          setIsLoadingMessages(false);
        }
      }
    });
  }, [incomingThreadMessages]);

  useEffect(() => {
    const firstPageMessages = incomingThreadMessages?.pages[0].messages.data;
    if (
      messages.length <= messagesLimit ||
      (messages.length < messagesLimit && firstPageMessages && firstPageMessages?.length > messagesLimit)
    ) {
      scroll(0);
    }
  }, [messages]);

  useEffect(() => {
    const feed = document.querySelector('#chat-feed')! as HTMLDivElement;
    if (moreMessages) {
      feed.onscroll = () => {
        if (feed.scrollTop === 0) {
          const cursor = messagesRef.current[0].createdAt;
          if (incomingThreadMessagesRef.current?.pageParams.find((p) => p === cursor)) {
            incomingThreadMessagesRef.current.pages.splice(
              incomingThreadMessagesRef.current.pageParams.indexOf(cursor),
              1
            );
            incomingThreadMessagesRef.current.pageParams.splice(
              incomingThreadMessagesRef.current.pageParams.indexOf(cursor),
              1
            );
            const newData = {
              pages: incomingThreadMessagesRef.current.pages,
              pageParams: incomingThreadMessagesRef.current.pageParams
            };
            queryClient.setQueryData(`ThreadMessages-${threadId}`, newData);
          }
          fetchNextPage({ pageParam: cursor });
        }
      };
      return () => {
        feed.onscroll = null;
      };
    }
  }, [moreMessages]);

  const handleResendCall = (message: MessageSnippetFragment) => {
    setModalShow(true);
    setResendMessage(message);
  };

  return (
    <div className="flex-grow px-3 py-1 mt-12 overflow-y-scroll" id="chat-feed">
      {isLoadingMessages && (
        <div className="w-full h-10 text-center text-light-300 text-lg font-roboto">
          <ClipLoader color="#e09f3e" size={30} />{' '}
        </div>
      )}
      {messages?.map((message, i) => {
        const { id: messageId } = message;
        const date = new Date(parseInt(message.createdAt));
        const now = new Date();

        if (datesAreSameDay(date, now)) {
          const prevMessage = messages[i - 1];
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
                  <ChatMessage message={message} myId={meData?.me?.id} resendCall={() => handleResendCall(message)} />
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
          />
        );
      })}
    </div>
  );
};

export default React.memo(ChatFeed);
