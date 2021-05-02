import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { FaHashtag, FaRegSmile } from 'react-icons/fa';
import { ImAttachment } from 'react-icons/im';
import BeatLoader from 'react-spinners/BeatLoader';
import ClipLoader from 'react-spinners/ClipLoader';
import {
  IncomingLoadMessagesMessage,
  IncomingSocketChatMessage,
  OutgoingLoadMessagesMessage,
  OutgoingSocketChatMessage,
  SocketThreadMessage,
  TypingMessage
} from '../../..';
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

const Chat = () => {
  const router = useRouter();
  if (!router.query.id) return router.replace('/app/friends/all');
  const threadId = router.query.id as string;

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
  const [messageInputValue, setMessageInputValue] = useState<string>('');
  const messageInputValueRef = useRef<string>('');
  messageInputValueRef.current = messageInputValue;
  const [typing, setTyping] = useState<{ username: string } | null>(null);

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

      ws.send(JSON.stringify(payload));
    }
  };
  useEffect(() => {
    setMessages([]);
    setMoreMessages(false);
    setIsLoadingMessages(false);
    const ws = socket.connect();
    if (!isServer() && ws) {
      try {
        let resetTyping;
        ws.onmessage = (e) => {
          const { data: m } = e;
          const incoming = JSON.parse(m);
          if (incoming.code === 3000) {
            const { message } = incoming as IncomingSocketChatMessage;
            const currentMessages = [...messagesRef.current];
            currentMessages.push(message as MessageSnippetFragment);
            setMessages(currentMessages);
            scroll();
          } else if (incoming.code === 3003) {
            const { messages: incomingMessages, hasMore } = incoming as IncomingLoadMessagesMessage;
            const prevMessagesLength = messagesRef.current.length;
            const newMessages = [...incomingMessages, ...messagesRef.current];
            setMessages(newMessages);
            setMoreMessages(hasMore);
            setIsLoadingMessages(false);
            scroll(prevMessagesLength === 0 ? 0 : incomingMessages.length * 84);
          } else if (incoming.code === 3005) {
            if (incoming.value === 'ok') {
              useWebSocketStore.getState().setReady(true);
              loadMessages(ws);
            }
          } else if (incoming.code === 3006) {
            const { username } = incoming as TypingMessage;
            if (resetTyping) {
              clearTimeout(resetTyping);
              resetTyping = null;
            }
            resetTyping = setTimeout(() => {
              setTyping(null);
            }, 2000);

            setTyping({ username });
          }
        };

        if (useWebSocketStore.getState().ready) {
          loadMessages(ws);
        }

        const handleInput = () => {
          const messageInput = document.getElementById('message-input')! as HTMLInputElement;
          messageInput.addEventListener('keyup', (e) => {
            if (!e.repeat && e.key === 'Enter') {
              const value = messageInputValueRef.current;
              if (!value || value === ' ') {
                return;
              }

              const payload = {
                code: 3000,
                threadId,
                content: value
              } as OutgoingSocketChatMessage;
              try {
                const isReady = useWebSocketStore.getState().ready;
                if (isReady) {
                  ws.send(JSON.stringify(payload));
                  setMessageInputValue('');
                  messageInput.focus();
                }
              } catch (err) {
                console.error(err);
              }
            }
          });
        };
        if (!useWebSocketStore.getState().ready) {
          ws.onopen = () => {
            handleInput();
          };
        } else {
          handleInput();
        }
      } catch (err) {
        console.error(err);
      }

      return () => {
        ws.onopen = ws.onmessage = null;
      };
    }
  }, [threadId]);

  useEffect(() => {
    const ws = socket.connect();
    if (ws && messageInputValueRef.current) {
      const payload: SocketThreadMessage = {
        code: 3006,
        threadId
      };
      ws.send(JSON.stringify(payload));
    }
  }, [messageInputValue]);

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
    }
    return () => {
      feed.onscroll = null;
    };
  }, [moreMessages]);

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
          <div className="w-full h-24 bg-dark-300 px-8 flex flex-col justify-center" style={{ minHeight: '6rem' }}>
            <div className="flex flex-row">
              <div className="w-14 bg-dark-100 flex flex-col justify-center items-center border-r border-dark-50 rounded-l-xl">
                <ImAttachment className="text-2xl text-light-300" />
              </div>
              <div className="flex-grow justify-center">
                <input
                  className="w-full h-12 bg-dark-100 outline-none text-light-200 px-4 text-base font-roboto flex resize-none"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  placeholder="press 'enter' to send the message"
                  value={messageInputValue}
                  id="message-input"
                  onChange={(e) => setMessageInputValue(e.target.value)}
                />
              </div>
              <div className="w-20 bg-dark-100 rounded-r-xl flex flex-row justify-center items-center ">
                <FaRegSmile className="text-2xl text-light-300" />
              </div>
            </div>
            <div className="w-full h-5 text-light-300 text-md mt-1 ml-1 font-roboto flex flex-row items-center">
              {typing && (
                <>
                  <span className="mr-2">
                    <BeatLoader color="#e09f3e" size={6} />
                  </span>
                  <span>{typing.username} is typing</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default withAuth(Chat);
