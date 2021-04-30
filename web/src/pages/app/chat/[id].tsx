import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { FaHashtag, FaRegSmile } from 'react-icons/fa';
import { ImAttachment } from 'react-icons/im';
import {
  IncomingLoadMessagesMessage,
  IncomingSocketChatMessage,
  OutgoingLoadMessagesMessage,
  OutgoingSocketChatMessage
} from '../../..';
import ChatMessage from '../../../components/App/Chat/ChatMessage';
import ContentNav from '../../../components/App/ContentNav';
import Layout from '../../../components/App/Layout';
import { genericErrorMessage } from '../../../constants';
import { MessageSnippetFragment, useThreadQuery } from '../../../generated/graphql';
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

  const [messageInputValue, setMessageInputValue] = useState<string>('');
  const messageInputValueRef = useRef('');
  messageInputValueRef.current = messageInputValue;

  const scrollDown = () => {
    const feed = document.querySelector('#chat-feed');
    if (feed) feed.scrollTop = feed.scrollHeight;
  };
  const ws = socket.connect();

  useEffect(() => {
    if (!isServer()) {
      try {
        ws &&
          ws.addEventListener('message', (e) => {
            console.log(e);
            const { data: m } = e;
            const incoming = JSON.parse(m);
            if (incoming.code === 3000) {
              const { message } = incoming as IncomingSocketChatMessage;
              const currentMessages = [...messagesRef.current];
              currentMessages.push(message as MessageSnippetFragment);
              setMessages(currentMessages);
              scrollDown();
            } else if (incoming.code === 3003) {
              const { messages: incomingMessages, hasMore } = incoming as IncomingLoadMessagesMessage;
              console.log(incomingMessages, hasMore);
            } else if (incoming.code === 3005) {
              if (incoming.value === 'ok') {
                const payload = {
                  code: 3003,
                  threadId,
                  limit: 30,
                  cursor: null
                } as OutgoingLoadMessagesMessage;

                console.log('Sent request for messages', payload, ws.readyState);
                ws.send(JSON.stringify(payload));
              }
            }
          });

        ws &&
          ws.addEventListener('open', () => {
            console.log('WS open', ws.readyState, ws.OPEN);
            // console.log('client listener added');

            const messageInput = document.getElementById('message-input')!;
            messageInput.addEventListener('keyup', (e) => {
              if (!e.repeat && e.key === 'Enter') {
                const payload = {
                  code: 3000,
                  threadId,
                  content: messageInputValueRef.current
                } as OutgoingSocketChatMessage;

                try {
                  ws.send(JSON.stringify(payload));
                } catch (err) {
                  console.error('err: ', err);
                }
              }
            });
          });
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  return (
    <>
      <Head>
        <title>Biscit | Chat </title>
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
            {messages?.map((message) => {
              const { user, id: messageId, content } = message;
              return <ChatMessage sender={user.username} time="10:25" content={content} key={messageId} />;
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
            <div className="w-full h-5 text-light-300 text-md mt-1 ml-1 font-roboto">janstaffa is typing...</div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default withAuth(Chat);
