import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { FaRegSmile } from 'react-icons/fa';
import { ImAttachment } from 'react-icons/im';
import { BeatLoader } from 'react-spinners';
import { OutgoingSocketChatMessage, SocketThreadMessage, TypingMessage } from '../../..';
import { useWebSocketStore } from '../../../stores/useWebSocketStore';
import { socket } from '../../../utils/createWSconnection';
import { isServer } from '../../../utils/isServer';

const ChatBottomBar: React.FC = () => {
  const router = useRouter();
  if (!router.query.id) {
    router.replace('/app/friends/all');
    return null;
  }
  const threadId = typeof router.query.id === 'object' ? router.query.id[0] : router.query.id || '';

  const [typing, setTyping] = useState<{ username: string } | null>(null);
  const [messageInputValue, setMessageInputValue] = useState<string>('');
  const messageInputValueRef = useRef<string>('');
  messageInputValueRef.current = messageInputValue;

  useEffect(() => {
    setMessageInputValue('');
    const ws = socket.connect();
    if (!isServer() && ws) {
      let resetTyping;
      const handleMessage = (e) => {
        const { data: m } = e;
        const incoming = JSON.parse(m);
        if (incoming.code === 3006) {
          const { username, threadId: incomingThreadId } = incoming as TypingMessage;
          if (incomingThreadId !== threadId) return;

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
      const handleInput = () => {
        const messageInput = document.getElementById('message-input')! as HTMLInputElement;
        messageInput.addEventListener('keyup', (e) => {
          if (!e.repeat && e.key === 'Enter') {
            const value = messageInputValueRef.current;
            if (!value || value === ' ') {
              return;
            }
            const urlArr = window.location.pathname.split('/');

            const payload = {
              code: 3000,
              threadId: urlArr[urlArr.length - 1],
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
      try {
        ws.addEventListener('message', handleMessage);

        if (!useWebSocketStore.getState().ready) {
          ws.addEventListener('open', handleInput);
        } else {
          handleInput();
        }
      } catch (err) {
        console.error(err);
      }

      return () => {
        ws.removeEventListener('message', handleMessage);
        ws.removeEventListener('open', handleInput);
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

  return (
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
  );
};

export default ChatBottomBar;
