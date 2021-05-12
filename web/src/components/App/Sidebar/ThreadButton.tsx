import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import { TypingMessage } from '../../..';
import { MessageSnippetFragment } from '../../../generated/graphql';
import { socket } from '../../../utils/createWSconnection';
import { isServer } from '../../../utils/isServer';

export interface ThreadButtonProps {
  name: string;
  time: string;
  latestMessage: MessageSnippetFragment | undefined | null;
  unread: boolean;
  threadId: string;
  active?: boolean;
}

const ThreadButton: React.FC<ThreadButtonProps> = ({ name, time, latestMessage, unread, threadId, active = false }) => {
  const [displayMessage, setDisplayMessage] = useState<string | null | undefined>();
  const [currentLatestMessage, setCurrentLatestMessage] = useState<string | null | undefined>();
  const currentDisplayMessageRef = useRef<string | null | undefined>();
  currentDisplayMessageRef.current = currentLatestMessage;

  useEffect(() => {
    const ws = socket.connect();
    if (isServer() || !ws) return;

    let resetTyping: NodeJS.Timeout | null;
    const handleMessage = (e) => {
      const { data: m } = e;
      const incoming = JSON.parse(m);

      if (incoming.code === 3006) {
        const { username: incomingUsername, threadId: incomingThreadId } = incoming as TypingMessage;
        if (incomingThreadId === threadId) {
          setDisplayMessage(`${incomingUsername} is typing...`);
          if (resetTyping) {
            clearTimeout(resetTyping);
            resetTyping = null;
          }
          resetTyping = setTimeout(() => {
            setDisplayMessage(currentDisplayMessageRef.current);
          }, 2000);
        }
      }
    };
    try {
      ws.addEventListener('message', handleMessage);
    } catch (err) {
      console.error(err);
    }

    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, []);

  useEffect(() => {
    if (latestMessage) {
      setDisplayMessage(latestMessage.content);
      setCurrentLatestMessage(latestMessage.content);
    }
  }, [latestMessage]);

  return (
    <Link href={`/app/chat/${threadId}`}>
      <div className={'py-1 rounded-sm' + (active ? '  bg-dark-50' : ' hover:bg-dark-100 hover:text-light-hover')}>
        <div className="w-full h-16 flex flex-row items-center cursor-pointer py-2">
          <div className="w-16 h-full flex flex-col justify-center items-center">
            <div className="w-11 h-11 rounded-full bg-light"></div>
          </div>
          <div className="w-full flex-1 px-2">
            <div className="flex flex-col">
              <div className="flex flex-row justify-between items-center">
                <div className=" text-light font-roboto">{name}</div>
                <div className=" text-light-200 text-sm font-roboto">{time}</div>
              </div>
              <div className=" w-full flex flex-row justify-between">
                <div className="text-light-300 w-48 font-roboto text-sm truncate">
                  {displayMessage || 'no messages yet'}
                </div>
                <div className="w-8 flex flex-row justify-center items-center">
                  {unread && <div className="w-4 h-4 bg-light rounded-full"></div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ThreadButton;
