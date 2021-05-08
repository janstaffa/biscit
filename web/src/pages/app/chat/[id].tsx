import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { FaHashtag } from 'react-icons/fa';
import { useQuery } from 'react-query';
import { ClipLoader } from 'react-spinners';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { IncomingDeleteMessage, IncomingSocketChatMessage, IncomingUpdateMessage } from '../../..';
import ChatBottomBar from '../../../components/App/Chat/ChatBottomBar';
import ChatMessage from '../../../components/App/Chat/ChatMessage';
import ContentNav from '../../../components/App/ContentNav';
import Layout from '../../../components/App/Layout';
import { genericErrorMessage } from '../../../constants';
import {
  MessageSnippetFragment,
  ThreadMessagesDocument,
  ThreadMessagesQuery,
  ThreadMessagesQueryVariables,
  ThreadMessagesResponse,
  useThreadQuery
} from '../../../generated/graphql';
import { queryClient } from '../../../utils/createQueryClient';
import { socket } from '../../../utils/createWSconnection';
import { isServer } from '../../../utils/isServer';
import { errorToast } from '../../../utils/toasts';
import { useGQLRequest } from '../../../utils/useGQLRequest';
import withAuth from '../../../utils/withAuth';

const messagesLimit = 30;
const Chat: NextPage = () => {
  const router = useRouter();
  if (!router.query.id) {
    router.replace('/app/friends/all');
    return null;
  }
  const threadId = typeof router.query.id === 'object' ? router.query.id[0] : router.query.id || '';

  const { data } = useThreadQuery(
    {
      options: { threadId }
    },
    {
      onError: (err) => {
        console.error(err);
        errorToast(genericErrorMessage);
      },
      onSuccess: (d) => {
        if (d.thread.errors.length > 0) {
          console.error(d.thread.errors);
          router.replace('/app/friends/all');
        }
      }
    }
  );

  const [cursor, setCursor] = useState<string | null>(null);
  const variables = {
    options: {
      threadId,
      limit: messagesLimit,
      cursor
    }
  } as ThreadMessagesQueryVariables;
  const { data: incomingThreadMessages, refetch: refetchThreadMessages } = useQuery<ThreadMessagesQuery>(
    [`ThreadMessages-${threadId}`, variables],
    useGQLRequest<ThreadMessagesQuery, ThreadMessagesQueryVariables>(ThreadMessagesDocument).bind(null, variables),
    {
      onError: (err) => {
        console.error(err);
        errorToast(genericErrorMessage);
      }
    }
  );

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

  const loadMessages = () => {
    refetchThreadMessages();
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
    setMoreMessages(false);
    setIsLoadingMessages(false);
    setCursor(null);
    loadMessages();

    const handleMessage = (e) => {
      const { data: m } = e;
      const incoming = JSON.parse(m);
      if (incoming.code === 3000) {
        const { message, threadId: incomingThreadId } = incoming as IncomingSocketChatMessage;
        if (incomingThreadId !== threadId) return;

        const currentMessages = [...messagesRef.current];
        currentMessages.push(message as MessageSnippetFragment);
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
            content: newContent
          });

          setMessages(currentMessages);
        }
      }
    };
    const handleOpen = () => {
      joinRoom(ws);
    };
    try {
      ws.addEventListener('message', handleMessage);
      ws.addEventListener('open', handleOpen);
      if (ws.readyState === ws.OPEN) {
        handleOpen();
      }
    } catch (err) {
      console.error(err);
    }
    return function () {
      ws.removeEventListener('message', handleMessage);
      ws.removeEventListener('open', handleOpen);
    };
  }, [threadId]);

  useEffect(() => {
    return function cleanup() {
      setMoreMessages(false);
      setIsLoadingMessages(false);
      queryClient.refetchQueries({ queryKey: `ThreadMessages-${threadId}}` });
      setMessages([]);
    };
  }, []);
  useEffect(() => {
    setIsLoadingMessages(true);
    if (!incomingThreadMessages?.messages) return;
    const { data: incomingMessages, hasMore, errors } = incomingThreadMessages.messages as ThreadMessagesResponse;

    if (errors.length > 0) {
      errors.forEach((err) => {
        if (err.details?.message) {
          errorToast(err.details.message);
        }
      });
      router.replace('/app/friends/all');
      return;
    }
    if (incomingMessages) {
      const newMessages = [...incomingMessages, ...messagesRef.current];
      const feed = document.querySelector('#chat-feed')! as HTMLDivElement;
      const feedMessages = feed.querySelectorAll('.message');
      const lastMessageEl = feedMessages[0];
      if (lastMessageEl) {
        lastMessageEl.scrollIntoView();
      }
      setMessages(newMessages);
      setMoreMessages(hasMore);
      setIsLoadingMessages(false);
    }
  }, [incomingThreadMessages]);

  useEffect(() => {
    const feed = document.querySelector('#chat-feed')! as HTMLDivElement;

    if (messages.length <= messagesLimit) {
      scroll(0);
    }

    if (moreMessages) {
      feed.onscroll = () => {
        if (feed.scrollTop === 0) {
          setCursor(messages[0].createdAt);
          loadMessages();
        }
      };
      return () => {
        feed.onscroll = null;
      };
    }
  }, [moreMessages, messages]);
  return (
    <>
      <Head>
        <title>Biscit | Chat - {data?.thread.data?.name} </title>
      </Head>
      <Layout>
        <ContentNav>
          <div className="flex flex-row items-center h-full select-none">
            <div className="border-r border-light-300 px-4 mr-2">
              <FaHashtag className="text-light-300 text-2xl" />
            </div>
            <div className="text-light-200 text-lg font-bold font-opensans">{data?.thread.data?.name}</div>
          </div>
        </ContentNav>
        <div className="w-full h-full overflow-hidden relative flex flex-col">
          <div className="flex-grow px-3 py-1 mt-12 overflow-y-scroll" id="chat-feed">
            {isLoadingMessages && (
              <div className="w-full h-10 text-center text-light-300 text-lg font-roboto">
                <ClipLoader color="#e09f3e" size={30} />{' '}
              </div>
            )}
            {messages?.map((message) => {
              const { id: messageId } = message;
              return <ChatMessage message={message} key={messageId} />;
            })}
          </div>
          <ChatBottomBar />
        </div>
      </Layout>
    </>
  );
};

export default withAuth(Chat);
