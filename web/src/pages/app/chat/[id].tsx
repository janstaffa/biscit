import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { FaHashtag } from 'react-icons/fa';
import ClipLoader from 'react-spinners/ClipLoader';
import { IncomingLoadMessagesMessage, IncomingSocketChatMessage, OutgoingLoadMessagesMessage } from '../../..';
import ChatBottomBar from '../../../components/App/Chat/ChatBottomBar';
import ChatMessage from '../../../components/App/Chat/ChatMessage';
import ContentNav from '../../../components/App/ContentNav';
import Layout from '../../../components/App/Layout';
import { genericErrorMessage } from '../../../constants';
import { MessageSnippetFragment, useThreadQuery } from '../../../generated/graphql';
import { useWebSocketStore } from '../../../stores/useWebSocketStore';
import { socket } from '../../../utils/createWSconnection';
import { isServer } from '../../../utils/isServer';
import { errorToast } from '../../../utils/toasts';
import withAuth from '../../../utils/withAuth';

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

  const [messages, setMessages] = useState<MessageSnippetFragment[]>([]);
  const messagesRef = useRef<MessageSnippetFragment[]>([]);
  messagesRef.current = messages;
  const [moreMessages, setMoreMessages] = useState<boolean>(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);

  const scroll = (px = 0) => {
    const feed = document.querySelector('#chat-feed')!;
    feed.scrollTop = px === 0 ? feed.scrollHeight : px;
  };

  const loadMessages = (ws, cursor: string | null = null) => {
    if (ws) {
      setIsLoadingMessages(true);
      const payload = {
        code: 3003,
        threadId,
        limit: 30,
        cursor
      } as OutgoingLoadMessagesMessage;
      console.log(payload);

      ws.send(JSON.stringify(payload));
    }
  };

  const joinRoom = (ws) => {
    console.log('I ran');
    const payload = {
      code: 3002,
      threadId
    };
    ws.send(JSON.stringify(payload));
  };

  const { ready: isReady, setReady } = useWebSocketStore();
  useEffect(() => {
    setMessages([]);
    setMoreMessages(false);
    setIsLoadingMessages(false);
    const ws = socket.connect();
    if (!isServer() && ws) {
      try {
        ws.onmessage = (e) => {
          const { data: m } = e;
          const incoming = JSON.parse(m);
          if (incoming.code === 3000) {
            const { message, threadId: incomingThreadId } = incoming as IncomingSocketChatMessage;
            if (incomingThreadId !== threadId) return;

            const currentMessages = [...messagesRef.current];
            currentMessages.push(message as MessageSnippetFragment);
            setMessages(currentMessages);
            scroll();
          } else if (incoming.code === 3003) {
            const {
              messages: incomingMessages,
              hasMore,
              threadId: incomingThreadId
            } = incoming as IncomingLoadMessagesMessage;
            if (incomingThreadId !== threadId) return;

            const prevMessagesLength = messagesRef.current.length;
            const newMessages = [...incomingMessages, ...messagesRef.current];
            setMessages(newMessages);
            setMoreMessages(hasMore);
            setIsLoadingMessages(false);
            scroll(prevMessagesLength === 0 ? 0 : incomingMessages.length * 84);
          } else if (incoming.code === 3005) {
            if (incoming.value === 'ok') {
              setReady(true);
              loadMessages(ws);
              joinRoom(ws);
            }
          }
        };

        if (isReady) {
          loadMessages(ws);
          joinRoom(ws);
        }
      } catch (err) {
        console.error(err);
      }
    }
  }, [threadId]);

  useEffect(() => {
    const ws = socket.connect();
    const feed = document.querySelector('#chat-feed')! as HTMLDivElement;

    if (moreMessages) {
      feed.onscroll = () => {
        if (feed.scrollTop === 0) {
          const cursor = messages[0].createdAt;
          loadMessages(ws, cursor);
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
